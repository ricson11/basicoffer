const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const passport = require('passport');
const async = require('async');
const env = require('dotenv');

env.config({path: '../.env'});

require('../models/User');

const {checkVerified, checkSuper} = require('../helpers/auth');

router.get('/admin/register', (req, res)=>{
    res.render('users/register')
})


router.get('/admin/login', (req, res)=>{
    res.render('users/login');
});

router.post('/register', async(req, res)=>{
        try{
             let errors=[];
              
             if(req.body.password!=req.body.password2){
                 errors.push({text: 'Password do not match'})
             }
             if(req.body.password.length < 4){
                 errors.push({text: 'Password must be atleast 4 characters'});
             }
           
             let checkEmail = await User.findOne({email: req.body.email})
                 if(checkEmail){
                     errors.push({text: 'This email already exist'})
                 }
                 let checkUser = await User.findOne({username: req.body.username})
                 if(checkUser){
                     errors.push({text: 'This user already exist'})
                 }
                 if(errors.length>0){
                     res.render('users/register', {
                         errors: errors,
                         username: req.body.username,
                         email: req.body.email,
                        password: req.body.password,
                        password2: req.body.password2,
                        
                     })
                 }else{
                      let newUser={
                        username: req.body.username,
                        email: req.body.email,
                       password: req.body.password,
                       emailToken: crypto.randomBytes(64).toString('hex'),
                       isVerified: false,
                      }
                      if(req.body.username == process.env.superAdmin){
                          newUser.superAdmin=true;
                      }else{
                          newUser.superAdmin=false;
                      }
                      if(req.body.isAdmin){
                          newUser.isAdmin = true;
                      }else{
                          newUser.isAdmin=false;
                      }
                      bcrypt.genSalt(10, (err, salt)=>{
                        bcrypt.hash(newUser.password, salt, (err, hash)=>{
                            if(err) throw err;
                            newUser.password = hash;
                            console.log(newUser)
                            User.create(newUser, async function (err, user){
                                if(err){
                                    req.flash('error_msg', err.message)
                                    return res.redirect('/admin/register')
                                }
                                let transporter = nodemailer.createTransport({
                                    host: 'smtp.gmail.com',
                                    port: 465,
                                    secure: true,
                                    auth: {
                                        user: process.env.GMAIL_EMAIL,
                                        pass:process.env.GMAIL_PASS,
                                       
                                    },
                                    tls:{
                                      rejectUnauthorized:false,
                                    }
                                });
                                var mailOptions = {
                                    to: user.email,
                                    from: 'Basicoffer <noreply.'+process.env.GMAIL_EMAIL+'>',
                                    subject: 'Basicoffer - verify your email',
                                    text: 'You are receiving this because you (or someone else) have created Basicoffer admin account.\n\n' +
                                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                                    'http://' + req.hostname + '/verify-email/' + user.emailToken + '\n\n' +
                                    'If you did not create this, please ignore this email.\n',
                        
                                    
                                    };
                                 
                                  transporter.sendMail(mailOptions, function(err, info){
                                    if(err){
                                        console.log(err)
                                        req.flash('error_msg', 'Message not sent, try again')
                                        return res.redirect('back')
                                    }else{
                                        console.log('Verification email sent' + info.response)
                                        req.flash('success_msg', 'Verification email has been sent to your email')
                                        return res.redirect('/admin/login')
                                    }
                                })
                                //Verification email end
                            })
                        })
                    })
                 }
               }
        catch(err){
            console.log(err.message)
            res.redirect('/500')
        }
});

//Gettin verification token

