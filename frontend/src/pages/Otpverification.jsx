import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import "./styles/Theme.css";

function OtpVerification() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  const email = localStorage.getItem("email");

  useEffect(() => {
    if (!email) {
      toast.error("Please sign up first!");
      navigate("/signup");
    }
    inputsRef.current[0]?.focus();
  }, [email, navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    //Focus next input
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      toast.error("Please enter the complete OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/verify-otp", {
        email,
        otp: enteredOtp,
      });

      if (response.status === 200) {
        toast.success("OTP verified successfully!");
        navigate("/welcome");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="move-bg min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-transparent p-8 flex flex-col items-center">
        <h2 className="text-4xl font-bold text-center text-clr mb-4">
          Verify OTP
        </h2>
        <p className="text-clr text-center mb-8">
          An OTP has been sent to <strong>{email}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex justify-center gap-2 mb-8">
            {otp.map((data, index) => {
              return (
                <input
                  className="w-12 h-12 text-center text-2xl border rounded-lg focus:outline-none focus:ring-2 focus-ele hover-ele transition"
                  type="text"
                  name="otp"
                  maxLength="1"
                  key={index}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                  ref={(el) => (inputsRef.current[index] = el)}
                />
              );
            })}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover-ele transition"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OtpVerification;