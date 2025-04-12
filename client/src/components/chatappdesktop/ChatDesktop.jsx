import React, { useState, useEffect } from 'react';
import "./css/chatdesktop.css"

function ChatDesktop({ socket,messages,setmessages,friends,setfriends}) {
  const [message, setmessage] = useState("");
  const [receiver, setreceiver] = useState("");
  const [searchvalue,setsearchvalue]=useState("");

  const [searchfrd,setsearchfrd]=useState([]);

  useEffect(() => {
    socket.on("NewMessage", (data) => {
      setmessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("NewMessage");
    };
  }, [socket, setmessages]);

  useEffect(() => {
    if (socket) {
      socket.emit("getFriendList");
  
      socket.on("FriendList", (data) => {
        setfriends(data); 
      });
  
      return () => {
        socket.off("FriendList");
      };
    }
  }, [socket,friends]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchvalue) {
        
        socket.emit("Searchuser", searchvalue);
      } else {
        setsearchfrd(""); // clear search results if input is empty
      }
    }, 300); // 300ms debounce
  
    return () => clearTimeout(delayDebounce);
  }, [searchvalue, socket]);

  useEffect(() => {
    
    socket.on("SearchUserDetails",(result)=>{
      setsearchfrd("");
      setsearchfrd(result)
      
    });
  
    return () => {
      socket.off("SearchUserDetails");
    };
  }, [socket]);

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
              <div className="divideline"></div>
              <div className="leftfrdlist">
                  {searchfrd ?(
                    <div className="newfrdlists">
                      {searchfrd && searchfrd.length > 0 ? (
                          searchfrd.map((friend, index) => (
                        <div key={index} 
                        className="newfriend-item" 
                        onClick={()=>setreceiver(friend)}
                        style={{
                          backgroundColor: receiver === friend ? "green" : "rgb(33, 203, 90) ",
                          color: receiver === friend ? "black" : "white",
                        }}
                        >
                            {friend}
                        <img src='addfrd.png'/>
                        </div>
                      ))
                        ) : (
                              <div>
                                <p>No friends yet</p>
                                <button onClick={()=>{setsearchfrd("");setsearchvalue("")}}>Back</button>
                              </div>
                        )}
                    </div>
                  ):(
                    <div className="savefrdlist">
                      {friends && friends.length > 0 ? (
                          friends.map((friend, index) => (
                        <div key={index} 
                        className="friend-item" 
                        onClick={()=>setreceiver(friend)}
                        style={{
                          backgroundColor: receiver === friend ? "#e6f0ff" : "rgb(39, 179, 255) ",
                          color: receiver === friend ? "black" : "white",
                        }}
                        >
                            {friend}
                        </div>
                      ))
                        ) : (
                              <div>No friends yet</div>
                        )}
                    </div>
                  )}
              </div>
          </div>
          <div className='deskrightchat'>
              {receiver?(
                <div className="chattoph2">
                  <h2>{receiver}</h2>
                </div>
              ):(
                <div className="chattoph2">
                  <h2>Chats</h2>
                </div>
              )}
          </div>
       </div>
      
    </div>
  );
}

export default ChatDesktop;