import React, { useState, useEffect } from 'react';
import "./css/chatdesktop.css"
import { useNavigate } from "react-router-dom";

function ChatDesktop({ socket,messages,setmessages,friends,setfriends}) {
  const navigate = useNavigate();
  const [message, setmessage] = useState("");
  const [receiver, setreceiver] = useState("");
  const [searchvalue,setsearchvalue]=useState("");

  const [searchfrd,setsearchfrd]=useState([]);
  const [addfriendname,setaddfriendname]=useState("");

  const [warnmessage,setwarnmessage]=useState("");
  const [popup,setpopup]=useState(false);

  const [confirmmessage,setconfirmmessage]=useState("");
 

  


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
  }, [socket]);

  useEffect(()=>{
    setreceiver("")

  },[friends])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchvalue) {
        
        socket.emit("Searchuser", searchvalue);
      } else {
        setsearchfrd(""); 
      }
    }, 300);
  
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

  const Savefrd=()=>{
    if(addfriendname){
      socket.emit("Add_Friend",addfriendname);
      setaddfriendname(""); 
      setsearchvalue("");
      setsearchfrd("");
    }
  };

  const deletefrd=()=>{
    if(receiver){
      socket.emit("removefriend",receiver);
    }
  }

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
              <button onClick={()=>{setpopup(true)}}>Logout</button>
            </div>
      </div>
      <div className="chatbottom">
          <div className='deskleftchat'>
              <h2>Friends</h2>
              <input
              placeholder='Search Friends'
              value={searchvalue}
              onChange={(e)=>{setsearchvalue(e.target.value.toLowerCase().trim())}}
              />
              <div className="divideline"></div>
              <div className="leftfrdlist">
                
                  {searchvalue ?(
                    <div className="newfrdlists">
                      <h4>Results for your search..</h4>
                      {searchfrd && searchfrd.length > 0 ? (
                          searchfrd.map((friend, index) => (
                        <div key={index} 
                        className="newfriend-item" 
                        onClick={()=>{setaddfriendname(friend);Savefrd()}}
                        style={{
                          backgroundColor: "rgb(33, 203, 90) ",
                          color:"white",
                        }}
                        >
                            {friend}
                        <img src='addfrd.png'/>
                        </div>
                      ))
                        ) : (
                              <div className='nonewfrdlists'>
                                <p>No User Found!</p>
                                
                              </div>
                        )}
                    </div>
                  ):(
                    <div className="savefrdlist">
                      <h4>Saved Friends..</h4>
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
                  <button onClick={()=>{setpopup(true);setconfirmmessage(`Remove ${receiver} from friend list`)}}>Un Friend</button>
                </div>
              ):(
                <div className="chattoph2">
                  <h2>Chats</h2>
                </div>
              )}
          </div>
       </div>
      {popup &&(
        <>
        <div className="popupcon">
        {warnmessage ? (
          
            <div className="warnmessagecon">
            <p>{warnmessage}</p>
            <button onClick={()=>{setwarnmessage('');setpopup(false)}}>X</button>
            </div>
        ):(
          <>
          {confirmmessage ?(
            <div className="confirmmessage">
            <p>{confirmmessage}</p>
            <div className="confirmmessagebtn">
              <button onClick={()=>{setconfirmmessage("");setpopup(false)}}>Cancel</button>
              <button onClick={()=>{setconfirmmessage("");setpopup(false);deletefrd()}}>Confirm</button>
            </div>
          </div>
          ):(
            <div className="confirmmessage">
            <p>Are you sure to Logout!</p>
            <div className="confirmmessagebtn">
              <button onClick={()=>{setpopup(false)}}>Cancel</button>
              <button onClick={()=>{
                localStorage.removeItem('token');
                sessionStorage.removeItem('username');
                sessionStorage.removeItem('islogedin');
                setpopup(false);
                navigate("/login")
                }}>Confirm</button>
            </div>
          </div>
          )}
            
          </>
          
        )}
        
        </div>
        </>


      )}
    </div>
  );
}

export default ChatDesktop;