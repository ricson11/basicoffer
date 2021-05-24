const express = require('express');
const router = express.Router();
const {checkUser, checkAdmin, checkSuper} = require('../helpers/auth');


require('../models/Post');
require('../models/User');

//Add new post route//

router.get('/post/new', checkAdmin, (req, res)=>{

 res.render('posts/new');
});





   router.post('/post',  async(req, res)=>{
       try{
        let allowComment;
         if(req.body.allowComment){
             allowComment = true;
         }else{
             allowComment = false;
         }
          
         let errors = [];
          let exist = await Post.findOne({title: req.body.title})
          if(exist){
              errors.push({text: 'This post title already exist'})
          }
          if(errors.length > 0){
              res.render('posts/new', {
                errors: errors,
                title: req.body.title,
                allowComment: allowComment,
                detail: req.body.detail,
              });
          }else{
        let newPost={
             title: req.body.title,
             allowComment: allowComment,
             detail: req.body.detail,
        }

        await Post.create(newPost);
         console.log(newPost)
         req.flash('success_msg', 'New post added')
         res.redirect('/admin');
    }
   }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
   });

  

//Post detail route //

router.get('/post/:slug', async(req, res)=>{
    try{
       let post = await Post.findOne({slug: req.params.slug}).populate('comments');
        post.views++;
        post.save();
   //pagination
   const page = parseInt(req.query.page)||1
   const limit = parseInt(req.query.limit)||3
   const count =await Post.countDocuments({})
   const pages = Math.ceil(count/limit)
   let nextIndex = (page+1)
   let startIndex = (page-1)
  
    if(nextIndex > pages){
       nextIndex=false;
    }
  
      let recents = await Post.find({slug:{$nin:post.slug}}).skip((limit*page)-limit).sort({date:-1}).limit(limit);
        res.render('posts/show', {recents, page, limit, nextIndex, startIndex, post, title: `${post.title} | Basicoffer`});
    
}
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});






   //Post edit route

router.get('/edit/post/:slug', checkAdmin, async(req, res)=>{
    try{
        let post = await Post.findOne({slug: req.params.slug})
         res.render('posts/edit', {post});
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//Post update route

router.put('/post/:slug', async(req, res)=>{
    try{
        let allowComment;
         if(req.body.allowComment){
             allowComment = true;
         }else{
             allowComment = false;
         }
          
         let post = await Post.findOne({slug: req.params.slug})
              if(!post){
                  req.flash('error_msg', 'This post might have been deleted or other errors')
                  return res.redirect('back');
              }else{
                  post.title = req.body.title,
                  post.detail = req.body.detail,
                  post.allowComment = allowComment,
                  post.save();
                  console.log(post);
                  req.flash('success_msg', 'Post updated')
                  res.redirect('/admin');
              
          }
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//Confirm post delete

router.get('/delete/:slug', checkAdmin, async(req, res)=>{
    try{
       let post = await Post.findOne({slug: req.params.slug});
       res.render('posts/delete_post', {post})
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//Post delete route

router.get('/delete/post/:slug', async(req, res)=>{
    try{
       let post = await Post.findOne({slug: req.params.slug})
       if(!post){
           req.flash('error_msg', 'This post has already been removed')
           return res.redirect('back');
       }else{
           post.remove();
           req.flash('success_msg', 'Posted deleted')
           res.redirect('/admin');
       }
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//Getting search results//

router.get('/search', async(req, res)=>{
    try{
        const {query} = req.query;
        let q = new RegExp(query, 'i');
            
   //pagination
   const page = parseInt(req.query.page)||1
   const limit = parseInt(req.query.limit)||9
   const count =await Post.countDocuments({title:q})
   const pages = Math.ceil(count/limit)
   let nextIndex = (page+1)
   let startIndex = (page-1)
  
    if(nextIndex > pages){
       nextIndex=false;
    }
        let search = await Post.find({$or:[{title:q}, {detail:q}]}).sort({date:-1}).skip((limit*page)-limit).limit(limit);
       res.render('posts/results', {search, nextIndex, startIndex, page, limit, query, title: `Search results for ${query} `});
    }
    catch(err){
        console.log(err.message);
    }

});


// Post comment

router.post('/comment/post/:slug', async(req, res)=>{
     try{
    let post = await Post.findOne({slug: req.params.slug})
        
      let newComment={
           commentBody: req.body.commentBody,
      }
       post.comments.unshift(newComment);
       post.save();
       res.redirect('/post/'+post.slug);
     }
     catch(err){
         console.log(err.message)
     }
});




module.exports = router;