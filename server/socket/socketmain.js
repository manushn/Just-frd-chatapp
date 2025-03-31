const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const dotenv =require('dotenv');
dotenv.config();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://192.168.1.23:5173", "http://localhost:5173"],
            credentials: true
        }
    });

    // Middleware for token authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;  // Ensure token is passed from the frontend
        console.log("Token received")
        if (!token) {
            console.log("❌ No token provided");
            return next(new Error("Authentication error: Token required"));

        }

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
            socket.user = decoded; // Attach user data to socket
            next();
        });
    });

    // Handle socket connection
    io.on("connection", (socket) => {
        console.log(`✅ User connected: ${socket.user.username}`);
        console.log(`Socketid ${socket.id}`)

        // Handle sending messages
        socket.on("sendMessage", (data) => {
            console.log("📩 Message received:", data);
            socket.emit("NewMessage", data);
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${socket.user.username}`);
        });
    });

    return io;
};

module.exports = initializeSocket;