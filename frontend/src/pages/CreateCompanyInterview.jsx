import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ClockLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="relative w-24 h-24 mb-8">
        {/* Clock Face */}
        <div className="absolute inset-0 border-4 border-[#1A1817] rounded-full" />

        {/* Center Dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#1A1817] rounded-full -translate-x-1/2 -translate-y-1/2 z-10" />

        {/* Hour Hand */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-1 h-8 bg-[#1A1817] origin-bottom -translate-x-1/2 -translate-y-full rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Minute Hand */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-1 h-10 bg-[#D4A574] origin-bottom -translate-x-1/2 -translate-y-full rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.p
        className="text-xl font-light text-[#1A1817] tracking-widest uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        Scheduling Interview...
      </motion.p>
      <p className="text-sm text-[#6B6662] mt-2 font-light">Sending emails specific to candidates</p>
    </div>
  );
};

const CreateCompanyInterview = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    candidate_emails: [],
    email_input: '',
    questions: '',
    scheduled_start_time: '',
    duration_minutes: '',
    interview_type: 'text',
  });
  const [loading, setLoading] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    role: 'SE1',
    position: 'Product Designer',
    languages: '',
    other: '',
    questionType: 'mixed',
    numberOfQuestions: 5,
  });
  const [generating, setGenerating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddEmail = () => {
    const email = formData.email_input.trim();

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.candidate_emails.includes(email)) {
      toast.error('This email has already been added');
      return;
    }

    setFormData({
      ...formData,
      candidate_emails: [...formData.candidate_emails, email],
      email_input: ''
    });
    toast.success('Email added successfully');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setFormData({
      ...formData,
      candidate_emails: formData.candidate_emails.filter(email => email !== emailToRemove)
    });
  };

  const handleAiFormChange = (e) => {
    const { name, value } = e.target;
    setAiFormData({ ...aiFormData, [name]: value });
  };

  const handleGenerateQuestions = async () => {
    setGenerating(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-questions', aiFormData);
      if (response.data) {
        const generatedQuestions = response.data.map(q => typeof q === 'object' ? q.question : q).join('\n');
        setFormData({ ...formData, questions: generatedQuestions });
        toast.success('AI questions generated!');
      }
    } catch (error) {
      toast.error('Failed to generate questions. Please try again.');
      console.error('Error generating questions:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.candidate_emails.length === 0) {
      toast.error('Please add at least one candidate email');
      return;
    }

    setLoading(true);
    try {
      const questionsArray = formData.questions.split('\n').filter(q => q.trim() !== '');

      const payload = {
        candidate_emails: formData.candidate_emails,
        questions: questionsArray,
      };

      // Add scheduling if provided (only if both fields have values)
      if (formData.scheduled_start_time && formData.scheduled_start_time.trim()) {
        payload.scheduled_start_time = new Date(formData.scheduled_start_time).toISOString();
      }
      if (formData.duration_minutes && formData.duration_minutes !== '') {
        payload.duration_minutes = parseInt(formData.duration_minutes);
      }

      payload.interview_type = formData.interview_type;

      const response = await axios.post('http://localhost:8000/company/create-interview', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (response.status === 200 || response.status === 201) {
        toast.success('Interview has been sent to the user');
        navigate('/company/dashboard');
      }
    } catch (error) {
      toast.error('Failed to create interview. Please try again.');
      console.error('Error creating interview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      {loading && <ClockLoader />}

      <div className="w-full max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
            Create Interview for Candidates
          </h1>
          <p className="text-[#6B6662] font-light">
            Enter candidate emails and interview questions. Send to multiple candidates at once.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
            <h2 className="text-2xl font-light text-[#1A1817] mb-6">Generate Questions with AI</h2>
            <div className="space-y-6">
              {/* Role Selection */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Role Level
                </label>
                <select
                  name="role"
                  value={aiFormData.role}
                  onChange={handleAiFormChange}
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
                  value={aiFormData.position}
                  onChange={handleAiFormChange}
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
                  value={aiFormData.languages}
                  onChange={handleAiFormChange}
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
                  value={aiFormData.other}
                  onChange={handleAiFormChange}
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
                  value={aiFormData.questionType}
                  onChange={handleAiFormChange}
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
                  <option value="quantitative-logical">Quantitative Aptitude & Logical Reasoning</option>
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
                  value={aiFormData.numberOfQuestions}
                  onChange={handleAiFormChange}
                  min="3"
                  max="15"
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1.5 text-xs text-[#9B9791] font-light">Choose between 3 and 15 questions</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="w-full bg-[#D4A574] text-white py-3 rounded-lg font-light tracking-wide hover:bg-[#C0956B] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {generating ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
            <div className="space-y-6">
              {/* Candidate Emails */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Candidate Emails ({formData.candidate_emails.length})
                </label>

                {/* Display added emails as chips */}
                {formData.candidate_emails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.candidate_emails.map((email, index) => (
                      <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F7F5F2] border border-[#E5E1DC] rounded-full">
                        <span className="text-sm text-[#1A1817] font-light">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="text-[#6B6662] hover:text-[#1A1817] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Email input */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    name="email_input"
                    value={formData.email_input}
                    onChange={handleChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    placeholder="e.g., candidate@example.com (press Enter to add)"
                    className="flex-1 px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-6 py-3 bg-[#D4A574] text-white rounded-lg font-light hover:bg-[#C0956B] transition-all duration-200"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-[#9B9791] font-light">
                  Add multiple candidate emails. Each will receive a unique interview link.
                </p>
              </div>

              {/* Scheduling (Optional) */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Schedule Interview (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-light text-[#6B6662] mb-1.5">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      name="scheduled_start_time"
                      value={formData.scheduled_start_time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-light text-[#6B6662] mb-1.5">Duration (hours)</label>
                    <input
                      type="number"
                      name="duration_minutes"
                      value={formData.duration_minutes ? formData.duration_minutes / 60 : ''}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value);
                        setFormData({
                          ...formData,
                          duration_minutes: hours ? Math.round(hours * 60) : ''
                        });
                      }}
                      min="0.5"
                      step="0.5"
                      placeholder="e.g., 2"
                      className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-[#9B9791] font-light">
                  Leave blank for immediate access. Set start time and duration to control when candidates can take the interview.
                </p>
              </div>

              {/* Interview Type Selection */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Interview Mode
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setFormData({ ...formData, interview_type: 'text' })}
                    className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${formData.interview_type === 'text' ? 'bg-[#1A1817] border-[#1A1817] text-white' : 'bg-[#F7F5F2] border-[#E5E1DC] text-[#1A1817] hover:border-[#D4A574]'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      <span className="font-medium">Text Interview</span>
                    </div>
                    <p className={`text-xs ${formData.interview_type === 'text' ? 'text-gray-300' : 'text-[#6B6662]'}`}>
                      Standard format. Candidates type their answers.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, interview_type: 'voice' })}
                    className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${formData.interview_type === 'voice' ? 'bg-[#1A1817] border-[#1A1817] text-white' : 'bg-[#F7F5F2] border-[#E5E1DC] text-[#1A1817] hover:border-[#D4A574]'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      <span className="font-medium">Voice Interview</span>
                    </div>
                    <p className={`text-xs ${formData.interview_type === 'voice' ? 'text-gray-300' : 'text-[#6B6662]'}`}>
                      Interactive format. AI reads questions, candidates speak answers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Interview Questions
                </label>
                <textarea
                  name="questions"
                  value={formData.questions}
                  onChange={handleChange}
                  rows="10"
                  placeholder="Enter each question on a new line, or generate them with AI above."
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1817] text-white py-4 rounded-lg font-light tracking-wide hover:bg-[#2D2B28] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Create and Send Interview
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCompanyInterview;
