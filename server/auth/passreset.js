const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const UserModel = require("../schemas/userschema");

const userotps = {}; 


const Generateotp = async (useremail, name) => {
  const Generatedotp = Math.floor(100000 + Math.random() * 900000); 

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "justfriend.chatapp@gmail.com",
      pass: "mjqk fipp vdro lknw",
    },
  });

  let mailOptions = {
    from: '"JustFriend ChatApp" <justfriend.chatapp@gmail.com>',
    to: useremail,
    subject: "Your OTP for Password Reset",
    text: `Hi ${name} 👋, 
Your OTP code is ${Generatedotp} for your password reset process.
Do not share it with anyone.`,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    userotps[useremail] = Generatedotp;
    console.log("OTP sent: " + info.response);
    return Generatedotp;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};


router.post("/otpreq", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(203).json({ message: "Email ID not registered" });
  }

  try {
    const Userdata = await UserModel.findOne({ email: email });

    if (Userdata) {
      const sendotp = await Generateotp(Userdata.email, Userdata.name);
      if (sendotp) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(203).json({ message: "Error sending OTP!" });
      }
    } else {
      return res.status(203).json({ message: "User not found!" });
    }
  } catch (err) {
    console.log(err);
    return res.status(403).json({ message: err });
  }
});


router.put("/verifyotp", async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(203).json({ message: "All fields are required!" });
  }

  if (userotps[email] && userotps[email] === parseInt(otp)) {
    try {
      const hashedpassword = await bcrypt.hash(password, 12);

      const updateuser = await UserModel.findOneAndUpdate(
        { email: email },
        { password: hashedpassword },
        { new: true }
      );

      if (updateuser) {
        delete userotps[email]; 
        return res.status(200).json({ success: true });
      } else {
        return res.status(203).json({ message: "Unable to update password" });
      }
    } catch (err) {
      console.log(err);
      return res.status(403).json({ message: "Error in updating password" });
    }
  } else {
    return res.status(203).json({ success: false, message: "Invalid OTP!" });
  }
});

module.exports = router;