const express = require('express');
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const session = require('express-session');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const env = require('dotenv');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const path = require('path');

const {formatNow, formatDate, stripTags, truncate} = require('./helpers/hps');

require('./config/passport')(passport);

env.config({path: './.env'});

//Setting express//
const app = express();

//Mongodb database setting//

 mongoose.promise = global.promise;

 //Development
 mongoose.connect(process.env.mongoLocal, {
     useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true
 })
 .then(()=>console.log('Mongodb is now connected to server' + " " + app.get('port')))
 .catch(err=>console.log(err)); 

 //Production 
/*
 mongoose.connect(process.env.mongoConnect, {
     useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true
 })
 .then(()=>console.log('Mongodb is now connected to server' + " " + app.get('port')))
 .catch(err=>console.log(err));  */


 

 app.engine('handlebars', exphbs({
     helpers:{
         formatNow: formatNow,
         formatDate: formatDate,
         stripTags: stripTags,
         truncate: truncate
     },
     handlebars: allowInsecurePrototypeAccess(Handlebars),
     defaultLayout: 'main'
 }))
 app.set('view engine', 'handlebars');

//Express body parser//
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(methodOverride('_method'));

/*
app.use(session({
    secret: 'secret',
    resave:false,
    saveUninitialized:false,
   store: MongoStore.create({mongoUrl: process.env.mongoConnect})
     
})); */


app.use(session({
    secret: 'secret',
    resave:false,
    saveUninitialized:false,
   store: MongoStore.create({mongoUrl: process.env.mongoLocal})
     
})); 




app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function(req, res, next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
      next();
});

//Bring in routers//
app.use('/', require('./routes/site'));
app.use('/', require('./routes/post'));
app.use('/', require('./routes/user'));


app.use('/font-awesome', express.static(__dirname + '/node_modules/font-awesome'));
app.use('/ckeditor', express.static(__dirname + '/node_modules/ckeditor'));

 app.use(express.static(path.join(__dirname, 'public')));



//500 server error page
app.get('/500', (req, res)=>{
    res.render('errors/500')
});

//show 404 page if page is not found
app.use(function(req, res){
    res.status(404).render('errors/404')
});


//Set the server 

app.set('port', process.env.PORT || 350);

app.listen(app.get('port'), ()=>console.log('Server is running on port' +" "+ app.get('port')));





