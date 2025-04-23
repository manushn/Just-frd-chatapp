import React, { useRef,useState, useEffect } from 'react';
import "./css/chatdesktop.css";
import { useNavigate } from "react-router-dom";


function ChatDesktop({ socket, messages, setmessages, friends, setfriends }) {
  const navigate = useNavigate();
  const sender = sessionStorage.getItem('username');
  const [message, setmessage] = useState("");
  const [receiver, setreceiver] = useState("");
  const [searchvalue, setsearchvalue] = useState("");
  const [searchfrd, setsearchfrd] = useState([]);
  const [addfriendname, setaddfriendname] = useState("");

  const [warnmessage, setwarnmessage] = useState("");
  const [popup, setpopup] = useState(false);
  const [confirmmessage, setconfirmmessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const chatContainerRef = useRef();
  const messagesEndRef = useRef(null);
  const [hasInitialized, setHasInitialized] = useState(false);


  useEffect(() => {
    if (receiver) {
      setmessages([]); 
      fetchMessages(1);
    }
  }, [receiver]);

  useEffect(() => {
    if (messages.length > 0&& messages.length<21) {
      scrollToBottom(); 
      const timeout = setTimeout(() => {
        setHasInitialized(true); 
      }, 1500); 
  
      return () => clearTimeout(timeout);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = (pageToLoad) => {
    socket.emit("Allmessages", { receiver, page: pageToLoad, limit: 20 });
  
    socket.once("AllNewMessages", (newMessages) => {
      if (newMessages.length === 0) setHasMore(false);
  
      setmessages((prev) => [...newMessages, ...prev]); 
     
      setTimeout(() => {
        if (pageToLoad === 1) {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    });
  };

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    if (el.scrollTop === 0 && hasInitialized) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage);
    }
    
  };

 

//---------------------------------------------------------------------------------------------------------------

  // Fetch friend list
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
//---------------------------------------------------------------------------------------------------------------
  // Reset receiver when friends list changes
  useEffect(() => {
    setreceiver("");
  }, [friends]);
//---------------------------------------------------------------------------------------------------------------
  // Handle search for new friends
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchvalue) {
        socket.emit("Searchuser", searchvalue);
      } else {
        setsearchfrd([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchvalue, socket]);
//---------------------------------------------------------------------------------------------------------------
  // Receive search results
  useEffect(() => {
    socket.on("SearchUserDetails", (result) => {
      setsearchfrd(result);
    });

    return () => {
      socket.off("SearchUserDetails");
    };
  }, [socket]);
//---------------------------------------------------------------------------------------------------------------
  
  

  useEffect(()=>{
     socket.emit("markSeen", receiver);
      socket.on("MessagesUpdated", (updatedMsg) => {
        setmessage((prevMessages) => {
         
          if (!Array.isArray(prevMessages)) return prevMessages;
    
          return prevMessages.map((msg) => {
            const updated = updatedMsg.find((m) => m._id === msg._id);
            return updated ? { ...msg, seen: updated.seen } : msg;
          });
        });
      }); 

  socket.on("typings", (sender) => {
    if (sender === receiver) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 4000);
    }
  });

  return () => {
    socket.off("MessagesUpdated");
    socket.off("typings");
  };
},[receiver,messages,isTyping])

useEffect(()=>{
  socket.on("NewMessage", (newMessage) => {
    console.log(newMessage)
    setmessages((prev) => [ ...prev,newMessage]); 

  return () => {
    socket.off("NewMessage");
    
  };
   })
 },[messages,socket])
//---------------------------------------------------------------------------------------------------------------
  // Auto-scroll to the latest message
  useEffect(() => {
    const chatMessages = document.querySelector(".chattabtop");

  if (chatMessages) {
    const threshold = 100; // pixels from bottom
    const isAtBottom =
      chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < threshold;

    if (isAtBottom) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  }, [messages, isTyping]);
//---------------------------------------------------------------------------------------------------------------
  // Send a message
  const Sendmessage = () => {
    if (message && receiver) {
      
      socket.emit("sendMessage", receiver, message);
      setmessage("");
      setIsTyping(false);
    } else {
      alert("Enter both message and receiver");
    }
  };
//---------------------------------------------------------------------------------------------------------------
  // Add a friend
  const Savefrd = () => {
    if (addfriendname) {
      socket.emit("Add_Friend", addfriendname);
      setaddfriendname("");
      setsearchvalue("");
      setsearchfrd([]);
    }
  };
//---------------------------------------------------------------------------------------------------------------
  // Remove a friend
  const deletefrd = () => {
    if (receiver) {
      socket.emit("removefriend", receiver);
      setreceiver(""); // Clear receiver after removing friend
    }
  };
//---------------------------------------------------------------------------------------------------------------
  return (
    <div className='desktopchat'>
      <div className="chattop">
        <div className='chatlogo'>
          <img src='just-frd-logo1.webp' width={"80px"} height={"80px"} />
          <h1>Just Friend</h1>
        </div>
        <div className="profile">
          <img src='profile-user.png' />
          <h3>{sender}</h3>
          <button onClick={() => setpopup(true)}>Logout</button>
        </div>
      </div>
      <div className="chatbottom">
        <div className='deskleftchat'>
          <h2>Friends</h2>
          <input
            placeholder='Search Friends'
            value={searchvalue}
            onChange={(e) => setsearchvalue(e.target.value.toLowerCase().trim())}
          />
          <div className="divideline"></div>
          <div className="leftfrdlist">
            {searchvalue ? (
              <div className="newfrdlists">
                <h4>Results for your search..</h4>
                {searchfrd && searchfrd.length > 0 ? (
                  searchfrd.map((friend, index) => (
                    <div
                      key={index}
                      className="newfriend-item"
                      onClick={() => { setaddfriendname(friend); Savefrd(); }}
                      style={{
                        backgroundColor: "rgb(33, 203, 90)",
                        color: "white",
                      }}
                    >
                      {friend}
                      <img src='addfrd.png' />
                    </div>
                  ))
                ) : (
                  <div className='nonewfrdlists'>
                    <p>No User Found!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="savefrdlist">
                <h4>Saved Friends..</h4>
                {friends && friends.length > 0 ? (
                  friends.map((friend, index) => (
                    <div
                      key={index}
                      className="friend-item"
                      onClick={() => setreceiver(friend)}
                      style={{
                        backgroundColor: receiver === friend ? "#e6f0ff" : "rgb(39, 179, 255)",
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
          {receiver ? (
            <div className="chat">
              <div className="chattoph2">
                <h2>{receiver}</h2>
                <button onClick={() => { setpopup(true); setconfirmmessage(`Remove ${receiver} from friend list`); }}>
                  Un Friend
                </button>
              </div>
              <div className="chattab">
                <div className="chattabtop" onScroll={handleScroll} ref={chatContainerRef}>
                  {messages
                    .filter(
                      (msg) =>
                        (msg.sender === sender && msg.receiver === receiver) ||
                        (msg.sender === receiver && msg.receiver === sender)
                    )
                    .map((msg, index) => (
                      <div
                        key={msg._id || index}
                        className={`message ${
                          msg.sender === sender ? "sent" : "received"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <div className="messageinfo">
                        <span className='timestamp'>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        {msg.sender === sender && msg.seen ? (
                          <span className="seen">Seen</span>
                        ) : null}
                        </div>
                        
                      </div>
                    ))}
                  {isTyping && (
                    <div className="typing-indicator">
                      <p>{receiver} is typing...</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chattabbottom">
                  <input
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => {
                      setmessage(e.target.value);
                      if (receiver && e.target.value) {
                        socket.emit("typing", receiver);
                      }
                    }}
                    onKeyDown={(e)=>{
                      if(e.key==="Enter" && !e.shiftKey){
                        e.preventDefault();
                        Sendmessage();
                      };
                    }}
                  />
                  <button onClick={Sendmessage}>Send</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="chattoph3">
              <h2>Chats</h2>
              <br></br>
              <p>Select a friend to start chatting</p>
            </div>
          )}
        </div>
      </div>
      {popup && (
        <div className="popupcon">
          {warnmessage ? (
            <div className="warnmessagecon">
              <p>{warnmessage}</p>
              <button onClick={() => { setwarnmessage(''); setpopup(false); }}>X</button>
            </div>
          ) : (
            <>
              {confirmmessage ? (
                <div className="confirmmessage">
                  <p>{confirmmessage}</p>
                  <div className="confirmmessagebtn">
                    <button onClick={() => { setconfirmmessage(""); setpopup(false); }}>Cancel</button>
                    <button onClick={() => { setconfirmmessage(""); setpopup(false); deletefrd(); }}>
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="confirmmessage">
                  <p>Are you sure to Logout!</p>
                  <div className="confirmmessagebtn">
                    <button onClick={() => setpopup(false)}>Cancel</button>
                    <button onClick={() => {
                      localStorage.removeItem('token');
                      sessionStorage.removeItem('username');
                      sessionStorage.removeItem('islogedin');
                      setpopup(false);
                      navigate("/login");
                    }}>
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatDesktop;