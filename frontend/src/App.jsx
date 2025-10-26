import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Otpverification from './pages/Otpverification';
import WelcomeForm from './pages/WelcomeForm';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './pages/DashboardLayout';
import ProtectedRoute from './auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/otp" element={<Otpverification />} />
          <Route path="/welcome" element={<WelcomeForm />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              }
            />
            {/* Add other protected routes here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
