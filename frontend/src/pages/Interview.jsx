import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL, WS_URL } from '../config';

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const { questions: locationQuestions, questionType } = location.state || { questions: [], questionType: '' };

  const [questions, setQuestions] = useState(locationQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [eyeTrackingStatus, setEyeTrackingStatus] = useState('Initializing...');
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await axios.get(`${API_URL}/company/interview/${interviewId}`);

        // Redirect to voice interview if type is 'voice'
        if (response.data.interview_type === 'voice') {
          navigate(`/interview/voice/${interviewId}`);
          return;
        }

        setQuestions(response.data.questions);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch interview', error);
        if (error.response && error.response.status === 403) {
          // Scheduling error (not started or expired)
          setAccessError(error.response.data.detail);
        }
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
    } else {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    let ws;
    let intervalId;
    let currentStream = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const startEyeTracking = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        currentStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Explicitly play to avoid "white screen" if autoPlay fails
          videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
        setEyeTrackingStatus('Eye-tracking is active.');

        ws = new WebSocket(`${WS_URL}/company/interview/${interviewId}/stream`);

        ws.onopen = () => {
          console.log('WebSocket connection established.');

          intervalId = setInterval(() => {
            if (videoRef.current && ws.readyState === WebSocket.OPEN) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;

              // Check if video has dimensions before drawing
              if (canvas.width > 0 && canvas.height > 0) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                  if (blob && ws.readyState === WebSocket.OPEN) {
                    ws.send(blob);
                  }
                });
              }
            }
          }, 1000); // Send data every 1 second
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed.');
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Error accessing webcam:', error);
        setEyeTrackingStatus('Could not access webcam. Please check permissions.');
      }
    };

    if (interviewId) {
      startEyeTracking();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (ws) {
        ws.close();
      }
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        console.log('Stopped video stream.');
      }
    };
  }, [interviewId]);

  const handleNextQuestion = async () => {
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (interviewId) {
        try {
          await axios.post(`${API_URL}/company/interview/${interviewId}/submit`, {
            answers: newAnswers,
          });
          navigate(`/interview-completed`); // Redirect to a completion page
        } catch (error) {
          console.error('Failed to submit answers', error);
          // Handle error appropriately
        }
      } else {
        navigate('/dashboard/results', { state: { questions, answers: newAnswers } });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#6B6662] font-light">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC] text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-[#D4A574]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-[#1A1817] mb-4">Interview Not Accessible</h2>
          <p className="text-[#6B6662] font-light mb-6">{accessError}</p>
          <p className="text-sm text-[#9B9791] font-light">
            Please check back at the scheduled time or contact the interviewer for more information.
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#6B6662] font-light">No questions generated. Please go back and create an interview.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isMcq = questionType === 'quantitative-logical';
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl relative">
        {/* Camera Video - Fixed Top Right Corner */}
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-white rounded-lg shadow-lg border-2 border-[#E5E1DC] overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-48 h-36 object-cover"
            />
            <div className="px-3 py-1.5 bg-[#F7F5F2] border-t border-[#E5E1DC]">
              <p className="text-xs text-[#6B6662] font-light text-center">
                {eyeTrackingStatus}
              </p>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-light text-[#6B6662]">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-light text-[#6B6662]">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-[#E5E1DC] rounded-full h-1.5">
            <div
              className="bg-[#D4A574] h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-10 shadow-sm border border-[#E5E1DC]">
          <div className="mb-8">
            <h2 className="text-3xl font-light text-[#1A1817] mb-6 leading-relaxed">
              {typeof currentQuestion === 'object' ? currentQuestion.question : currentQuestion}
            </h2>
          </div>

          <div className="space-y-6">
            {isMcq && typeof currentQuestion === 'object' ? (
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name="mcq-option"
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="h-4 w-4 text-[#D4A574] border-[#E5E1DC] focus:ring-[#D4A574]"
                    />
                    <label htmlFor={`option-${index}`} className="ml-3 block text-lg font-light text-[#1A1817]">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Share your thoughts here..."
                rows="8"
                className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200 resize-none"
              />
            )}

            <button
              onClick={handleNextQuestion}
              disabled={!currentAnswer.trim()}
              className="w-full bg-[#1A1817] text-white py-4 rounded-lg font-light tracking-wide hover:bg-[#2D2B28] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Interview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;