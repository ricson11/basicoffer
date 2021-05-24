const mongoose = require('mongoose');
const slugify = require('slugify');
const Schema = mongoose.Schema;

const UserSchema = new Schema({

    username:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    isAdmin:{
        type: Boolean,
        default: false
    },
   
    emailToken: String,
     superAdmin: Boolean,
     isVerified: Boolean,
     resetPasswordToken:String,
     resetPasswordExpires: Date,

    slug:{
        type: String,
        unique: true,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now,
    },

});




UserSchema.pre('validate', function(){
    if(this.username){
        this.slug = slugify(this.username, {lower: true, strict: true})
    }
});


module.exports = User = mongoose.model('users', UserSchema);