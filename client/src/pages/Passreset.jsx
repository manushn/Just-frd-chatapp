import React, { useState,useEffect} from "react";
import "./css/passreset.css";
import axios from 'axios';



function Passreset() {
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState(""); 
  const [Cpassword, setCpassword] = useState("");
  const [Otp, setOtp] = useState("");

  const [Isotpsend, setIsotpsent] = useState(false);
  const [Warnmessage, setWarnmessage] = useState("");
  const [loading,setloading]=useState(false);

  const [timer, setTimer] = useState(60); 
  const [isDisabled, setIsDisabled] = useState(true);

  const SendotpRequest = async () => {
    if (!Email || !Password || !Cpassword) {
      setloading(false);
      setWarnmessage("All field are required!");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(Email)) {
      setWarnmessage("Enter a valid email (example@example.com)");
      setloading(false);
      return;
    }

    if (Password.length < 6) {
      setWarnmessage("Password must be at least 6 characters long.");
      setloading(false);
      return;
    }

    if (Password !== Cpassword) {
      setWarnmessage("Passwords do not match.");
      setloading(false);
      return;
    }

    // Simulating OTP Send Request
    try {
      const response= await axios.post("http://192.168.1.23:4000/otpreq",{
        email:Email
      })

      if(response.data.success){
        setIsotpsent(true);
        setTimer(60);
        setIsDisabled(true);
        return;
      }else{
        setloading(false);
      }

      if(response.data.message){
        setloading(false);
        setWarnmessage(response.data.message);
      }
    } catch (err) {
      setloading(false);
      console.error(err);
      setWarnmessage("Failed to send OTP. Try again.");
    }
  };

  useEffect(() => {
    let interval;
    if (isDisabled && timer && Isotpsend > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsDisabled(false);
    }

    return () => clearInterval(interval);
  }, [isDisabled, timer]);

  

  return (
    <div className="passresetmain">
      <div className="otpfillform">
        {Isotpsend ? (
          <div className="otpsendmain">
            <h2>Enter OTP</h2>
            <div className="formdatainput">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={Otp}
                onChange={(e) => setOtp(e.target.value.trim())}
              />
            </div>
            <div className="resetotpbtn">
              <button >Verify OTP</button>
            </div>
            <div className="resentotp">
              {isDisabled ?(
                <p>Resend OTP in {timer} S</p>
              ):(
              
                <button>Resend OTP</button>
                
              )}
              
            </div>
          </div>
        ) : (
          <div className="otpformmain">
            <div className="otpform">
              <h2>Reset Password</h2>

              <div className="formdatainput">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={Email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                />
              </div>

              <div className="formdatainput">
                <label>Enter New Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={Password}
                  onChange={(e) => setPassword(e.target.value.trim())}
                />
              </div>

              <div className="formdatainput">
                <label>Re-Enter Password</label>
                <input
                  type="password"
                  placeholder="Re-enter Password"
                  value={Cpassword}
                  onChange={(e) => setCpassword(e.target.value.trim())}
                />
              </div>

              <div className="resetotpbtn">
                {loading?(
                  <button >Loading...</button>
                ):(
                  <button onClick={()=>{setloading(true);SendotpRequest();}}>Send OTP</button>
                )}
                
              </div>
            </div>
          </div>
        )}
      </div>

      {Warnmessage && (
        <div className="warnmessage">
          <p>{Warnmessage}</p>
          <div className="warnclose">
            <button onClick={() => setWarnmessage("")}>X</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Passreset;