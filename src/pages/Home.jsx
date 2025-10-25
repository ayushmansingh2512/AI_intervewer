import React from "react";
import { NavLink } from "react-router-dom";
import "./styles/Theme.css";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center move-bg">
      <h1 className="text-5xl font-bold text-clr mb-4">
        Welcome to{" "}
        <span className="text-clr text-shadow-sm text-shadow-gray-800 drop-shadow-[0_0_6px_rgb(75,75,75)]">
          AI Interviewer
        </span>
      </h1>

      <p className="text-gray-8 mb-8 text-lg max-w-xl">
        Practice interviews, get AI feedback, and improve your skills with confidence.
      </p>

      <div className="flex space-x-4">
        <NavLink
          to="/login"
          className="px-6 py-3 bg-gray-800 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors shadow-lg shadow-gray-600/40"
        >
          Login
        </NavLink>
        <NavLink
          to="/signup"
          className="px-6 py-3 bg-gray-800 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors shadow-lg shadow-gray-600/40"
        >
          Signup
        </NavLink>
      </div>
    </div>
  );
}

export default Home;
