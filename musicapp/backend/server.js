const express = require("express");
const mysql = require("mysql2");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const http = require("http");
const https = require("https");

dotenv.config();

const app = express();
const server = http.createServer(app); // for socket.io
const io = require("socket.io")(server, { cors: { origin: "*" } });

const PORT = 5000;

// ---------- Middleware ----------
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // for chatbot

// ---------- MySQL Setup ----------
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "cWmp5ZBp",
  database: "music"
});

db.connect((err) => {
  if (err) return console.error("❌ MySQL connection error:", err);
  console.log("✅ Connected to MySQL DB");
});

// ---------- MongoDB Setup ----------
const Chat = require("./Chat"); // Chat schema
mongoose.connect(process.env.MONGO_URI || process.env.NGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB (Chatbot)"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ---------- OpenAI Setup ----------
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------- Socket.IO ----------
io.on("connection", (socket) => {
  console.log("💬 User connected to socket");
  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });
});

// ---------- Chat Controller ----------
const detectEmotion = async (message) => {
  if (!message) return "neutral";
  if (message.includes("sad")) return "sad";
  if (message.includes("angry")) return "angry";
  return "neutral"; // Default
};

const getChatResponse = async (message, emotion) => {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `Respond empathetically. User feels ${emotion}.` },
        { role: "user", content: message }
      ]
    });

    return res.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ OpenAI Error:", err);
    return "Sorry, I couldn't process that.";
  }
};

// ---------- Chatbot Route ----------
app.post("/api/chat/message", async (req, res) => {
  const { userId, message } = req.body;
  const emotion = await detectEmotion(message);
  const reply = await getChatResponse(message, emotion);

  await Chat.updateOne(
    { userId },
    {
      $push: {
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: reply }
        ]
      }
    },
    { upsert: true }
  );

  res.json({ reply, emotion });
});


// Signup Route
app.post("/signup", (req, res) => {
  const { firstName, lastName, dob, gender, access, email, password } = req.body;

  const sql = `
    INSERT INTO users (first_name, last_name, dob, gender, access, email, password)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [firstName, lastName, dob, gender, access, email, password], (err, result) => {
    if (err) {
      console.error("❌ Signup failed:", err);
      return res.status(500).json({ error: "Signup failed" });
    }
    res.status(200).json({ message: "User registered successfully!" });
  });
});

// Login Route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Login error" });
    }
    if (results.length === 1) {
      const user = results[0];

      console.log("Sending user to frontend:", {
        id: user.id,
        firstName: user.first_name,
        email: user.email,
        access: user.access
      });

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          firstName: user.first_name,
          email: user.email,
          access: user.access  // ✅ Send raw value like "Free" or "Premium"
        }
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
});


    







// Songs Route with likedByCurrentUser flag
app.get("/songs", (req, res) => {
  const userId = req.query.user_id;

  const sql = `
    SELECT 
      s.*, 
      EXISTS (
        SELECT 1 FROM user_likes ul 
        WHERE ul.user_id = ? AND ul.song_id = s.id
      ) AS likedByCurrentUser
    FROM songs s
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("❌ Error fetching songs:", err);
      return res.status(500).send("Server error");
    }

    // Convert likedByCurrentUser to true/false
    const processedSongs = result.map(song => ({
      ...song,
      likedByCurrentUser: !!song.likedByCurrentUser
    }));

    res.send(processedSongs);
  });
});

// Like / Unlike a song
app.post("/songs/like/:id", (req, res) => {
  const songId = req.params.id;
  const userId = req.body.user_id;

  const checkSql = "SELECT * FROM user_likes WHERE user_id = ? AND song_id = ?";
  db.query(checkSql, [userId, songId], (err, results) => {
    if (err) return res.status(500).send("Server error on check");

    if (results.length > 0) {
      // Unlike
      const deleteSql = "DELETE FROM user_likes WHERE user_id = ? AND song_id = ?";
      db.query(deleteSql, [userId, songId], (err2) => {
        if (err2) return res.status(500).send("Error removing like");
        res.send({ liked: false });
      });
    } else {
      // Like
      const insertSql = "INSERT INTO user_likes (user_id, song_id) VALUES (?, ?)";
      db.query(insertSql, [userId, songId], (err3) => {
        if (err3) return res.status(500).send("Error adding like");
        res.send({ liked: true });
      });
    }
  });
});



app.get('/likes', (req, res) => {
  const userId = req.query.user_id;
  

  db.query('CALL get_user_likes(?)', [userId], (err, results) => {
    if (err) {
      console.error("Error fetching liked songs:", err);
      return res.status(500).json({ error: err.message });
    }

    // `results` is an array of arrays due to stored procedure
    res.json(results[0]);  // Send only the result set
  });
});

