const mongoose =require("mongoose");

const userSchema = new mongoose.Schema({
    username:{type:String,require:true,unique:true},
    name:{type:String,require:true},
    email:{type:String,require:true,unique:true},
    password:{type:String,default:11111},
    friends:[{type:String}],
    lastseen:{type:Date,default:Date.now},
    online:{type:Boolean,default:false}
});

module.exports=mongoose.model("user",userSchema);