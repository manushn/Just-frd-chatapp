const express=require('express');
const router=express.Router();
const bcrypt=require('bcryptjs');
const dotenv=require('dotenv');
const UserModel=require('../schemas/userschema');


router.post("/signup",async (req,res)=>{
    const {username,name,email,password}=req.body;
    

    if(!username||!name||!email||!password){
        return res.status(203).json({message:"All fields are required"});
    }

    try{
   
        const usernamefind =await UserModel.findOne({username:username});
        const emailfind=await UserModel.findOne({email:email})

        if(usernamefind&&emailfind){
            return res.status(203).json({message:"Username And Email Already Taken!"});
        }else if(emailfind){
            return res.status(203).json({message:"Email Already Taken!"})
        }else if(usernamefind){
            return res.status(203).json({message:"Username Already Taken!"})
        }else{

            const hashedpassword = await bcrypt.hash(password,12);

            const newUser=new UserModel({
                username,
                name,
                email,
                password:hashedpassword,
            });

            await newUser.save();
            res.status(200).json({message:"User Created",success:true})

        }


    }catch(error){
        console.log(error);
        return res.status(400).json({message:"Error"});

    }

})
 

module.exports=router;