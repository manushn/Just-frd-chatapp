const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");

const UserModel=require("../schemas/userschema");

dotenv.config();

const ConnectedUsers = {};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://192.168.1.23:5173", "http://localhost:5173"],
      
    },
  });

  // Middleware to authenticate using encrypted JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    console.log("Token received");

    if (!token) {
      console.log("No token provided");
      return next(new Error("Authentication error: Token required"));
    }

    try {
      const decryptJWT = (encryptedJwt) => {
        const bytes = CryptoJS.AES.decrypt(encryptedJwt, process.env.ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
      };

      const decryptedToken = decryptJWT(token);

      jwt.verify(decryptedToken, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
          console.log(err);
          return next(new Error("Authentication error: Invalid token"));
        }
        socket.user = decoded;
        next();
      });
    } catch (error) {
      return next(new Error("Authentication error: Failed to decrypt"));
    }
  });

  io.on("connection", (socket) => {
    const username = socket.user.username;
    ConnectedUsers[username] = socket.id;

    console.log(`✅ User connected: ${username} (${socket.id})`);


//------------------------------------------------------------------------------------------
    socket.on("sendMessage", (receiver, messagedata) => {
      console.log(`📨 ${username} ➡️ ${receiver}: ${messagedata}`);

      const receiverSocketId = ConnectedUsers[receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("NewMessage", {
          sender: username,
          receiver,
          message: messagedata,
        });
      } else {
        console.log("❌ Receiver not connected");
      }
    });
//------------------------------------------------------------------------------------------

socket.on("Searchuser", async (searchuser) => {
  

  const requesterSocketId = ConnectedUsers[username]; 
  if (!searchuser || !requesterSocketId) {
    console.log("Invalid search request: Missing search query or requester socket ID.");
    return;
  }

  try {
    const userlist = await UserModel.find({
      username: { $regex: searchuser, $options: "i" } // contains search value (case-insensitive)
    });

    const result = userlist.length > 0 
      ? userlist.map(user => user.username) 
      : [];
    
    io.to(requesterSocketId).emit("SearchUserDetails", result);

  } catch (err) {
    console.error("Error during user search:", err);
    io.to(requesterSocketId).emit("SearchUserDetails", {
      error: "An error occurred while searching"
    });
  }
});


//------------------------------------------------------------------------------------------
socket.on("Add_Friend", async (addfriendname) => {
  console.log(`Adding friend ${addfriendname} to ${username}`);
  const requesterSocketId = ConnectedUsers[username];

  if (!addfriendname || !username || !requesterSocketId) {
    console.log("Invalid request: Missing data.");
    return;
  }if(addfriendname===username){
    return;
  }


  try {
    const user = await UserModel.findOne({ username: username });
    const feduser = await UserModel.findOne({ username: addfriendname });

    if (!feduser) {
      return io.to(requesterSocketId).emit("Responsedata", {
        Responsedata: "Username not found"
      });
    }

   
    if (user.friends.includes(addfriendname)) {
      return io.to(requesterSocketId).emit("Responsedata", {
        Responsedata: "User already Friend"
      });
    }

    
    await UserModel.findOneAndUpdate(
      { username: username },
      { $addToSet: { friends: addfriendname } }
    );

   
    const fuser = await UserModel.findOne({ username }).lean()
    return io.to(socket.id).emit("FriendList", fuser.friends || []);

  } catch (err) {
    console.log(err);
    io.to(requesterSocketId).emit("Responsedata", {
      Responsedata: "An error occurred while adding friend"
    });
  }
});


//------------------------------------------------------------------------------------------

socket.on("getFriendList", async () => {
  try {
    const user = await UserModel.findOne({ username }).lean();

    if (!user) {
      return io.to(socket.id).emit("FriendList", []);
    }

    // emit the list of friends
    io.to(socket.id).emit("FriendList", user.friends || []);
  } catch (err) {
    console.error("Error fetching friend list:", err);
    io.to(socket.id).emit("FriendList", []);
  }
});

//------------------------------------------------------------------------------------------

socket.on("removefriend",async(friendusername)=>{
  try{
    if(friendusername){
      console.log(`${friendusername}remove from friend list of ${username}`)
      await UserModel.findOneAndUpdate(
        { username: username },
        { $pull: { friends: friendusername } }
      );
       
      const user = await UserModel.findOne({ username }).lean()
      io.to(socket.id).emit("FriendList", user.friends || []);
     
    }
    
  }catch(err){
    console.log(err)
  }
})

//------------------------------------------------------------------------------------------
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${username}`);
      delete ConnectedUsers[username];
    });
  });

  return io;
};

module.exports = initializeSocket;