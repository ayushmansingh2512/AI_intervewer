import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { API_URL } from '../config';
import "./styles/Theme.css";

function CompanyWelcomeForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const email = localStorage.getItem("email");

  useEffect(() => {
    if (!email) {
      toast.error("Please verify your email first!");
      navigate("/company-signup");
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.company_name) newErrors.company_name = "Company name is required";
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors and try again.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/company/getting-started`, {
        email,
        ...formData,
      });

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("company_name", formData.company_name);
        toast.success("Welcome aboard!");
        navigate("/company/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      console.error("Getting started error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center move-bg px-4">
      <div className="w-full max-w-md bg-transparent p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome to Solvithem</h2>
        <p className="text-gray-8 mb-5">Fill in your company information below</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium">Company Name</label>
            <input
              type="text"
              name="company_name"
              className={`w-full hover-ele focus-ele border rounded px-3 py-2 ${errors.company_name ? "border-red-500" : ""
                }`}
              value={formData.company_name}
              onChange={handleChange}
            />
            {errors.company_name && (
              <p className="text-red-600 text-md font-medium mt-1">
                {errors.company_name}
              </p>
            )}
          </div>

          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              className={`w-full hover-ele focus-ele border rounded px-3 py-2 ${errors.password ? "border-red-500" : ""
                }`}
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <p className="text-red-600 text-md font-medium mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 mt-4 rounded hover-ele focus-ele transition"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompanyWelcomeForm;
