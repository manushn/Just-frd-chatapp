const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const UserModel = require('../schemas/userschema');
const CryptoJS = require("crypto-js");
const cookieParser = require("cookie-parser");

dotenv.config();

router.use(cookieParser());

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(203).json({ message: "All fields are required!" });
    }

    try {
        const isEmail = username.includes("@gmail.com");
        const user = await UserModel.findOne(isEmail ? { email: username } : { username: username });

        if (!user) {
            return res.status(203).json({ message: "User does not exist. Try signing up!", success: false });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(203).json({ message: "Password does not match!", success: false });
        }

        const jwttoken = jwt.sign(
            { username: user.username, name: user.name, email: user.email },
            process.env.JWT_SECRET_KEY,
            { expiresIn: String(process.env.TOKEN_EXPAIRATION) }
        );

        const encryptedJwt = CryptoJS.AES.encrypt(jwttoken, process.env.ENCRYPTION_KEY).toString();
        
        return res.status(200).json({
            success: true,
            message: "Login successful!",
            username: user.username,
            token:encryptedJwt,
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Error in login", success: false });
    }
});


router.get("/autologin", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        console.log("No token")
        return res.status(203).json({ success: false, message: "No token found" });
        
    }

    try {
        
        const decryptJWT = (encryptedJwt) => {
            const bytes = CryptoJS.AES.decrypt(encryptedJwt, process.env.ENCRYPTION_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        };

        const decryptedToken = decryptJWT(token);
        if (!decryptedToken) {
            return res.status(203).json({ success: false, message: "Invalid token" });
        }

        
        jwt.verify(decryptedToken, process.env.JWT_SECRET_KEY, async (err, decoded) => {
            if (err) {
                return res.status(203).json({ success: false, message: "Invalid token" });
            }

            try {
                const user = await UserModel.findOne({ username: decoded.username });
                if (!user) {
                    return res.status(203).json({ success: false, message: "User not found" });
                }

                
                const newJwtToken = jwt.sign(
                    { username: user.username, name: user.name, email: user.email },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: String(process.env.TOKEN_EXPAIRATION) }
                );

                const newEncryptedJwt = CryptoJS.AES.encrypt(newJwtToken, process.env.ENCRYPTION_KEY).toString();
                

                return res.status(200).json({
                    success: true,
                    message: "Auto-login successful!",
                    username: decoded.username,
                    token:newEncryptedJwt,
                });

            } catch (error) {
                console.error("Auto-login error:", error);
                return res.status(500).json({ success: false, message: "Server error" });
            }
        });

    } catch (error) {
        console.error("Token decryption error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;