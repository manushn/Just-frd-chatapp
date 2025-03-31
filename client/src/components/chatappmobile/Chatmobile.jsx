import React, { useEffect, useState } from 'react'

function Chatmobile({socket,messages,setmessages,friends,setfriends}) {

    const [message,setmessage]=useState("")
    
     useEffect(()=>{
        socket.on("NewMessage",(data)=>{
            setmessages(data)
            
        })
     },[])
    const Sendmessage=async()=>{
        socket.emit("sendMessage",message);
    };
  return (
    <div>
      <h1>📱Mobile</h1>
      <input 
      placeholder='message'
      value={message}
      onChange={(e)=>setmessage(e.target.value)}
      />
      <button onClick={Sendmessage}>Send</button>
      <h2>{messages}</h2>
    </div>
  )
}

export default Chatmobile