app.get('/artists-with-songs', (req, res) => {
  const userId = req.query.user_id;

  const sql = `
    SELECT 
      a.id AS artist_id, a.name AS artist_name,
      s.id AS song_id, s.title, s.genre, s.url,
      EXISTS (
        SELECT 1 FROM user_likes ul 
        WHERE ul.user_id = ? AND ul.song_id = s.id
      ) AS likedByCurrentUser
    FROM artists a
    LEFT JOIN songs s ON a.id = s.artist_id
    ORDER BY a.name, s.title
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching artists with songs:", err);
      return res.status(500).send("Server error");
    }

    const artistsMap = {};

    results.forEach(row => {
      const artistId = row.artist_id;
      if (!artistsMap[artistId]) {
        artistsMap[artistId] = {
          id: artistId,
          name: row.artist_name,
          songs: [],
        };
      }

      if (row.song_id) {
        artistsMap[artistId].songs.push({
          id: row.song_id,
          title: row.title,
          genre: row.genre,
          url: row.url,
          likedByCurrentUser: !!row.likedByCurrentUser,
        });
      }
    });

    res.json(Object.values(artistsMap));
  });
});

app.get('/download', (req, res) => {
  const fileUrl = req.query.url;
  const fileName = req.query.name || 'song.mp3';

  if (!fileUrl) return res.status(400).send("Missing file URL");

  const client = fileUrl.startsWith('https') ? https : http;

  client.get(fileUrl, (fileRes) => {
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "audio/mpeg");

    fileRes.pipe(res);
  }).on('error', (err) => {
    console.error("Download error:", err);
    res.status(500).send("Download failed");
  });
});

// POST /songs/play
app.post('/songs/play', (req, res) => {
  const { user_id, song_id } = req.body;

  if (!user_id || !song_id) {
    return res.status(400).json({ error: "Missing user_id or song_id" });
  }

  const sql = "INSERT INTO played (user_id, song_id, played_at) VALUES (?, ?, NOW())";

  db.query(sql, [user_id, song_id], (err, result) => {
    if (err) {
      console.error("Failed to insert into played table:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Play logged successfully" });
  });
});

app.get('/stats/most-liked-songs', (req, res) => {
  const sql = `
    SELECT s.id, s.title, COUNT(ul.song_id) AS likes
    FROM user_likes ul
    JOIN songs s ON s.id = ul.song_id
    GROUP BY ul.song_id
    ORDER BY likes DESC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching liked songs stats:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});


// GET /stats/most-liked-genres
app.get('/stats/most-liked-genres', (req, res) => {
  const sql = `
    SELECT s.genre, COUNT(*) as count
    FROM user_likes ul
    JOIN songs s ON s.id = ul.song_id
    GROUP BY s.genre
    ORDER BY count DESC
    LIMIT 6;
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(results);
  });
});

app.get('/recommend/:userId', (req, res) => {
  const userId = req.params.userId;

  const likedSql = `SELECT song_id FROM user_likes WHERE user_id = ?`;
  db.query(likedSql, [userId], (err, likedRows) => {
    if (err) return res.status(500).send("Error getting liked songs");

    const recentSql = `SELECT song_id FROM played WHERE user_id = ? ORDER BY played_at DESC LIMIT 5`;
    db.query(recentSql, [userId], (err2, recentRows) => {
      if (err2) return res.status(500).send("Error getting recent plays");

      const baseSongIds = [...new Set([...likedRows.map(r => r.song_id), ...recentRows.map(r => r.song_id)])];

      if (baseSongIds.length === 0) return res.json([]);

      const metaSql = `SELECT genre, artist_id FROM songs WHERE id IN (?)`;
      db.query(metaSql, [baseSongIds], (err3, metaRows) => {
        if (err3) return res.status(500).send("Error getting song meta");

        const genres = [...new Set(metaRows.map(r => r.genre))];
        const artists = [...new Set(metaRows.map(r => r.artist_id))];

        const recommendSql = `
          SELECT s.id, s.title, s.genre, s.url, a.name as artist_name
          FROM songs s
          JOIN artists a ON s.artist_id = a.id
          WHERE (s.genre IN (?) OR s.artist_id IN (?))
          AND s.id NOT IN (
            SELECT song_id FROM played WHERE user_id = ?
            UNION
            SELECT song_id FROM user_likes WHERE user_id = ?
          )
          LIMIT 20
        `;

        db.query(recommendSql, [genres, artists, userId, userId], (err4, recRows) => {
          if (err4) return res.status(500).send("Error getting recommendations");
          res.json(recRows);
        });
      });
    });
  });
});







server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
