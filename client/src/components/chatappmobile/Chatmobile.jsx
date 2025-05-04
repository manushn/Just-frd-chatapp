import React, { useRef, useState, useEffect } from 'react';
import "./css/chatmobile.css";
import { useNavigate } from "react-router-dom";

function ChatDesktop({ socket, messages, setmessages, friends, setfriends }) {
  const navigate = useNavigate();
  const sender = sessionStorage.getItem('username');
  const [message, setmessage] = useState("");
  const [receiver, setreceiver] = useState("");
  const [searchvalue, setsearchvalue] = useState("");
  const [searchfrd, setsearchfrd] = useState([]);
  const [addfriendname, setaddfriendname] = useState("");
  const [popup, setpopup] = useState(false);
  const [confirmmessage, setconfirmmessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [initialload, setinitialload] = useState(true);

  const [warnmessage,setwarnmessage]=useState("");
 

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    const threshold = 145;
    const scrollDifference = container.scrollHeight - container.scrollTop - container.clientHeight;
    return scrollDifference <= threshold;
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setmessages([]);
    setHasMore(true);
    setinitialload(true);
    setPage(1);
    fetchMessages(1);
  }, [receiver, socket]);

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

  useEffect(() => {
    if (initialload && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
        setinitialload(false);
      }, 100);
    }
  }, [messages, initialload]);

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

      setmessages((prev) => {
        const uniqueMessages = olderMessages.filter(
          (msg) => !prev.some((existing) => existing._id === msg._id)
        );
        return [...uniqueMessages, ...prev];
      });

      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight;
        }
        setLoadingOlderMessages(false);
      }, 0);
    });
  };

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      setmessages((prev) => {
        if (prev.some((msg) => msg._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
      setTimeout(() => {
        if (isNearBottom()) scrollToBottom();
      }, 50);
    };

    socket.on("NewMessage", handleNewMessage);
    return () => socket.off("NewMessage", handleNewMessage);
  }, [socket]);

  useEffect(() => {
    socket.emit("markSeen", receiver);

    socket.on("MessagesUpdated", (updatedMsg) => {
      setmessages((prev) =>
        prev.map((msg) => {
          const updated = updatedMsg.find((m) => m._id === msg._id);
          return updated ? { ...msg, seen: updated.seen } : msg;
        })
      );
      setTimeout(() => {
        if (isNearBottom()) scrollToBottom();
      }, 100);
    });

    socket.on("typings", (senderTyping) => {
      if (senderTyping === receiver) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      socket.off("MessagesUpdated");
      socket.off("typings");
    };
  }, [receiver, socket,messages,isTyping]);

  useEffect(() => {
    socket.emit("getFriendList");
    socket.on("FriendList", setfriends);
    return () => socket.off("FriendList");
  }, [socket]);

  useEffect(() => {
    setreceiver("");
  }, [friends]);

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

  useEffect(() => {
    socket.on("SearchUserDetails", setsearchfrd);
    return () => socket.off("SearchUserDetails");
  }, [socket]);

  const Sendmessage = () => {
    if (message && receiver) {
      socket.emit("sendMessage", receiver, message);
      setmessage("");
      setIsTyping(false);
    }
  };

  const Savefrd = () => {
    if (addfriendname) {
      socket.emit("Add_Friend", addfriendname);
      setaddfriendname("");
      setsearchvalue("");
      setsearchfrd([]);
    }
  };

  const deletefrd = () => {
    if (receiver) {
      socket.emit("removefriend", receiver);
      setreceiver("");
    }
  };

  return (
    <div className="chatmobilefull">
      <div className="chatmobiletop">
        <div className="mchattop">
          <div className='mchatlogo'>
            <img src='just-frd-logo1.webp' alt="Logo" />
            <h1>Just Friend</h1>
          </div>
          <div className="mchatprofile">
            <div className="mprofile">
              <img src='profile-user.png' alt="Profile" />
              <h3>{sender}</h3>
            </div>
            <button onClick={() => setpopup(true)}>Logout</button>
          </div>
        </div>

        <div className="mhomemain">
          {!receiver ? (
            <div className="mfrdoption">
              <div className="msearchtop">
                <h2>Friends</h2>
                <input
                  placeholder='Search Friends'
                  value={searchvalue}
                  onChange={(e) => setsearchvalue(e.target.value.toLowerCase().trim())}
                />
              </div>
              <div className="mfrdlist">
                {searchvalue ? (
                  <div className="mnewfrdlists">
                    <h4>Results for your search..</h4>
                    {searchfrd.length > 0 ? (
                      searchfrd.map((friend, index) => (
                        <div
                          key={index}
                          className="mnewfriend-item"
                          onClick={() => { setaddfriendname(friend); Savefrd(); }}
                        >
                          {friend}
                          <img src='addfrd.png' alt="Add" />
                        </div>
                      ))
                    ) : (
                      <div className='mnonewfrdlists'>
                        <p>No User Found!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="msavedfrdlist">
                    <h4>Saved Friends..</h4>
                    {friends.length > 0 ? (
                      friends.map((friend, index) => (
                        <div
                          key={index}
                          className="mfriend-item"
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
          ) : (
            <div className="mchat">
              <div className="mchattops">
                <div className="mbackbtn">
                <button onClick={() => setreceiver("")}>Back</button>
                </div>
                <div className="mreceiverpro">
                <h3>{receiver}</h3>
                <button onClick={() => { setpopup(true); setconfirmmessage(`Remove ${receiver} from friend list`); }}>
                  Un Friend
                </button>
                </div>
                
              </div>
              <div className="mchattab">
                <div className="mchattabtop" ref={scrollContainerRef} onScroll={handleScroll}>
                  {loadingOlderMessages && <div>Loading older messages...</div>}
                  {messages
                    .filter((msg) => msg.sender === receiver || msg.sender === sender)
                    .map((msg) => (
                      <div
                        key={msg._id}
                        className={`mmessage ${msg.sender === sender ? "sent" : "received"}`}
                      >
                        <p>{msg.message}</p>
                        <div className="mmessageinfo">
                          <span className='mtimestamp'>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          {msg.sender === sender && msg.seen && <span className="mseen">Seen</span>}
                        </div>
                      </div>
                    ))}
                  {isTyping && (
                    <div className="mtyping-indicator">
                      <p>{receiver} is typing...</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="mchattabbottom">
                <input
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => {
                    setmessage(e.target.value);
                    socket.emit("typing", receiver);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") Sendmessage();
                  }}
                />
                <button onClick={Sendmessage}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {popup && (
        <div className="mpopupcon">
          {warnmessage ? (
            <div className="mwarnmessagecon">
              <p>{warnmessage}</p>
              <button onClick={() => { setwarnmessage(''); setpopup(false); }}>X</button>
            </div>
          ) : (
            <>
              {confirmmessage ? (
                <div className="mconfirmmessage">
                  <p>{confirmmessage}</p>
                  <div className="mconfirmmessagebtn">
                    <button onClick={() => { setconfirmmessage(""); setpopup(false); }}>Cancel</button>
                    <button onClick={() => { setconfirmmessage(""); setpopup(false); deletefrd(); }}>
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mconfirmmessage">
                  <p>Are you sure to Logout!</p>
                  <div className="mconfirmmessagebtn">
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