// Central configuration for API URLs
// In development, these will fallback to localhost
// In production (Vercel), these will be set via Environment Variables

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
};

const getWsUrl = () => {
  const wsEnv = import.meta.env.VITE_WS_URL;
  if (wsEnv) return wsEnv.replace(/\/$/, "");
  
  let baseUrl = getBaseUrl().replace(/\/$/, "");
  
  // If baseline is just a domain like "api.example.com"
  if (!baseUrl.startsWith("http")) {
    // Default to wss if we're on a secure page
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${baseUrl}`;
  }

  if (baseUrl.startsWith("https://")) {
    return baseUrl.replace("https://", "wss://");
  }
  return baseUrl.replace("http://", "ws://");
};

export const API_URL = getBaseUrl().replace(/\/$/, "");
export const WS_URL = getWsUrl();

export const endpoints = {
  // Auth
  login: `${API_URL}/login`,
  signup: `${API_URL}/signup`,
  verifyOtp: `${API_URL}/verify-otp`,
  
  // User
  userProfile: `${API_URL}/users/me`,
  updateProfile: `${API_URL}/users/me/profile`,
  
  // Company Auth
  companyLogin: `${API_URL}/company/login`,
  companySignup: `${API_URL}/company/signup`,
  companyVerifyOtp: `${API_URL}/company/verify-otp`,
  companyMe: `${API_URL}/company/me`,
  
  // Interviews
  generateQuestions: `${API_URL}/generate-questions`,
  createInterview: `${API_URL}/company/create-interview`,
  companyInterviews: `${API_URL}/company/interviews`,
  submitInterview: (interviewId) => `${API_URL}/company/interview/${interviewId}/submit`,
  interviewResults: (interviewId) => `${API_URL}/company/interview-results/${interviewId}`,
  
  // Voice
  processVoiceAnswer: `${API_URL}/process-voice-answer`,
  evaluateVoiceInterview: `${API_URL}/evaluate-voice-interview`,
  
  // Resume
  analyzeCv: `${API_URL}/analyze-cv`,
  shortlistResumes: `${API_URL}/company/shortlist-resumes`,
  
  // Roadmap
  generateRoadmap: `${API_URL}/roadmap/generate-roadmap`,
};
