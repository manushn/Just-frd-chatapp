import React, { useState, useEffect } from 'react';

function ChatDesktop({ socket, messages, setmessages }) {
  const [message, setmessage] = useState("");
  const [receiver, setreceiver] = useState("");

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
    <div>
      <h1>💻 Desktop Chat</h1>
      <h2>Username: {sessionStorage.getItem("username")}</h2>

      <input
        placeholder="Receiver"
        value={receiver}
        onChange={(e) => setreceiver(e.target.value.toLowerCase().trim())}
      />
      <br />
      <br />
      <input
        placeholder="Message"
        value={message}
        onChange={(e) => setmessage(e.target.value)}
      />
      <button onClick={Sendmessage}>Send</button>

      <div className="messageview">
        {messages.map((msg, id) => (
          <p key={id}>
            <b>{msg.sender}</b>: {msg.message}
          </p>
        ))}
      </div>
    </div>
  );
}

export default ChatDesktop;