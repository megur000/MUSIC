import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import ChatWindow from './ChatWindow'; // adjust path if it's in a different folder


const filterSongsByQuery = (songs, searchQuery, fields) => {
  const query = searchQuery.toLowerCase();
  return songs.filter(song =>
    fields.some(field =>
      (song[field]?.toLowerCase() || "").includes(query)
    )
  );
};

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  useEffect(() => {
    if (!user) return;

    axios.get('http://localhost:5000/songs', {
      params: { user_id: user.id }
    })
    .then(res => setSongs(res.data))
    .catch(err => console.error(err));
  }, [user]);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredSongs = filterSongsByQuery(songs, searchQuery, ['title', 'genre']);

  if (!user) {
    return (
      <div className="not-logged-in">
        <h2>You are not logged in.</h2>
        <button onClick={() => navigate("/")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="top-bar">
        {/* 👈 Left-most CGAT Bot logo */}
        <div className="logo" onClick={toggleChat}>
          🤖 CGAT Bot
        </div>

        {/* 👉 User Info & Logout */}
        <div className="user-info">
          <span>{user.firstName} ({user.access})</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* 👇 Chat Panel */}
      <div className={`chat-panel ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <span>Chat with CGAT Bot</span>
          <button onClick={toggleChat}>×</button>
        </div>
        <div className="chat-body">
          <p>Hello! How can I assist you?</p>
          <ChatWindow userId={user.id} />
        </div>
      </div>

      {/* ✅ Main content remains unchanged */}
      <div className="content">
        <div className="left-pane">
          <img src="/assests/opp.jpg" alt="Music Banner" className="banner-img"/>
        </div>
        <div className="right-pane">
          <div className="controls">
            <div className="quick-links-row">
              <button onClick={() => navigate('/home')} className="nav-btn">Home</button>
              <button onClick={() => navigate('/likes')} className="nav-btn">Likes</button>
              <button onClick={() => navigate('/artists')} className="nav-btn">Artist</button>
              <button onClick={() => navigate('/stats')} className="nav-btn">Stats</button>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-bar-inline"
              />
            </div>
          </div>
          <div className="songs-list">
            {filteredSongs.map((song, idx) => (
              <div className="song-card compact" key={idx}>
                <div className="compact-song-details">
                  <div className="top-row">
                    <h3 className="song-title">{song.title}</h3>
                    <audio
                      controls
                      controlsList="nodownload"
                      src={song.url}
                      className="audio-player"
                      onPlay={() => {
                        axios.post('http://localhost:5000/songs/play', {
                          user_id: user.id,
                          song_id: song.id,
                        }).catch(err => console.error("Error logging play event:", err));
                      }}
                    />
                  </div>
                  <div className="bottom-row">
                    <div className="genres">
                      {(song.genre || '').split('/').map((g, i) => (
                        <span className="genre-pill" key={i}>{g.trim()}</span>
                      ))}
                    </div>
                    <div className="song-actions">
                      <button
                        className={`like-btn ${song.likedByCurrentUser ? 'liked' : ''}`}
                        onClick={() => {
                          axios.post(`http://localhost:5000/songs/like/${song.id}`, {
                            user_id: user.id,
                          })
                          .then((response) => {
                            const updated = songs.map((s, i) =>
                              i === idx ? { ...s, likedByCurrentUser: response.data.liked } : s
                            );
                            setSongs(updated);
                          })
                          .catch(err => console.error("Error toggling like:", err));
                        }}
                      >
                        {song.likedByCurrentUser ? '❤️' : '🤍'} Like
                      </button>
                      <button
                        className="like-btn"
                        onClick={() => {
                          if (user.access?.toLowerCase() === "premium") {
                            const downloadUrl = `http://localhost:5000/download?url=${encodeURIComponent(song.url)}&name=${encodeURIComponent(song.title)}.mp3`;
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.setAttribute("download", `${song.title}.mp3`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            alert("You need a Premium account to download songs.");
                          }
                        }}
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
