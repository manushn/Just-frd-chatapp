const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const UserModel = require("../schemas/userschema");
const MessageModel = require("../schemas/messageschema");

dotenv.config();

const ConnectedUsers = {};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST", "PUT"],
      credentials: true,
    },
  });

  // Middleware to authenticate using encrypted JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      
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

   

    // Send Message
    socket.on("sendMessage", async (receiver, message) => {
      try {
        const newMessage = new MessageModel({
          sender: username,
          receiver,
          message,
          timestamp: new Date(),
          seen: false,
        });

        await newMessage.save();

        // Emit to sender and receiver
        const receiverSocketId = ConnectedUsers[receiver];
        io.to(socket.id).emit("NewMessage", newMessage);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("NewMessage", newMessage);
        } 
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    socket.on("Allmessages", async ({ receiver, page = 1, limit = 20 }) => {
      if (receiver && username) {
        try {
          const skip = (page - 1) * limit;
    
          const updatedMessages = await MessageModel.find({
            $or: [
              { sender: username, receiver },
              { sender:receiver, receiver: username },
            ],
          })
            .sort({ timestamp: -1 }) 
            .skip(skip)
            .limit(limit)
            .lean();
    
         if(page===1){
          io.to(socket.id).emit("AllNewMessages", updatedMessages.reverse());
         }else{
          io.to(socket.id).emit("AlloldMessages", updatedMessages.reverse());
         }
          
        } catch (err) {
          console.log("Error in all message:",err);
        }
      }
    });

    // Mark Messages as Seen
    socket.on("markSeen", async (receiver) => {
      try {
        // Update unseen messages from receiver to user
        const updated=await MessageModel.updateMany(
          { sender: receiver, receiver: username, seen: false },
          { $set: { seen: true, seenAt: new Date() } }
        );
        if(updated.modifiedCount>0){
          
          const updatedMessages = await MessageModel.find({
            $or: [
              { sender: username, receiver },
              { sender: receiver, receiver: username },
            ],
          })
          .sort({timestamp:-1})
          .limit(updated.modifiedCount)
          .lean();
  
          io.to(socket.id).emit("MessagesUpdated", updatedMessages);
          io.to(ConnectedUsers[receiver]).emit("MessagesUpdated", updatedMessages)
        }

        // Fetch updated messages for the conversation
        
      } catch (err) {
        console.error("Error marking messages as seen:", err);
      }
    });

    // Typing Event
    socket.on("typing", (receiver) => {
      const receiverSocketId = ConnectedUsers[receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typings", username);
      }
    });

    
    // Search Users
    socket.on("Searchuser", async (searchuser) => {
      const requesterSocketId = ConnectedUsers[username];
      if (!searchuser || !requesterSocketId) {
        console.log("Invalid search request: Missing search query or requester socket ID.");
        return;
      }

      try {
        const userlist = await UserModel.find({
          username: { $regex: searchuser, $options: "i" },
        });

        const result = userlist.length > 0
          ? userlist.map(user => user.username)
          : [];

        io.to(requesterSocketId).emit("SearchUserDetails", result);
      } catch (err) {
        console.error("Error during user search:", err);
        io.to(requesterSocketId).emit("SearchUserDetails", []);
      }
    });

    // Add Friend
    socket.on("Add_Friend", async (addfriendname) => {
      
      const requesterSocketId = ConnectedUsers[username];

      if (!addfriendname || !username || !requesterSocketId || addfriendname === username) {
        console.log("Invalid request: Missing data or same user.");
        return io.to(requesterSocketId).emit("Responsedata", {
          Responsedata: "Invalid request",
        });
      }

      try {
        const user = await UserModel.findOne({ username });
        const feduser = await UserModel.findOne({ username: addfriendname });

        if (!feduser) {
          return io.to(requesterSocketId).emit("Responsedata", {
            Responsedata: "Username not found",
          });
        }

        if (user.friends.includes(addfriendname)) {
          return io.to(requesterSocketId).emit("Responsedata", {
            Responsedata: "User already Friend",
          });
        }

        await UserModel.findOneAndUpdate(
          { username },
          { $addToSet: { friends: addfriendname } }
        );

        const fuser = await UserModel.findOne({ username }).lean();
        io.to(socket.id).emit("FriendList", fuser.friends || []);
      } catch (err) {
        console.error("Error adding friend:", err);
        io.to(requesterSocketId).emit("Responsedata", {
          Responsedata: "An error occurred while adding friend",
        });
      }
    });

    // Get Friend List
    socket.on("getFriendList", async () => {
      try {
        const user = await UserModel.findOne({ username }).lean();
        io.to(socket.id).emit("FriendList", user.friends || []);
      } catch (err) {
        console.error("Error fetching friend list:", err);
        io.to(socket.id).emit("FriendList", []);
      }
    });

    // Remove Friend
    socket.on("removefriend", async (friendusername) => {
      try {
        if (friendusername) {
          
          await UserModel.findOneAndUpdate(
            { username },
            { $pull: { friends: friendusername } }
          );

          const user = await UserModel.findOne({ username }).lean();
          io.to(socket.id).emit("FriendList", user.friends || []);
        }
      } catch (err) {
        console.error("Error removing friend:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      
      delete ConnectedUsers[username];
    });
  });

  return io;
};

module.exports = initializeSocket;