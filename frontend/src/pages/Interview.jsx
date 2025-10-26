import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions } = location.state || { questions: [] };
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const handleNextQuestion = () => {
    setAnswers([...answers, currentAnswer]);
    setCurrentAnswer('');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      navigate('/dashboard/results', { state: { questions, answers: [...answers, currentAnswer] } });
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#6B6662] font-light">No questions generated. Please go back and create an interview.</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
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
              {questions[currentQuestionIndex]}
            </h2>
          </div>

          <div className="space-y-6">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Share your thoughts here..."
              rows="8"
              className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200 resize-none"
            />

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