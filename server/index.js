const express=require('express');
const http = require('http');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');


const mongoose = require('mongoose');
const dotenv =require('dotenv');

const Signup=require("./auth/Signup");
const Login=require("./auth/Login");
const initializeSocket=require("./socket/socketmain");
const Passwordreset=require("./auth/passreset");

dotenv.config();

const app=express();
const server=http.createServer(app);

app.use(cors({
  origin: ["http://192.168.1.23:5173", "http://localhost:5173"]
  
}));
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI 

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));



app.use('/',Signup);
app.use('/',Login);
app.use('/',Passwordreset);

initializeSocket(server);

// Start the Server After DB Connection
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});