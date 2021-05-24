const mongoose = require('mongoose');
const slugify = require('slugify');

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    
    title:{
        type: String,
    },

    allowComment:{
        type: Boolean,
        default: true
    },

    detail:{
        type: String,
     },
     
     views:{
        type: Number,
        default: 0
    },

    slug:{
        type: String,
        unique: true,
        required: true
    },
  
     comments:[{
         commentBody:{
             type: String,
         },

         commentDate:{
             type: Date,
             default: Date.now
         }
     }],
    date:{
        type: Date,
        default: Date.now
    },
});


PostSchema.pre('validate', function(){
    if(this.title){
        this.slug = slugify(this.title, {lower: true, strict: true})
    }
});


module.exports = Post = mongoose.model('posts', PostSchema);
