const mongoose=require('mongoose');

const replySchema=new mongoose.Schema({
    content:{type:String,required: true},
    user:{type:mongoose.Schema.Types.ObjectId,ref:'Users'},
    name:{type:String},
    originalCommentAuthor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt:{type:Date,default:Date.now}
})


const commentSchema=new mongoose.Schema({
    content:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users'
    },
    replies:[replySchema]

})
const Comments=mongoose.model('Comments',commentSchema);

module.exports=Comments;