router.get('/verify-email/:token', async(req, res, next)=>{
    try{
        let user = await User.findOne({emailToken: req.params.token});
        console.log(user)
        if(!user){
            req.flash('error_msg', 'No user found')
            res.redirect('/')
        }
        user.emailToken = null;
        user.isVerified = true;
        await user.save();
        await req.login(user, async(err)=>{
            if(err) return next(err);
            req.flash('success_msg', 'Admin account verified')
            console.log(user)
           res.redirect('/admin');
        })
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});


//login route

router.post('/login', checkVerified, async(req, res, next)=>{
    try{
     passport.authenticate('local', (err, user, info)=>{
        if(err) throw next(err);
        if(!user){
            req.flash('error_msg', 'Incorrect credentials')
            return res.redirect('back')
        }
        req.login(user, (err)=>{
            if(err) throw next(err);
            if(req.user.superAdmin || req.user.isAdmin){
                req.flash('success_msg', 'Welcome' + ' ' + req.user.username)
                return res.redirect('/admin');
            }else{
                req.flash('success_msg', 'You logged in sucessfully')
                res.redirect('/admin');
            }
        })
    })(req, res, next);
}
 catch(err){
    console.log(err.message)
    res.redirect('/500');
}
});


router.get('/admin/logout', (req, res)=>{
    try{
    req.logout();
    req.flash('success_msg', 'You logged out')
    res.redirect('/')
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//Get update password route

router.get('/change-password/:slug', async(req, res)=>{
    try{
        let user = await User.findOne({slug: req.params.slug})
        if(!user){
            req.flash('error_msg', 'User does not exist' )
            return res.redirect('back');
        }else{
            res.render('users/edit_pass', {user})
        }
    }
    catch(err){
        console.log(err.message)
        res.rediect('/500');
    }
})

//Updte password
router.put('/change-password/:slug', async(req, res)=>{
    try{
        let errors=[];
        if(req.body.password != req.body.password2){
        errors.push({text: 'Password do not match'})
        }
        if(req.body.password.length < 4){
            errors.push({text: 'Password must be atleast 4 characters'})
            }
        if(errors.length > 0){
            return res.render('users/edit_pass', {
                errors: errors,
            });
        }else{
       let user = await User.findOne({slug: req.params.slug})
       if(!user){
           req.flash('error_msg', 'User does not exist')
           return res.redirect('back');
       }else{
            user.password = req.body.password,
            bcrypt.genSalt(10, (err, salt)=>{
                bcrypt.hash(user.password, salt, (err, hash)=>{
                 if(err) throw err;
                 user.password = hash;
                 user.save();
                 console.log(user);
                 req.flash('success_msg', 'Password updated')
                 res.redirect('/admin')
             })   
          })
           
       }
    }
}
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//Getting site admins

router.get('/admin/site', checkSuper, async(req, res)=>{
    try{
     let users = await User.find({}).sort({date:-1});
     res.render('myadmins', {users})
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//Edit admin route

router.get('/edit/admin/:slug', async(req, res)=>{
    try{
     let user = await User.findOne({slug: req.params.slug});
     res.render('users/edit', {user});
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});


//Update admin

router.put('/admin/:slug', async(req, res)=>{
    try{
         let isAdmin;
         if(req.body.isAdmin){
            isAdmin=true;
        }else{
            isAdmin=false;
        }
       
        let user = await User.findOne({slug: req.params.slug});
        if(!user){
            req.flash('error_msg', 'THis user does no exist')
            return res.redirect('back');
        }else{
             user.isAdmin = isAdmin,
            user.save();
            console.log(user)
            req.flash('success_msg', 'Admin updated');
            res.redirect('/admin/site');
        }
       
       }
       catch(err){
           console.log(err.message)
           res.redirect('/500');
       }

});


//Confirm post delete

router.get('/delete/user/:slug', async(req, res)=>{
    try{
       let user = await User.findOne({slug: req.params.slug});
       res.render('users/delete_user', {user})
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//Delete admin route

router.get('/delete/admin/:slug', async(req, res)=>{
     try{
      let user = await User.findOne({slug: req.params.slug})
      if(!user){
          req.flash('error_msg', 'This admin does not exist')
          return res.redirect('back');
      }else{
          user.remove();
          req.flash('success_msg', 'User deleted')
          res.redirect('/admin/site');
      }
     }
     catch(err){
         console.log(err.message)
         res.redirect('/500');
     }
});




  //forgot password page

  router.get('/admin/forgot-password', (req, res)=>{
    res.render('users/forgot', {title: 'Forgot Password - Basicoffer'})
});

/*router.get('/admin/reset', (req, res)=>{
    res.render('users/reset', {title: 'Reset Password - Eduline'})
}); */

//Posting forgot password

router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error_msg', 'No account with that email address exists.');
            return res.redirect('back');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        let transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass:process.env.GMAIL_PASS
             
          },
          tls:{
            rejectUnauthorized:false,
          }
      });
        var mailOptions = {
          to: user.email,
          from: 'Basicoffer <noreply.'+process.env.GMAIL_EMAIL+'>',
          subject: 'Basicoffer Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.hostname + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        transporter.sendMail(mailOptions, function(err) {
          req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/admin/forgot-password');
    });
  });

  //end of forgot password

//Gettin the reset token


router.get('/reset/:token', function(req, res) {
User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
  if (!user) {
    req.flash('error_msg', 'Password reset token is invalid or has expired.');
    return res.redirect('/admin/forgot-password');
  }else{
  res.render('users/reset',{token: req.params.token})
  }
});
});




//Reset password

router.post('/reset/:token', function(req, res) {
async.waterfall([
  function(done) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error_msg', 'Password reset token is invalid or has expired.');
        return res.redirect('back');
      }
        if(req.body.password.length < 4){
           req.flash('error_msg', 'Password must be atleast 4 character.')
           return res.redirect('back')
        }
       if(req.body.password === req.body.password2){

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
            
       bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(user.password, salt, (err,hash)=>{
         if(err) throw err;
        user.password = hash;
        console.log(user.password)
      user.save(function(err) {
        req.logIn(user, function(err) {
          done(err, user);
        });
      });
    });
    });
  } else{
    req.flash('error_msg', 'Passwords do not match.');
     return res.redirect('back');
  }
  })
  },
  function(user, done) {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass:process.env.GMAIL_PASS
         
      },
      tls:{
        rejectUnauthorized:false,
      }
  });
    var mailOptions = {
      to: user.email,
      from: 'Basicoffer <noreply.'+process.env.GMAIL_EMAIL+'>',
      subject: 'Your password has been changed',
      text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
    };
    transporter.sendMail(mailOptions, function(err) {
     
      req.flash('success_msg', 'Success! Your password has been changed.');
      done(err);
    });
  }
], function(err) {
    if(err){
    console.log(err.message)
   res.redirect('/500');
    }
  res.redirect('/admin');
});
});

//Geting login admin route
router.get('/admin/:slug', async(req, res)=>{
  try{
      let user = await User.findOne({slug: req.params.slug})
      if(user){
       req.flash('success_msg', 'Welcome admin, please login')

        return res.redirect('/admin/login')
      }else{
       req.flash('error_msg', 'Unauthorized !')
       res.redirect('/')
      }
  }
  catch(err){
    console.log(err.message)
    res.redirect('/500');
  }
});




module.exports = router;