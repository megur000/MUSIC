import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Home.css';
import './ArtistPage.css';
import { useNavigate } from 'react-router-dom';

const ArtistsPage = () => {
  const [artistSongs, setArtistSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch artist + song data
  useEffect(() => {
    if (!user) return;

    axios.get("http://localhost:5000/artists-with-songs", {
      params: { user_id: user.id }
    })
      .then((res) => {
        setArtistSongs(res.data);
      })
      .catch((err) => console.error("Error loading artist songs", err));
  }, [user]);

  // Toggle like status
  const handleLikeToggle = (songId, artistIndex, songIndex) => {
    axios.post(`http://localhost:5000/songs/like/${songId}`, {
      user_id: user.id,
    })
      .then((response) => {
        const updated = [...artistSongs];
        updated[artistIndex].songs[songIndex].likedByCurrentUser = response.data.liked;
        setArtistSongs(updated);
      })
      .catch(err => console.error("Error toggling like", err));
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

      {/* Top Bar */}
      <div className="top-bar">
        <div className="user-info">
          <span>{user.firstName} ({user.access})</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="content">

        {/* Left Pane with Banner */}
        <div className="left-pane">
          <img src="/assests/opp.jpg" alt="Music Banner" className="banner-img" />
        </div>

        {/* Right Pane with artist + songs */}
        <div className="right-pane">

          {/* Controls + Navigation */}
          <div className="controls">
            <div className="quick-links-row">
              <button onClick={() => navigate('/home')} className="nav-btn">Home</button>
              <button onClick={() => navigate('/likes')} className="nav-btn">Likes</button>
              <button onClick={() => navigate('/artists')} className="nav-btn">Artist</button>
              <button onClick={() => navigate('/stats')} className="nav-btn">Stats</button>
              <input
                type="text"
                placeholder="Search by artist/song..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-bar-inline"
              />
            </div>
          </div>

          {/* Artists with Songs */}
          {artistSongs.length === 0 ? (
            <p>No artists or songs found.</p>
          ) : (
            artistSongs
              .filter(artist =>
                artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                artist.songs.some(song =>
                  song.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
              )
              .map((artist, artistIndex) => (
                <div key={artist.id} className="artist-block">

                  <h3 className="artist-name">{artist.name}</h3>

                  {artist.songs.length === 0 ? (
                    <p>No songs available.</p>
                  ) : (
                    <div className="songs-list">
                      {artist.songs.map((song, songIndex) => (
                        <div key={song.id} className="song-card compact">

                          <div className="compact-song-details">

                            <div className="top-row">
                              <h3 className="song-title">{song.title}</h3>
                              <audio controls src={song.url} className="audio-player"></audio>
                            </div>

                            <div className="bottom-row">
                              <div className="genres">
                                {(song.genre || '').split('/').map((g, i) => (
                                  <span key={i} className="genre-pill">{g.trim()}</span>
                                ))}
                              </div>
                              <div className="song-actions">
                              <button
                              className={`like-btn ${song.likedByCurrentUser ? 'liked' : ''}`}
                              onClick={() => handleLikeToggle(song.id, artistIndex, songIndex)}
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
                  )}

                </div>
              ))
          )}

        </div>
      </div>
    </div>
  );
};

export default ArtistsPage;
