import React, { useState, useEffect } from 'react';
import "./css/chatdesktop.css"

function ChatDesktop({ socket, messages, setmessages }) {
  const [message, setmessage] = useState("");
  const [receiver, setreceiver] = useState("");
  const [searchvalue,setsearchvalue]=useState("");


  useEffect(() => {
    socket.on("NewMessage", (data) => {
      setmessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("NewMessage");
    };
  }, [socket, setmessages]);

  const Sendmessage = () => {
    if (message && receiver) {
      socket.emit("sendMessage", receiver, message);

      setmessages((prev) => [
        ...prev,
        {
          sender: sessionStorage.getItem("username"),
          receiver,
          message,
        },
      ]);

      setmessage("");
    } else {
      alert("Enter both message and receiver");
    }
  };

  return (
    <div className='desktopchat'>
      <div className="chattop">
            <div className='chatlogo'>
            <img src='just-frd-logo1.webp' width={"80px"} height={"80px"}/>
            <h1>Just Friend</h1>
            </div>
            
            <div className="profile">
              <img src='profile-user.png' />
              <h3>{sessionStorage.getItem('username')}</h3>
            </div>
      </div>
      <div className="chatbottom">
          <div className='deskleftchat'>
              <h2>Friends</h2>
              <input
              placeholder='Search Username'
              value={searchvalue}
              onChange={(e)=>{setsearchvalue(e.target.value.toLowerCase().trim())}}
              />
              <div className="leftfrdlist">

              </div>
          </div>
          <div className='deskrightchat'>
              <h2>Chats</h2>
          </div>
       </div>
      
    </div>
  );
}

export default ChatDesktop;