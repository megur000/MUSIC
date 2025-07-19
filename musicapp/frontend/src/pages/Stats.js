import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import Plot from 'react-plotly.js'; // 👈 Add this for Plotly support
import './Stats.css';

const Stats = () => {
  const [topLikedSongs, setTopLikedSongs] = useState([]);
  const [genreStats, setGenreStats] = useState([]);

  const genreColors = ["#1DB954", "#FF6384", "#36A2EB", "#FFCE56", "#8E44AD", "#00C49F"];

  useEffect(() => {
    axios.get('http://localhost:5000/stats/most-liked-songs')
      .then(res => setTopLikedSongs(res.data))
      .catch(err => console.error("Error fetching top liked songs:", err));

    axios.get('http://localhost:5000/stats/most-liked-genres')
      .then(res => setGenreStats(res.data))
      .catch(err => console.error("Error fetching genre stats:", err));
  }, []);

const [recommendations, setRecommendations] = useState([]);
const userId = 1; // Replace with dynamic user ID if available

// Add this to useEffect block
useEffect(() => {
  axios.get(`http://localhost:5000/recommend/${userId}`)
    .then(res => setRecommendations(res.data))
    .catch(err => console.error("Error fetching recommendations:", err));
}, []);

  return (
    <div className="stats-grid">
      {/* Quadrant 1 - Bar Chart */}
      <div className="quadrant">
        <h3>Top Liked Songs</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topLikedSongs}
            margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
          >
            <XAxis
              dataKey="title"
              angle={-35}
              textAnchor="end"
              height={60}
              tick={{ fill: "#ccc", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "#ccc" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1c1c1c", color: "#fff" }}
              cursor={{ fill: '#1DB95420' }}
            />
            <Bar dataKey="likes" fill="#1DB954" radius={[10, 10, 0, 0]}>
              <LabelList   fill="#fff"  />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant 2 - True 3D-Style Pie Chart */}
      <div className="quadrant">
        <h3>🎵 Most Played Genres </h3>
        <Plot
          data={[
            {
              type: "pie",
              values: genreStats.map(g => g.count),
              labels: genreStats.map(g => g.genre),
              hole: 0.3,
              textinfo: "label+percent",
              marker: { colors: genreColors },
              pull: 0.03,
            }
          ]}
          layout={{
            paper_bgcolor: "#1e1e1e",
            plot_bgcolor: "#1e1e1e",
            font: { color: "#ffffff" },
            showlegend: true,
            height: 300,
            margin: { t: 0, l: 0, r: 0, b: 0 },
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Quadrant 3 */}
      <div className="quadrant">
  <h3>📦 Recommended Songs for You</h3>
  <div className="recommendations">
    {recommendations.map((song, index) => (
      <div className="recommend-card" key={index}>
        <div className="icon">🎵</div>
        <div className="info">
          <div className="title">{song.title}</div>
          <div className="artist">{song.artist_name}</div>
          <div className="tags">{song.genre}</div>
        </div>
      </div>
    ))}
  </div>
</div>


      {/* Quadrant 4 */}
      <div className="quadrant">
        <h3>📈 Placeholder for Chart 4</h3>
        <div className="placeholder">E.g., Most Downloaded Songs</div>
      </div>
    </div>
  );
};

export default Stats;
