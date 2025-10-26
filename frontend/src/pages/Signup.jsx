import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import "./styles/Theme.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/signup", {
        email,
      });

      if (response.status === 200) {
        localStorage.setItem("email", email);
        toast.success(
          <span>
            OTP sent to <b style={{ color: "#2563eb" }}>{email}</b>
          </span>
        );
        navigate("/otp");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="move-bg min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-transparent p-8 flex flex-col">
        <h2 className="text-4xl font-bold text-left text-clr">Sign Up</h2>

        <form onSubmit={handleSignup} className="space-y-4 w-full">
          <div className="mt-12 mb-7">
            <label htmlFor="email" className="block text-gray-8 mb-2 mx-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus-ele hover-ele transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg hover-ele transition"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-clr">
            Already have an account?{" "}
            <NavLink to="/login" className="text-clr font-bold hover:underline">
              Log in
            </NavLink>
          </p>
        </div>

        <div className="flex items-center justify-center w-full my-6">
          <div className="flex-grow border-t border-black"></div>
          <span className="mx-4 text-clr font-medium">OR</span>
          <div className="flex-grow border-t border-black"></div>
        </div>

        <button className="w-full border bg-transparent text-clr font-bold py-2 rounded-lg flex items-center justify-center hover-ele transition">
          <img
            src="src/assets/images/icons8-google-50.png"
            alt="Google Logo"
            className="w-6 h-6 mr-2"
          />
          Sign up with Google
        </button>
      </div>
    </div>
  );
}

export default Signup;
