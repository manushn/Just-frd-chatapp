import React, { useEffect } from 'react';
import {useNavigate} from 'react-router-dom';
import Cookies from "js-cookie";

function Protectedroute({children}) {
  const navigate=useNavigate();
  const islogedin=sessionStorage.getItem('islogedin');
  const token = Cookies.get("token");

  useEffect(()=>{

    if (!islogedin){
        console.log("No logedin")
        navigate("/login")
    }
    

  },[navigate,islogedin,token]);

  return islogedin ? children : null;

}

export default Protectedroute
