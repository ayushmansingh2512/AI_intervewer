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
import CreateInterview from './pages/CreateInterview';
import Interview from './pages/Interview';
import Results from './pages/Results';
import './App.css';
import CVParser from './pages/CVparser';
import CreateVoiceInterview from './pages/CreateVoiceInterview';
import VoiceInterview from './pages/VoiceInterview';
import VoiceInterviewResults from './pages/VoiceInterviewResults';

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
            <Route
              path="/dashboard/create-interview"
              element={
                <DashboardLayout>
                  <CreateInterview />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/interview"
              element={
                <DashboardLayout>
                  <Interview />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/results"
              element={
                <DashboardLayout>
                  <Results />
                </DashboardLayout>
              }
            />
                      <Route
                        path="/dashboard/cv-parser"
                           element={
                          <DashboardLayout>
                           <CVParser />
                          </DashboardLayout>
                        } 
                      />
                      <Route
                        path="/dashboard/voice-interview"
                        element={
                          <DashboardLayout>
                            <CreateVoiceInterview />
                          </DashboardLayout>
                        }
                      />
                      <Route
                        path="/dashboard/voice-interview/start"
                        element={
                          <DashboardLayout>
                            <VoiceInterview />
                          </DashboardLayout>
                        }
                      />
                      <Route
                        path="/dashboard/voice-interview/results"
                        element={
                          <DashboardLayout>
                            <VoiceInterviewResults />
                          </DashboardLayout>
                        }
                      />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
