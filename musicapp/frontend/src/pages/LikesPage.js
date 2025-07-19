import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Home.css';
import { useNavigate } from 'react-router-dom';

const LikesPage = () => {
  const [likedSongs, setLikedSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // <-- Added for search bar

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    axios
      .get('http://localhost:5000/likes', {
        params: { user_id: user.id },
      })
      .then((res) => {
        setLikedSongs(res.data);
      })
      .catch((err) => console.error("Error loading liked songs", err));
  }, [user]);

  const handleUnlike = (songId) => {
    axios
      .post(`http://localhost:5000/songs/like/${songId}`, {
        user_id: user.id,
      })
      .then((response) => {
        if (!response.data.liked) {
          setLikedSongs((prev) => prev.filter((s) => s.id !== songId));
        }
      })
      .catch((err) => console.error("Error unliking song", err));
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

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
        <div className="user-info">
          <span>{user.firstName} ({user.access})</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="content">
        <div className="left-pane">
          <img src="/assests/opp.jpg" alt="Music Banner" className="banner-img" />
        </div>

        <div className="right-pane">
          {/* ✅ Controls section added here */}
          <div className="controls">
            <div className="quick-links-row">
              <button onClick={() => navigate('/home')} className="nav-btn">Home</button>
              <button onClick={() => navigate('/likes')} className="nav-btn">Likes </button>
              <button onClick={() => navigate('/artists')} className="nav-btn">Artist </button>
              <button onClick={() => navigate('/stats')} className="nav-btn">Stats</button>

              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-bar-inline"
              />
            </div>
          </div>

          <h2 className="page-title"> Your Liked Songs ...</h2>

          {likedSongs.length === 0 ? (
            <p>No liked songs yet.</p>
          ) : (
            <div className="songs-list">
              {likedSongs
                .filter(song =>
                  song.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((song, idx) => (
                  <div className="song-card compact" key={idx}>
                    <div className="compact-song-details">
                      <div className="top-row">
                        <h3 className="song-title">{song.title}</h3>
                        <audio controls src={song.url} className="audio-player"></audio>
                      </div>
                      <div className="bottom-row">
                        <div className="genres">
                          {(song.genre || '')
                            .split('/')
                            .map((g, i) => (
                              <span className="genre-pill" key={i}>{g.trim()}</span>
                            ))}
                        </div>
                        <div className="song-actions">
                          <button
                            className="like-btn liked"
                            onClick={() => handleUnlike(song.id)}
                          >
                            ❌ Unlike
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
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesPage;
