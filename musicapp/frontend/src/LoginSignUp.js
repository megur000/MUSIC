import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function LoginSignUp() {
  const [isLoginPage, setIsLoginPage] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    access: "Free",
    email: "",
    password: ""
  });

  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      });

      const result = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(result.user));
        navigate("/home");
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData)
      });
      const result = await res.json();
      alert(result.message);
    } catch (err) {
      alert("Signup failed");
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <div className="left-panel">
        <h1>🎵 My Music App</h1>
        <p>Stream your favorite songs anytime.</p>
      </div>

      <div className="right-panel">
        <h2>{isLoginPage ? "Login" : "Sign Up"}</h2>
        {isLoginPage ? (
          <form onSubmit={handleLoginSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={loginData.email}
              onChange={handleLoginChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
            <button type="submit">Login</button>
            <p>
              Don't have an account?{" "}
              <span className="link" onClick={() => setIsLoginPage(false)}>
                Sign Up
              </span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit}>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={signupData.firstName}
              onChange={handleSignupChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={signupData.lastName}
              onChange={handleSignupChange}
              required
            />
            <input
              type="date"
              name="dob"
              value={signupData.dob}
              onChange={handleSignupChange}
              required
            />
            <select
              name="gender"
              value={signupData.gender}
              onChange={handleSignupChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <select
              name="access"
              value={signupData.access}
              onChange={handleSignupChange}
            >
              <option value="Free">Free</option>
              <option value="Premium">Premium</option>
            </select>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={signupData.email}
              onChange={handleSignupChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={signupData.password}
              onChange={handleSignupChange}
              required
            />
            <button type="submit">Sign Up</button>
            <p>
              Already have an account?{" "}
              <span className="link" onClick={() => setIsLoginPage(true)}>
                Login
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginSignUp;
