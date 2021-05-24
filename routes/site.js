const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const env = require('dotenv');

env.config({path: './.env'});

require('../models/Post');
require('../models/User');

const {checkUser} = require('../helpers/auth');

//main page

router.get('/', async(req, res)=>{
  
    //pagination
    const page = parseInt(req.query.page)||1
    const limit = parseInt(req.query.limit)||9
    const count =await Post.countDocuments({});
    const pages = Math.ceil(count/limit)
    let nextIndex = (page+1)
    let startIndex = (page-1)
   
     if(nextIndex > pages){
        nextIndex=false;
    }
    let posts = await Post.find({}).sort({date:-1}).skip((limit*page)-limit).limit(limit);

    res.render('index', {posts, page, limit, nextIndex, startIndex, title: 'Basicoffer'});
});

//about page


router.get('/about', (req, res)=>{
    res.render('about');
});

//contact page


router.get('/contact', (req, res)=>{
    res.render('contact');
});


//disclaimer page


router.get('/disclaimer', (req, res)=>{
    res.render('disclaimer');
});

//privacy page


router.get('/privacy', (req, res)=>{
    res.render('privacy');
});

//Getting admin page//
router.get('/admin', checkUser, async(req, res)=>{
   
    //pagination
    const page = parseInt(req.query.page)||1
    const limit = parseInt(req.query.limit)||7
    const count =await Post.countDocuments({});
    const pages = Math.ceil(count/limit)
    let nextIndex = (page+1)
    let startIndex = (page-1)
   
     if(nextIndex > pages){
        nextIndex=false;
    }
    let posts = await Post.find({}).sort({date:-1}).skip((limit*page)-limit).limit(limit);
    let tops = await Post.find({}).sort({views:-1}).limit(3);
    res.render('dashboard', {posts,tops, page, limit, nextIndex, startIndex, title: 'Admin - Basicoffer'});
});


//Getting search for admin//

router.get('/find', async(req, res)=>{
    const {query} = req.query;
    let q = new RegExp(query, 'i');
    let finds = await Post.find({$or:[{title:q}, {detail:q}]});
    res.render('dashboard', {finds, query});
});


//contact form


router.post('/contact', async(req, res)=>{
    try{
   
    
     let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        tls:{
            rejectUnauthorized: false,
        },
        auth:{
         user: process.env.GMAIL_EMAIL,
         pass:process.env.GMAIL_PASS
        },
    });

     var mailOptions={
                   from: req.body.sender,
                   to: process.env.GMAIL_EMAIL,
                   replyTo: req.body.sender,
                   subject: 'Message from' +' '+ req.body.sender,
                   text: req.body.contactBody,
          };
       
         transporter.sendMail(mailOptions, function(err, info){
           if(err){
               console.log(err)
               req.flash('error_msg', 'Message not sent, try again')
               return res.redirect('back')
           }else{
               console.log('Message sent successfully' + info.response)
               req.flash('success_msg', 'Message delivered successfully')
               return res.redirect('/');
           }
       })
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});




module.exports = router;