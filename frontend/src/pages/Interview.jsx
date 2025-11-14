import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

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
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/company/interview/${interviewId}`);
        setQuestions(response.data.questions);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch interview', error);
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
    let mediaRecorder;
    let ws;

    const startEyeTracking = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setEyeTrackingStatus('Eye-tracking is active.');

        ws = new WebSocket(`ws://localhost:8000/company/interview/${interviewId}/stream`);
        ws.onopen = () => {
          console.log('WebSocket connection established.');
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              ws.send(event.data);
            }
          };
          mediaRecorder.start(1000); // Send data every 1 second
        };
        ws.onclose = () => {
          console.log('WebSocket connection closed.');
        };
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (error) {
        console.error('Error accessing webcam:', error);
        setEyeTrackingStatus('Could not access webcam.');
      }
    };

    if (interviewId) {
      startEyeTracking();
    }

    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
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
          await axios.post(`http://localhost:8000/company/interview/${interviewId}/submit`, {
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
        <div className="absolute top-4 right-4 text-xs text-gray-500">
            {eyeTrackingStatus}
        </div>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '160px', height: '120px', position: 'absolute', top: '40px', right: '20px', border: '1px solid #ccc' }} />
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