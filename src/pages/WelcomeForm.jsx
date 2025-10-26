import React, { useState, useEffect } from "react";
import './styles/Theme.css'
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

function Welcome() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    lastname: "",
    password: "",
    company: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [showPasswordBox, setShowPasswordBox] = useState(false);

  // if direct access tried without auth redirect
  useEffect(() => {
    const userEmail = localStorage.getItem("email");
    if (!userEmail) {
      toast.error("Please verify your email first!");
      navigate("/");
    }
  }, []);

  // handle input 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });

    if (name === "password") {
      checkPasswordRequirements(value);
    }
  };

  //  password requirements check
  const checkPasswordRequirements = (password) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    });
  };

  // form validation
  const validate = () => {
    const newErr = {};
    if (!formData.username) newErr.username = "Username required";
    if (!formData.lastname) newErr.lastname = "Lastname required";
    if (!formData.password) newErr.password = "Password required";
    if (!formData.company) newErr.company = "Company name required";
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  // submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors and try again.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/welcome", formData);
      if (res.data.success) {
        toast.success("Welcome onboard!");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        toast.error("Something went wrong!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error, please try later.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center move-bg px-4">
      <div className="w-full max-w-md bg-transparent p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome onboard</h2>
        <p className="text-gray-8 mb-5">Fill in your information below</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium">Username</label>
            <input
              type="text"
              name="username"
              className={`w-full hover-ele focus-ele border rounded px-3 py-2 ${errors.username ? 'border-red-500' : ''}`}
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <p className="text-red-600 text-md font-medium mt-1">{errors.username}</p>}
          </div>

          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium">Last name</label>
            <input
              type="text"
              name="lastname"
              className={`w-full hover-ele focus-ele border rounded px-3 py-2 ${errors.lastname ? 'border-red-500' : ''}`}
              value={formData.lastname}
              onChange={handleChange}
            />
            {errors.lastname && <p className="text-red-600 text-md font-medium mt-1">{errors.lastname}</p>}
          </div>

          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type="password"
                name="password"
                className={`w-full hover-ele focus-ele border rounded px-3 py-2 ${errors.password ? 'border-red-500' : ''}`}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordBox(true)}
                onBlur={() => setShowPasswordBox(false)}
              />
              {errors.password && <p className="text-red-600 text-md font-medium mt-1">{errors.password}</p>}

              {showPasswordBox && (
                <div 
                  className="absolute left-full ml-3 top-0 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50"
                  style={{
                    animation: 'fadeIn 0.2s ease-in-out'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <style>{`
                    @keyframes fadeIn {
                      from {
                        opacity: 0;
                        transform: translateX(-10px);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(0);
                      }
                    }
                  `}</style>
                  
                  <h4 className="text-sm font-semibold mb-3 text-gray-800">Password Requirements</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${passwordRequirements.minLength ? 'text-green-500' : 'text-gray-400'}`}>
                        {passwordRequirements.minLength ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-600'}`}>
                        Minimum 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${passwordRequirements.hasUpperCase ? 'text-green-500' : 'text-gray-400'}`}>
                        {passwordRequirements.hasUpperCase ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-gray-600'}`}>
                        At least one uppercase letter
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${passwordRequirements.hasLowerCase ? 'text-green-500' : 'text-gray-400'}`}>
                        {passwordRequirements.hasLowerCase ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-gray-600'}`}>
                        At least one lowercase letter
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${passwordRequirements.hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                        {passwordRequirements.hasNumber ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-600'}`}>
                        At least one number
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${passwordRequirements.hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`}>
                        {passwordRequirements.hasSpecialChar ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-gray-600'}`}>
                        At least one special character
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium">Company name</label>
            <input
              type="text"
              name="company"
              className={`w-full hover-ele focus-ele border rounded px-3 py-2 ${errors.company ? 'border-red-500' : ''}`}
              value={formData.company}
              onChange={handleChange}
            />
            {errors.company && <p className="text-red-600 text-md font-medium mt-1">{errors.company}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 mt-4 rounded hover-ele focus-ele transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default Welcome;