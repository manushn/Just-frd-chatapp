import React, { useState, useEffect } from "react";
import "./css/loginpage.css";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // ✅ Added missing import

function Loginpage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isMessage, setIsMessage] = useState(false);
  const [message, setMessage] = useState("");

  sessionStorage.removeItem('islogedin');
  // Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (username && password) {
      try {
        const response = await axios.post("http://192.168.1.23:4000/login", {
          username,
          password,
        },{ withCredentials: true }
      );

        if (response.data.success) {
          sessionStorage.setItem("username", response.data.username);
          sessionStorage.setItem("islogedin", true);
          localStorage.setItem("token",response.data.token)
          navigate("/chats");
        } else {
          setIsMessage(true);
          setMessage(response.data.message || "Login failed");
        }
      } catch (error) {
        console.log(error);
        setIsMessage(true);
        setMessage("Server error. Try again!");
      }
    } else {
      setIsMessage(true);
      setMessage("Please enter username and password");
    }
  };

  // Automatically close message after 5s
  useEffect(() => {
    if (isMessage) {
      const timer = setTimeout(() => {
        setIsMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isMessage]);


  return (
    <div className="loginfullmain">
      {/* Popup Message */}
      {isMessage && (
        <div className="popup-message">
          <div className="message-content">
            <p>{message}</p>
            <button className="close-btn" onClick={() => setIsMessage(false)}>X</button>
          </div>
        </div>
      )}

      <div className="loginmain">
        <div className="loginform">
          <div className="heading">
            <h3>Just Friend</h3>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div className="loginformin">
              <label>Username</label>
              <input
                type="text"
                placeholder="Username/Email"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
              />
            </div>

            <div className="loginformin">
              <label>Password</label>
              <input
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
            </div>

            <button type="submit">Login</button>
          </form>

          <div className="pass-redirect" onClick={() => navigate("/password-reset")}>
            <p>Forgotten your password?</p>
          </div>

          <div className="sign-redirect" onClick={() => navigate("/signup")}>
            <p>Don't have an account? Sign up</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loginpage;