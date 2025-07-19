import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginSignUp from "./LoginSignUp";
import Home from "./Home";
import LikesPage from './pages/LikesPage';
import ArtistsPage from './pages/ArtistsPage';

import Stats from './pages/Stats';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/likes" element={<LikesPage />} />
        <Route path="/artists" element={<ArtistsPage />} />
        <Route path="/stats" element={<Stats/>} />
      </Routes>
    </Router>
  );
}

export default App;
