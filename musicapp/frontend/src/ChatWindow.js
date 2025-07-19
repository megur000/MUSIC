import React, { useState } from "react";
import axios from "axios";

const ChatWindow = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const res = await axios.post("http://localhost:5000/api/chat/message", {
      userId,
      message: input
    });

    const updated = [
      ...messages,
      { role: "user", content: input },
      { role: "assistant", content: res.data.reply, emotion: res.data.emotion }
    ];
    setMessages(updated);
    setInput("");
  };

  return (
    <div>
      <h2>AI Chat</h2>
      <div style={{ border: "1px solid #ccc", padding: "10px", height: "300px", overflowY: "scroll" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <b>{msg.role === "user" ? "You" : "Bot"}:</b> {msg.content}
            {msg.role === "assistant" && msg.emotion && (
              <em style={{ fontSize: "0.8em", color: "gray" }}> ({msg.emotion})</em>
            )}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{ width: "80%" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatWindow;
