require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();
const port =process.env.PORT || 3000;
const Users = require('./models/Users')
const Comments = require('./models/Comments')


app.use(cors());
app.use(bodyParser.json());


const mongo= process.env.MONGODB_URI
mongoose.connect(mongo)
    .then(() => {
        console.log('Mongodb connected');
    })
    .catch((error) => {
        console.log('Error connecting the server');
    })


app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('reached here')
    if (!username || !email || !password) {
        return res.status(401).json({ error: 'please provide all the input fields i.e Username , Email and Password' });
    }
    const newUser = new Users({ username, email, password });
    
    try {
        
        const savedUser = await newUser.save();
        
        res.status(200).json(savedUser);
        
    } catch (error) {
        
        if (error.code === 11000) {
           
            return res.status(400).json({ error: 'This user has already been registered' })
            
        }
        console.error('Error resitering user')
        return res.status(500).json({ error: 'Error registering the User' });
    }

})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(401).json({ error: 'Please provide all the credentials' });
    }
    const user = await Users.findOne({ email });
    try {
        if (user) {
            const isMatch = user.password === password;
            if (isMatch) {
                return res.status(200).json(user);
            }
            else {
                return res.status(401).json({ error: 'Incorrect Password' });
            }
        }
        else {
            return res.status(402).json({ error: 'Please Sign Up' })
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error occured while Loging In' })
    }

})

app.post('/comment', async(req, res) => {
    const { content, user } = req.body;
    if (!content || !user) {
        return res.status(400).json({ error: 'Please write something to post comment' });
    }
    const comment=  new Comments({content,user:user._id});
    try{
        const savecomment=await comment.save();
        await savecomment.populate('user','username')
        res.status(200).json(savecomment);
    }catch(error){
        res.status(500).json({error:'Error posting comments'});
    }

})

app.get('/comment',async(req,res)=>{
    try{
        const comments=await Comments.find().populate('user','username');
        res.status(200).json(comments);
    }catch(error){
        res.status(500).json({error:'Error fetching comments'})
    }
})

app.delete('/comment/:commentId',async(req,res)=>{
    const {commentId}=req.params;
    const{username}=req.query;
    try{
        const comment = await Comments.findOneAndDelete({_id:commentId,user:username});
        if(!comment){
            return res.status(404).json({error:"Comment not found"});
            
        }
        
        res.status(200).json({message:'comment deleted'});
        
    }catch(error){
        console.error('Error deleting comment:',error);
            res.status(500).json({error:'Failed to delete the comment'})
        
    }
})

app.post('/comment/:commentId/replies',async(req,res)=>{
   
    const{commentId}=req.params;
    const {content,userId,name,originalCommentAuthor}=req.body;
    
    
    try{
        
        const comment=await Comments.findById(commentId).populate('user');
    
        if(!comment){
            
            return res.status(404).json({message:'Comment not found 1'})
        }
        const reply={
            content,
            user:userId,
            name:name,
            originalCommentAuthor
        };
        
        comment.replies.push(reply);
        
        await comment.save();
        

        res.status(201).json(comment);
    }catch(error){
        res.status(500).json({message:'server error',error:error.message});
    }
})


app.delete('/comment/:commentId/replies/:replyId', async (req, res) => {
    const { commentId, replyId } = req.params;
    console.log(commentId, replyId)
    try {
        // Find the comment and remove the reply
        const updatedComment = await Comments.findByIdAndUpdate(
            commentId,
            { $pull: { replies: { _id: replyId } } },
            { new: true }
        );

        if (!updatedComment) {
            return res.status(404).send({ message: 'Comment not found' });
        }

        res.status(200).send(updatedComment);
    } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});


app.listen(port, () => {
    console.log('Server running on Port', port);
})
