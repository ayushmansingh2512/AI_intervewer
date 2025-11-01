// CreateInterview.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateInterview = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: 'SE1',
    position: 'Product Designer',
    languages: '',
    other: '',
    questionType: 'mixed',
    numberOfQuestions: 5, 
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-questions', formData);
      if (response.data) {
        navigate('/dashboard/interview', { state: { questions: response.data } });
      }
    } catch (error) {
      toast.error('Failed to generate questions. Please try again.');
      console.error('Error generating questions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
            Create Interview
          </h1>
          <p className="text-[#6B6662] font-light">
            Configure your interview parameters
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
            <div className="space-y-6">
              {/* Role Selection */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Role Level
                </label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%231A1817' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center'
                  }}
                >
                  <option value="Intern">Intern</option>
                  <option value="SE1">Software Engineer I</option>
                  <option value="SE2">Software Engineer II</option>
                  <option value="SE3">Senior Software Engineer</option>
                  <option value="Staff">Staff Engineer</option>
                  <option value="Principal">Principal Engineer</option>
                  <option value="Lead">Engineering Lead</option>
                  <option value="Manager">Engineering Manager</option>
                </select>
              </div>

              {/* Position */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g., Product Designer, Frontend Engineer"
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Languages/Tools */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Languages & Tools
                </label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="e.g., React, TypeScript, Figma"
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Other Information */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Additional Context
                </label>
                <textarea
                  name="other"
                  value={formData.other}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Any additional information about the role or candidate..."
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {/* Question Type Selection */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Question Type
                </label>
                <select 
                  name="questionType" 
                  value={formData.questionType} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%231A1817' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center'
                  }}
                >
                  <option value="mixed">Mixed (All Types)</option>
                  <option value="coding">Coding Questions</option>
                  <option value="dsa">Data Structures & Algorithms</option>
                  <option value="system-design">System Design</option>
                  <option value="behavioral">Behavioral Questions</option>
                  <option value="theoretical">Theoretical/Conceptual</option>
                    <option value="reasoning">quantitative aptitude and logical reasoning</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Number of Questions
                </label>
                <input
                  type="number"
                  name="numberOfQuestions"
                  value={formData.numberOfQuestions}
                  onChange={handleChange}
                  min="3"
                  max="15"
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1.5 text-xs text-[#9B9791] font-light">Choose between 3 and 15 questions</p>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1A1817] text-white py-4 rounded-lg font-light tracking-wide hover:bg-[#2D2B28] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Questions...
              </span>
            ) : (
              'Start Interview'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateInterview;