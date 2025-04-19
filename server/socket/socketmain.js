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
      origin: ["http://192.168.1.23:5173", "http://localhost:5173"],
    },
  });

  // Middleware to authenticate using encrypted JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
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
        } else {
          console.log(`Receiver ${receiver} not connected`);
        }
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    // Mark Messages as Seen
    socket.on("markSeen", async (receiver) => {
      try {
        // Update unseen messages from receiver to user
        await MessageModel.updateMany(
          { sender: receiver, receiver: username, seen: false },
          { $set: { seen: true, seenAt: new Date() } }
        );

        // Fetch updated messages for the conversation
        const updatedMessages = await MessageModel.find({
          $or: [
            { sender: username, receiver },
            { sender: receiver, receiver: username },
          ],
        }).lean();

        io.to(socket.id).emit("MessagesUpdated", updatedMessages);
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
      console.log(`Adding friend ${addfriendname} to ${username}`);
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
          console.log(`${friendusername} removed from friend list of ${username}`);
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
      console.log(`❌ User disconnected: ${username}`);
      delete ConnectedUsers[username];
    });
  });

  return io;
};

module.exports = initializeSocket;