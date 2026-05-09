import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from '../config';
import axios from "axios";
import "./styles/Theme.css";

function OtpVerification() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
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

  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }

    // Auto-verify when all 6 digits are filled
    if (newOtp.every((digit) => digit !== "")) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);

      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = pastedData.split("");

    while (newOtp.length < 6) {
      newOtp.push("");
    }

    setOtp(newOtp);

    if (pastedData.length === 6) {
      verifyOtp(pastedData);
    } else if (pastedData.length > 0) {
      inputsRef.current[pastedData.length]?.focus();
    }
  };

  const verifyOtp = async (otpValue) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email,
        otp: otpValue,
      });

      if (response.status === 200) {

        toast.success("OTP verified successfully!");
        setTimeout(() => {
          navigate("/welcome");
        }, 500);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        e
        toast.error("An unexpected error occurred. Please try again.");
      }
      setOtp(new Array(6).fill(""));
      inputsRef.current[0]?.focus();
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        email,
      });

      if (response.status === 200) {
        toast.success("OTP resent successfully!");
        setOtp(new Array(6).fill(""));
        setTimer(60);
        setCanResend(false);
        inputsRef.current[0]?.focus();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      console.error("Resend OTP error:", error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="move-bg min-h-screen flex items-center justify-center">
      <div className="w-[500px] bg-transparent p-8 flex flex-col items-start gap-1.5">
        <h2 className="text-4xl mb-5 font-bold">
          Verify OTP
        </h2>

        <p className="text-[#717171] mb-12 font-light text-sm">
          An OTP has been sent to <span className="text-[#D97757] font-bold">{email}</span>.
        </p>

        <div className="w-full">
          <div className="flex justify-start gap-7 mb-8">
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
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  onFocus={(e) => e.target.select()}
                  ref={(el) => (inputsRef.current[index] = el)}
                  disabled={loading}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[#717171] font-light text-sm">
              {canResend ? (
                <button
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-[#D97757] font-bold hover:underline transition"
                >
                  {resendLoading ? "Resending..." : "Resend OTP"}
                </button>
              ) : (
                <span>Resend OTP in <span className="text-[#D97757] font-bold">{timer}s</span></span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OtpVerification;