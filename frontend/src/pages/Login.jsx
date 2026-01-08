import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/Theme.css";
import toast from "react-hot-toast";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    //error reset
    setErrors({ email: "", password: "", general: "" });

    //validation 
    const newErrors = {};
    if (!email) newErrors.email = "Please enter your email";
    if (!password) newErrors.password = "Please enter your password";

    // if there are errors, stop here
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setLoading(true);// loading status = loading

    try {
      const response = await axios.post("http://localhost:8000/login", {
        email,
        password,
      });
      //backend response
      console.log(response);

      //if backend response success
      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token); // storing token
        toast.success(`Welcome back, ${email}`);
        navigate("/dashboard"); //redirect to dashboard
      } else {
        //if login fail
        setErrors((prev) => ({
          ...prev,
          general: response.data.message || "Invalid email or password",
        }));
      }
    } catch (err) {
      //backend no response if
      console.error("Login error:", err);
      setErrors((prev) => ({
        ...prev,
        general:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
      }));
    } finally {
      setLoading(false);//loading status reset finlly
    }
  };

  return (
    <div className="move-bg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-transparent p-8">

        <h2 className="text-clr text-3xl font-bold text-left my-6">
          Welcome Back
        </h2>


        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-2 border rounded-md transition outline-none mb-3 ${errors.email ? "error-ele focus:error-ele" : "focus-ele hover-ele"
                }`}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-2 border rounded-md outline-none transition mb-3 ${errors.password ? "error-ele focus:error-ele" : "focus-ele hover-ele"
                }`}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {errors.general && (
            <p className="text-center text-red-600 text-sm">{errors.general}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 mb-3 rounded-md font-semibold hover:bg-gray-900 transition-all duration-200 hover-ele"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm mb-2">
          <p className="text-clr">
            Don’t have an account?{" "}
            <NavLink to="/signup" className="text-clr font-bold hover:underline">
              Sign up
            </NavLink>
          </p>
        </div>

        <div className="flex items-center justify-center w-full my-6">
          <div className="flex-grow border-t border-black"></div>
          <span className="mx-4 text-clr font-medium">OR</span>
          <div className="flex-grow border-t border-black"></div>
        </div>

        <button
          onClick={() => window.location.href = 'http://127.0.0.1:8000/auth/google?type=talent'}
          className="w-full border bg-transparent text-clr font-bold py-2 rounded-lg transition flex items-center justify-center hover-ele"
        >
          <img
            src="src/assets/images/icons8-google-50.png"
            alt="Google Logo"
            className="w-6 h-6 mr-2"
          />
          Log in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
