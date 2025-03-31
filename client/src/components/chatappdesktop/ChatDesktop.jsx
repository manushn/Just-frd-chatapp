import React ,{ useState ,useEffect}from 'react'

function ChatDesktop({socket,messages,setmessages,friends,setfriends}) {
    const [message,setmessage]=useState("")
    
    useEffect(()=>{
            socket.on("NewMessage",(data)=>{
                setmessages(data)  
            });
         },[]);


    const Sendmessage=async()=>{
            socket.emit("sendMessage",message);
        }


  return (
    <div>
      <h1>💻Desktop</h1>
      <input 
      placeholder='message'
      value={message}
      onChange={(e)=>setmessage(e.target.value)}
      />
      <button onClick={Sendmessage}>Send</button>
      <div>
         <h2>{messages}</h2>
       </div>
      
    </div>
  )
}

export default ChatDesktop
