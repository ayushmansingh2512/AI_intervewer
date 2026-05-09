import React from 'react';
import { Link } from 'react-router-dom';

const InterviewCompleted = () => {
  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
          Thank you for completing the interview!
        </h1>
        <p className="text-[#6B6662] font-light mb-8">
          Your answers have been submitted. The company will get back to you soon.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-[#D4A574] text-white rounded-lg font-light hover:bg-[#C0956B] transition-all"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
};

export default InterviewCompleted;
