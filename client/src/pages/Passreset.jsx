import React ,{useState,useEffect}from 'react';
import "./css/passwordreset.css";

function Passreset() {
  const [isotpsend,setisotpsend]=useState(false);
  const [loading,setloading]=useState(false);

  const [Email,setEmail]=useState("");
  const [Password,setPassword]=useState("");
  const [Cpassword,setCpassword]=useState("");
  const [otp,setotp]=useState("");
  return (
    <div className="passresetmain">
      {isotpsend ?(
        <div className="verifyotpmain">

        </div>
      ):(
        <div className="requestotpmain">
          <div className="requestformmain">
            <h2>Reset Password</h2>
            <label>Enter Email</label>
            <input
            placeholder='Email'
            value={Email}
            onChange={(e)=>{setEmail(e.target.value.toLowerCase().trim())}}
            />
            <label>Enter New Password</label>
            <input
            placeholder='Enter new password'
            value={Password}
            onChange={(e)=>{setPassword(e.target.value.trim())}}
            />
            <label>Re Enter Password</label>
            <input
            placeholder='Re Enter Password'
            value={Cpassword}
            onChange={(e)=>{setCpassword(e.target.value.trim())}}
            />
            <div className="otpsubbtn">
              {loading ?(
                <button>Loading...</button>
              ):(
                <button>Send OTP</button>
              )}
                
            </div>
            <div className="backtologinbtn">
              <button>Back to Login!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Passreset
