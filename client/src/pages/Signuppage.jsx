import React ,{use, useEffect, useState}from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "./css/signuppage.css";

function Signuppage() {

  const navigate=useNavigate();

  const [Email,setEmail]=useState("");
  const [Username,setUsername]=useState("");
  const [Name,setName]=useState("");
  const [Password,setPassword]=useState("");
  const [Cpassword,setCpassword]=useState("");

  const [warnmessage,setwarnmessage]=useState("");
 
  const [loading,setloading]=useState(false);

  

   const handlesignup = async()=>{

      setloading(true);

       if(!Email||!Username||!Name||!Password||!Cpassword){
        setwarnmessage("All details are required")
        setloading(false);
        return;
       }

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

      try{

        const response=await axios.post("https://just-frd-chatapp.onrender.com",{
          username:Username,
          name:Name,
          email:Email,
          password:Password
        });

        if(response.data.message){
          setwarnmessage(response.data.message);
          setloading(false);
        }

        if(response.data.success){
            navigate("/login");
          
          
        }


      }catch(err){
        console.log(err);
        setloading(false);
        return;
      }


   }

 

  return (
    <div className="signuppage">
        <div className="signupform">
          <h2>Signup!</h2>
         
          <div className="signupinput">
            <label>Email</label>
            <input 
            type='text'
            placeholder='example@gmail.com'
            value={Email}
            onChange={(e)=>{setEmail(e.target.value.toLowerCase().trim())}}
            maxLength={30}
            />
          </div>

          <div className="signupinput">
            <label>Username</label>
            <input
            type='text'
            placeholder='Username'
            value={Username}
            onChange={(e)=>{setUsername(e.target.value.toLowerCase().trim())}}
            maxLength={20}
            />
          </div>

          <div className="signupinput">
            <label>Name</label>
            <input
            type='text'
            placeholder='Name'
            value={Name}
            onChange={(e)=>{setName(e.target.value.trim())}}
            maxLength={20}
            />
          </div>

          <div className="signupinput">
            <label>Create Password</label>
            <input
            type='password'
            placeholder='Create Password'
            value={Password}
            maxLength={16}
            onChange={(e)=>{setPassword(e.target.value.trim());setCpassword("")}}
            />
          </div>

          <div className="signupinput">
            <label>Confirm Password</label>
            <input
            type='password'
            placeholder='Re Enter Password'
            value={Cpassword}
            maxLength={16}
            onChange={(e)=>setCpassword(e.target.value.trim())}
            />
          </div>

          <div className="signupbutton">
            {loading ?(
              <button>Loading...</button>
            ):(
              <button onClick={handlesignup}>Submit</button>
            )}
            
          </div>
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

export default Signuppage
