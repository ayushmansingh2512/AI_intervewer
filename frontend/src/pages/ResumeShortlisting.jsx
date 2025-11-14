import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResumeShortlisting = () => {
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [shortlistedResumes, setShortlistedResumes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 10) {
      toast.error('You can upload a maximum of 10 resumes.');
      return;
    }
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please upload at least one resume.');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please provide a job description.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('resumes', file);
    });
    formData.append('job_description', jobDescription);

    try {
      const response = await axios.post('http://localhost:8000/company/shortlist-resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setShortlistedResumes(response.data);
      toast.success('Resumes shortlisted successfully!');
    } catch (error) {
      toast.error('Failed to shortlist resumes. Please try again.');
      console.error('Error shortlisting resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
            Resume Shortlisting
          </h1>
          <p className="text-[#6B6662] font-light">
            Upload up to 10 resumes and a job description to shortlist candidates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
            <div className="space-y-6">
              {/* Job Description */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Job Description
                </label>
                <textarea
                  name="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows="6"
                  placeholder="Paste the job description here..."
                  className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {/* Resume Upload */}
              <div className="group">
                <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                  Upload Resumes
                </label>
                <input
                  type="file"
                  name="resumes"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
                <p className="mt-1.5 text-xs text-[#9B9791] font-light">
                  Select up to 10 PDF or Word documents.
                </p>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1A1817] text-white py-4 rounded-lg font-light tracking-wide hover:bg-[#2D2B28] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Shortlisting...' : 'Shortlist Resumes'}
          </button>
        </form>

        {shortlistedResumes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
            <h2 className="text-2xl font-light text-[#1A1817] mb-4">Shortlisted Candidates</h2>
            <ul className="space-y-4">
              {shortlistedResumes.map((resume, index) => (
                <li key={index} className="p-4 bg-[#F7F5F2] rounded-lg">
                  <p className="font-semibold text-[#1A1817]">{resume.name}</p>
                  <p className="text-sm text-[#6B6662]">Score: {resume.score.toFixed(2)}</p>
                  <p className="text-sm text-[#6B6662]">Email: {resume.email}</p>
                  <p className="text-sm text-[#6B6662] mt-2">Justification: {resume.justification}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeShortlisting;
