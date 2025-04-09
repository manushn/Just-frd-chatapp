import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './css/LoadingPage.css'; // Import the CSS file

function LoadingPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const token=localStorage.getItem('token');

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const response = await axios.get("http://192.168.1.23:4000/autologin", {
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        });


        if (response.data.success===true) {
          sessionStorage.setItem("islogedin", true);
          sessionStorage.setItem("Username", response.data.username);
          localStorage.setItem("token",response.data.token);
          navigate("/chats");
        }
        if(response.data.success===false) {
          navigate('/login');
          console.log("No Token provided")
        }
      } catch (error) {
        setMessage("Error in Connecting with Backend!");
       console.log(error) // Redirect if auto-login fails
      }
    };

    autoLogin();
  }, []); // Added `navigate` as a dependency

  return (
    <div className="loading-container">
      <img src="just-frd-logo1.webp" alt="Just Friend Logo" className="loading-logo" />
      {message && <p className="error-message">{message}</p>}
    </div>
  );
}

export default LoadingPage;