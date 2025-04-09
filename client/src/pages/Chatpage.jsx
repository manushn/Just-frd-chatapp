import React, { useEffect, useState,lazy } from "react";
import { io } from "socket.io-client";
import { useMediaQuery } from "react-responsive";
const Desktopview =lazy(()=>import("../components/chatappdesktop/ChatDesktop")) ;
const Mobileview = lazy(()=>import("../components/chatappmobile/Chatmobile")) ;

function Chatpage() {
    const [socket, setSocket] = useState(null);
    const token=localStorage.getItem('token');

    const [messages,setmessages]=useState([]);
    const [friends,setfriends]=useState([]);

    const ismobile = useMediaQuery({maxWidth:767});

    useEffect(() => {
        // Create a single socket connection
        const newSocket = io("http://192.168.1.23:4000", {
            auth: {
                token: token, // Pass token for authentication
            }
        });

        newSocket.on("connect", () => {
            console.log("✅ Connected to server");
        });

        newSocket.on("disconnect", () => {
            console.log("❌ Disconnected from server");
        });
        setSocket(newSocket);

        // Cleanup function to disconnect socket when the component unmounts
        return () => {
            newSocket.disconnect();
        };
    }, []); // Empty dependency array ensures it runs only once

    return (
        <div className="chatapp-full-main">
        {socket && ismobile ? (
            <Mobileview socket={socket} messages={messages} setmessages={setmessages} friends={friends} setfriends={setfriends}/>
        ) : socket ? (
            <Desktopview socket={socket} messages={messages} setmessages={setmessages} friends={friends} setfriends={setfriends}/>
        ) : (
            <h1>Connecting...</h1>
        )}
    </div>
    );
};

export default Chatpage;