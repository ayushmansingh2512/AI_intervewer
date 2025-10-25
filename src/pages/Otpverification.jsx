import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Welcome() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    lastname: "",
    password: "",
    company: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({
    label: "",
    percent: 0,
    color: "",
  });
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) navigate("/");
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
    if (name === "password") {
      setShowChecklist(true);
      evaluatePassword(value);
    }
  };

  const evaluatePassword = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let strengthData = { label: "Weak", percent: 25, color: "bg-red-500" };
    if (score === 2)
      strengthData = { label: "Medium", percent: 50, color: "bg-yellow-500" };
    else if (score === 3)
      strengthData = { label: "Good", percent: 75, color: "bg-blue-500" };
    else if (score === 4)
      strengthData = { label: "Strong", percent: 100, color: "bg-green-500" };

    setStrength(strengthData);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.lastname.trim()) newErrors.lastname = "Last name is required";
    if (!form.company.trim()) newErrors.company = "Company name is required";

    const pass = form.password;
    if (!pass) newErrors.password = "Password is required";
    else if (pass.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(pass))
      newErrors.password = "Must contain at least one uppercase letter";
    else if (!/[0-9]/.test(pass))
      newErrors.password = "Must contain at least one number";
    else if (/\s/.test(pass)) newErrors.password = "No spaces allowed";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }
    toast.success("Welcome aboard!");
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center move-bg px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-clr mb-2 text-center">
          Welcome Onboard
        </h1>
        <p className="text-gray-700 font-semibold mb-8 text-center">
          Fill in your information below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-8 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username*"
              value={form.username}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.username
                  ? "border-red-500"
                  : "border-gray-400 focus:ring-gray-700"
              }`}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-8 mb-1">
              Last name
            </label>
            <input
              type="text"
              name="lastname"
              placeholder="Enter your lastname"
              value={form.lastname}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.lastname
                  ? "border-red-500"
                  : "border-gray-400 focus:ring-gray-700"
              }`}
            />
            {errors.lastname && (
              <p className="text-red-500 text-sm mt-1">{errors.lastname}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-8 mb-1">
              Password
            </label>
            <div className="flex items-center gap-3">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your Password*"
                value={form.password}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.password
                    ? "border-red-500"
                    : "border-gray-400 focus:ring-gray-700"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-sm underline text-gray-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {form.password && (
              <div className="mt-2">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.percent}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-1 font-semibold text-gray-700">
                  Strength: {strength.label}
                </p>
              </div>
            )}

            {showChecklist && (
              <div className="mt-3 p-3 border rounded-md bg-gray-50 text-sm">
                <p className="font-semibold mb-2">Password must include:</p>
                <ul className="space-y-1">
                  <li
                    className={
                      form.password.length >= 8
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {form.password.length >= 8 ? "✓" : "✗"} 8–20 characters
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(form.password)
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {/[A-Z]/.test(form.password) ? "✓" : "✗"} At least one
                    capital letter
                  </li>
                  <li
                    className={
                      /[0-9]/.test(form.password)
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {/[0-9]/.test(form.password) ? "✓" : "✗"} At least one
                    number
                  </li>
                  <li
                    className={
                      !/\s/.test(form.password)
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {!/\s/.test(form.password) ? "✓" : "✗"} No spaces
                  </li>
                </ul>
              </div>
            )}

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Company name
            </label>
            <input
              type="text"
              name="company"
              placeholder="Enter your company name*"
              value={form.company}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.company
                  ? "border-red-500"
                  : "border-gray-400 focus:ring-gray-700"
              }`}
            />
            {errors.company && (
              <p className="text-red-500 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default Welcome;
