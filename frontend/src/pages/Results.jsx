import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const Results = () => {
  const location = useLocation();
  const { questions, answers } = location.state || { questions: [], answers: [] };
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const evaluate = async () => {
      try {
        const response = await axios.post('http://localhost:8000/evaluate-answers', { questions, answers });
        setEvaluation(response.data);
      } catch (error) {
        toast.error('Failed to evaluate answers. Please try again.');
        console.error('Error evaluating answers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (questions.length > 0 && answers.length > 0) {
      evaluate();
    } else {
      setLoading(false);
    }
  }, [questions, answers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-[#D4A574] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[#6B6662] font-light">Evaluating your responses...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#6B6662] font-light">Could not retrieve evaluation. Please try again.</p>
        </div>
      </div>
    );
  }

  const averageScore = (evaluation.reduce((sum, item) => sum + item.score, 0) / evaluation.length).toFixed(1);
  const chartData = evaluation.map((item, index) => ({
    name: `Q${index + 1}`,
    score: item.score,
  }));

  return (
    <div className="min-h-screen bg-[#F7F5F2] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
            Interview Results
          </h1>
          <p className="text-[#6B6662] font-light">
            Your performance summary and detailed feedback
          </p>
        </div>

        {/* Average Score Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC] mb-8">
          <div className="text-center">
            <p className="text-sm font-light text-[#6B6662] mb-2 tracking-wide uppercase">Average Score</p>
            <p className="text-6xl font-light text-[#1A1817] mb-2">{averageScore}</p>
            <p className="text-[#6B6662] font-light">out of 10</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC] mb-8">
          <h3 className="text-xl font-light text-[#1A1817] mb-6">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DC" />
              <XAxis dataKey="name" tick={{ fill: '#6B6662', fontWeight: 300 }} />
              <YAxis tick={{ fill: '#6B6662', fontWeight: 300 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E1DC',
                  borderRadius: '8px',
                  fontWeight: 300
                }} 
              />
              <Bar dataKey="score" fill="#1A1817" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Feedback */}
        <div className="space-y-6">
          {evaluation.map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-light text-[#1A1817]">Question {index + 1}</h3>
                <span className="bg-[#F7F5F2] px-4 py-2 rounded-lg text-[#1A1817] font-light">
                  {item.score}/10
                </span>
              </div>
              <p className="text-[#6B6662] font-light leading-relaxed">{item.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;