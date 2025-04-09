const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");
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

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${username}`);
      delete ConnectedUsers[username];
    });
  });

  return io;
};

module.exports = initializeSocket;