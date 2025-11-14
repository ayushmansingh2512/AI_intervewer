import React from "react";
import { NavLink } from "react-router-dom";
import "./styles/Theme.css";
import noodle from "../assets/images/noodle_logo.png";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-[#FAF9F5]">
      <div className="flex flex-col items-center gap-5">
        <div className="w-50 "><img src={noodle} alt="" /></div>
        <h1 className="text-5xl font-light text-[#3D3D3A] tracking-tight">
          Welcome to{" "}
          <span className="text-[#D97757] font-semibold">
            parakh.ai
          </span>
        </h1>

        <p className="text-[#6B6B68] text-lg max-w-xl font-light">
          Do interviews,Practice interviews, get AI feedback, and improve your skills with confidence, and get talent
        </p>

        <div className="flex space-x-4 mt-4">
          <NavLink
            to="/login"
            className="px-8 py-3 bg-[#3D3D3A] text-white rounded-lg font-medium hover:bg-[#2D2D2A] transition-colors shadow-md"
          >
            Company
          </NavLink>
          <NavLink
            to="/signup"
            className="px-8 py-3 bg-[#D97757] text-white rounded-lg font-medium hover:bg-[#C56545] transition-colors shadow-md"
          >
            Talent
          </NavLink>
        </div>
        <p className="absolute bottom-4 text-[#6B6B68]">
          made with ❤️ by <span className="text-[#D97757]">noodle lab</span> in Delhi NCR
        </p>
      </div>
    </div>
  );
}

export default Home;