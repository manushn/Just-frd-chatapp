import React ,{useState,useEffect}from 'react';
import axios from "axios";
import "./css/passwordreset.css";
import { useNavigate } from 'react-router-dom';

function Passreset() {
  const [isotpsend,setisotpsend]=useState(false);
  const [loading,setloading]=useState(false);
  const navigate=useNavigate();

  const [Email,setEmail]=useState("");
  const [Password,setPassword]=useState("");
  const [Cpassword,setCpassword]=useState("");
  const [otp,setotp]=useState("");

  const [warnmessage,setwarnmessage]=useState("");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(countdown);
  }, [timer]);


  const requestotp = async(req,res)=>{
    setloading(true)

        if(Email){
          try{
            if (Email) {
              const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
              if (!emailRegex.test(Email)) {
                setwarnmessage("Email must be in a valid format (example@example.com)");
                setloading(false);
                return;
                }
            }

            if(Password){
              if (Password) {
                const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
                if (!passwordRegex.test(Password)) {
                    setwarnmessage("Password must have at least 1 uppercase letter, 1 number, 1 special character, and be at least 6 characters long.");
                    setloading(false);
                    return;
                } else {
                    setwarnmessage(""); 
                }
            }
            }

            if(Cpassword){
              if(Password){
                if(Password!==Cpassword){
                  setCpassword("");
                  setwarnmessage("Password Does not match");
                  setloading(false);
                  return;
                }
              }else{
                setwarnmessage("Enter Password");
                setloading(false);
                return;
              }
            }

            const response=await axios.post("http://192.168.1.23:4000/otpreq",{
              email:Email
            })
            
            if(response.data.message){
              setwarnmessage(response.data.message);
              setloading(false);
            }

            if(response.data.success){
              setloading(false);
              setisotpsend(true);
              setCanResend(false);
              setTimer(90);
            }

          }catch(err){
            console.log(err);
          }
          

        }else{
          setwarnmessage("Enter Email");
          setloading(false);
        }
  }

  const verifyotp=async(req,res)=>{
    setloading(true);
      if(Email&&otp&&Password){
        
        
        const response1=await axios.put('http://192.168.1.23:4000/verifyotp',{
          email:Email,
          otp:otp,
          password:Password
        });

        if(response1.data.message){
          setwarnmessage(response1.data.message);
          setloading(false);
        }
        if(response1.data.success){
          navigate("/login");
        }


      }else{
        setwarnmessage("Enter otp");
        setloading(false);
      }
  }


  return (
    <div className="resetotptop">
    <div className="passresetmain">
      {isotpsend ?(
        <div className="verifyotpmain">
          <div className="verifyotpform">
            <h2>Verify OTP</h2>
            <label>Enter OTP</label>
            <input
            placeholder='OTP'
            value={otp}
            onChange={(e)=>{setotp(e.target.value.trim())}}
            />
            {loading ?(
                <button>Loading...</button>
              ):(
                <button onClick={verifyotp}>Send OTP</button>
              )}
            <div className="resendotpbtn">
            <button onClick={requestotp} disabled={!canResend}>
              {canResend ? "Resend OTP" : `Resend OTP in ${timer}s`}
            </button>
            </div>

          </div>
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
                <button onClick={requestotp}>Send OTP</button>
              )}
                
            </div>
            <div className="backtologinbtn">
              <button onClick={()=>{navigate("/login")}}>Back to Login!</button>
            </div>
          </div>
        </div>
      )}
    </div>
    {warnmessage &&(
        <div className="warmessage">
          <p>{warnmessage}</p>
          <div className="warnclose">
            <button onClick={()=>{
              setwarnmessage("")
            }}>X</button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Passreset
