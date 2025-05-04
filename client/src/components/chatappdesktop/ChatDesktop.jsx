import React, { useRef, useState, useEffect } from 'react';
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
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [initialload, setinitialload] = useState(true);

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check if user is near the bottom
  const isNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      console.log("isNearBottom: Scroll container not found");
      return false;
    }
    const threshold = 145; // Increased threshold for reliability
    const scrollDifference = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = scrollDifference <= threshold;
    
    return nearBottom;
  };

  // Scroll to bottom instantly
  const scrollToBottom = () => {
    
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      }); 
    } 
  };

  // Fetch messages for the current receiver
  useEffect(() => {
    console.log("Receiver changed:", receiver);
    setmessages([]);
    setHasMore(true);
    setinitialload(true);
    setPage(1);
    fetchMessages(1);
  }, [receiver,socket]);

  const fetchMessages = (pageToLoad) => {
    
    if (receiver) {
      socket.emit("Allmessages", { receiver, page: pageToLoad, limit: 20 });
    }

    socket.once("AllNewMessages", (newMessages) => {
      setmessages((prev) => {
        const uniqueMessages = newMessages.filter(
          (msg) => !prev.some((existing) => existing._id === msg._id)
        );
        return [...uniqueMessages, ...prev];
      });
      setLoadingOlderMessages(false);
      
    });
  };

  // Scroll to bottom on initial load
  useEffect(() => {
    if (initialload && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
        setinitialload(false);
      }, 100);
    }
  }, [messages, initialload]);

  // Handle scroll to load older messages
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && !loadingOlderMessages && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOlderMessages(nextPage);
    }
  };

  const loadOlderMessages = (pageToLoad) => {
    setLoadingOlderMessages(true);
    const container = scrollContainerRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;

    if (hasMore && receiver) {
      socket.emit("Allmessages", { receiver, page: pageToLoad, limit: 20 });
    }

    socket.once("AlloldMessages", (olderMessages) => {
      if (!olderMessages || olderMessages.length === 0) {
        setHasMore(false);
        setLoadingOlderMessages(false);
        return;
      }
      // Filter out duplicates by _id
      setmessages((prev) => {
        const uniqueMessages = olderMessages.filter(
          (msg) => !prev.some((existing) => existing._id === msg._id)
        );
        return [...uniqueMessages, ...prev];
      });
      setinitialload(false);

      // Maintain scroll position after loading older messages
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const scrollDifference = newScrollHeight - previousScrollHeight;
          container.scrollTop = scrollDifference;
        }
        setLoadingOlderMessages(false);
      }, 0);
    });
  };

  // Handle new messages
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      
      setmessages((prev) => {
        // Avoid adding duplicate message
        if (prev.some((msg) => msg._id === newMessage._id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      // Scroll to bottom if near bottom
      setTimeout(() => {
        if (isNearBottom()) {
          scrollToBottom();
        }
      }, 50);
    };

    socket.on("NewMessage", handleNewMessage);
    return () => socket.off("NewMessage", handleNewMessage);
  }, [socket]);

  // Handle updated messages (e.g., seen status)
  useEffect(() => {
    socket.emit("markSeen", receiver);
    socket.on("MessagesUpdated", (updatedMsg) => {
      setmessages((prevMessages) => {
        if (!Array.isArray(prevMessages)) return prevMessages;
        return prevMessages.map((msg) => {
          const updated = updatedMsg.find((m) => m._id === msg._id);
          return updated ? { ...msg, seen: updated.seen } : msg;
        });
      });
      // Scroll to bottom if near bottom
      setTimeout(() => {
        
        if (isNearBottom()) {
          
          scrollToBottom();
        }
      }, 100);
    });

    socket.on("typings", (sender) => {
      if (sender === receiver) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      socket.off("MessagesUpdated");
      socket.off("typings");
    };
  }, [receiver, socket,messages]);

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

  // Reset receiver when friends list changes
  useEffect(() => {
    setreceiver("");
  }, [friends]);

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

  // Receive search results
  useEffect(() => {
    socket.on("SearchUserDetails", (result) => {
      setsearchfrd(result);
    });

    return () => {
      socket.off("SearchUserDetails");
    };
  }, [socket]);

  // Send a message
  const Sendmessage = () => {
    if (message && receiver) {
      socket.emit("sendMessage", receiver, message);
      setmessage("");
      setIsTyping(false);
    }
  };

  // Add a friend
  const Savefrd = () => {
    if (addfriendname) {
      socket.emit("Add_Friend", addfriendname);
      setaddfriendname("");
      setsearchvalue("");
      setsearchfrd([]);
    }
  };

  // Remove a friend
  const deletefrd = () => {
    if (receiver) {
      socket.emit("removefriend", receiver);
      setreceiver("");
    }
  };

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
                <div className="chattabtop" onScroll={handleScroll} ref={scrollContainerRef} aria-live="polite">
                  {loadingOlderMessages && <div>Loading older messages...</div>}
                  {messages
                  .filter((msg) => msg.sender === receiver||msg.sender===sender)
                  .map((msg, index) => (
                    <div
                      key={msg._id} // Use msg._id as the unique key
                      className={`message ${msg.sender === sender ? "sent" : "received"}`}
                    >
                      <p>{msg.message}</p>
                      <div className="messageinfo">
                        <span className='timestamp'>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        {msg.sender === sender && msg.seen && <span className="seen">Seen</span>}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        Sendmessage();
                      }
                    }}
                  />
                  <button onClick={Sendmessage}>Send</button>
                  
                </div>
              </div>
            </div>
          ) : (
            <div className="chattoph3">
              <h2>Chats</h2>
              <br />
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