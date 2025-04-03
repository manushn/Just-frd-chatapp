import React ,{use, useEffect, useState}from 'react';
import "./css/signuppage.css";

function Signuppage() {

  const [Email,setEmail]=useState("");
  const [Username,setUsername]=useState("");
  const [Name,setName]=useState("");
  const [Password,setPassword]=useState("");
  const [Cpassword,setCpassword]=useState("");

  const [warnmessage,setwarnmessage]=useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("profile_default.jpg");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    
    setFile(selectedFile);
    
    if (selectedFile) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
    }
   };

   const handlesignup = async()=>{
       if(!Email||!Username||!Name||!Password||!Cpassword){
        setwarnmessage("All details are required")
       }

       if (Email) {
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(Email)) {
            setwarnmessage("Email must be in a valid format (example@example.com)");
            }
        }

        if(Password){
          if (Password) {
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
            if (!passwordRegex.test(Password)) {
                setwarnmessage("Password must have at least 1 uppercase letter, 1 number, 1 special character, and be at least 6 characters long.");
            } else {
                setwarnmessage(""); 
            }
        }
        }

        if(Cpassword){
          if(Password){
            if(Password!==Cpassword){
              setCpassword("")
              setwarnmessage("Password Does not match")
            }
          }else{
            setwarnmessage("Enter Password")
          }
        }
   }

 

  return (
    <div className="signuppage">
        <div className="signupform">
          <h2>Signup!</h2>
          <div className="signupprofile">
          <img src={previewUrl} alt="Profile Preview"/>
          <input type="file" accept="image/*" onChange={handleFileChange}/>
          </div>
          
          <div className="signupinput">
            <label>Email</label>
            <input 
            type='text'
            placeholder='example@gmail.com'
            value={Email}
            onChange={(e)=>{setEmail(e.target.value)}}
            maxLength={30}
            />
          </div>

          <div className="signupinput">
            <label>Username</label>
            <input
            type='text'
            placeholder='Username'
            value={Username}
            onChange={(e)=>{setUsername(e.target.value)}}
            maxLength={20}
            />
          </div>

          <div className="signupinput">
            <label>Name</label>
            <input
            type='text'
            placeholder='name'
            value={Name}
            onChange={(e)=>{setName(e.target.value)}}
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
            onChange={(e)=>{setPassword(e.target.value);setCpassword("")}}
            />
          </div>

          <div className="signupinput">
            <label>Confirm Password</label>
            <input
            type='password'
            placeholder='Re Enter Password'
            value={Cpassword}
            maxLength={16}
            onChange={(e)=>setCpassword(e.target.value)}
            />
          </div>

          <div className="signupbutton">
            <button onClick={handlesignup}>Submit</button>
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
