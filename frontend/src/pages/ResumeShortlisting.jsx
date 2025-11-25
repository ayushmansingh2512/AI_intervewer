import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResumeShortlisting = () => {
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [shortlistedResumes, setShortlistedResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedResume, setExpandedResume] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      toast.error('You can upload a maximum of 10 resumes.');
      return;
    }
    setFiles([...files, ...selectedFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length + files.length > 10) {
      toast.error('You can upload a maximum of 10 resumes.');
      return;
    }
    const validFiles = droppedFiles.filter(file =>
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    );
    setFiles([...files, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRecommendationColor = (rec) => {
    if (rec === 'Strong Match') return 'bg-green-100 text-green-800';
    if (rec === 'Potential Match') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
            Resume Shortlisting AI
          </h1>
          <p className="text-[#6B6662] font-light">
            Upload resumes to get detailed analysis, scoring, and recommendations based on your job description.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5E1DC]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Job Description */}
                <div className="group">
                  <label className="block text-sm font-light text-[#1A1817] mb-2 tracking-wide">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows="8"
                    placeholder="Paste JD here..."
                    className="w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E1DC] rounded-lg text-[#1A1817] placeholder-[#9B9791] font-light text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>

                {/* Drag & Drop Upload */}
                <div
                  className="group border-2 border-dashed border-[#E5E1DC] rounded-lg p-6 text-center hover:border-[#D4A574] transition-colors cursor-pointer bg-[#F7F5F2]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <svg className="w-8 h-8 mx-auto text-[#9B9791] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-[#6B6662] font-light">
                    Drag & drop resumes or <span className="text-[#D4A574] font-medium">browse</span>
                  </p>
                  <p className="text-xs text-[#9B9791] mt-1">PDF, DOC, DOCX (Max 10)</p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-[#F7F5F2] rounded text-xs">
                        <span className="truncate max-w-[180px] text-[#1A1817]">{file.name}</span>
                        <button type="button" onClick={() => removeFile(index)} className="text-red-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1A1817] text-white py-3 rounded-lg font-light tracking-wide hover:bg-[#2D2B28] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? 'Analyzing...' : 'Shortlist Candidates'}
                </button>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {shortlistedResumes.length > 0 ? (
              shortlistedResumes.map((resume, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-[#E5E1DC] overflow-hidden transition-all duration-200 hover:shadow-md">
                  {/* Header */}
                  <div
                    className="p-6 cursor-pointer flex items-start justify-between"
                    onClick={() => setExpandedResume(expandedResume === index ? null : index)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-medium text-[#1A1817]">{resume.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRecommendationColor(resume.recommendation)}`}>
                          {resume.recommendation}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B6662] mb-2">{resume.email} • {resume.years_of_experience || 'Exp N/A'}</p>
                      <p className="text-sm text-[#1A1817] line-clamp-2">{resume.summary}</p>
                    </div>
                    <div className={`flex flex-col items-end ml-4 px-4 py-2 rounded-lg border ${getScoreColor(resume.score)}`}>
                      <span className="text-2xl font-bold">{resume.score}</span>
                      <span className="text-xs uppercase tracking-wide">Match</span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedResume === index && (
                    <div className="px-6 pb-6 border-t border-[#F7F5F2] bg-[#FAFAFA]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {/* Category Scores */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-[#1A1817] uppercase tracking-wide">Category Breakdown</h4>
                          {resume.category_scores && Object.entries(resume.category_scores).map(([key, value]) => (
                            <div key={key}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="capitalize text-[#6B6662]">{key}</span>
                                <span className="font-medium">{value}%</span>
                              </div>
                              <div className="w-full bg-[#E5E1DC] rounded-full h-1.5">
                                <div
                                  className="bg-[#D4A574] h-1.5 rounded-full"
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Skills */}
                        <div>
                          <h4 className="text-sm font-medium text-[#1A1817] uppercase tracking-wide mb-3">Skills Analysis</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-[#6B6662] mb-1.5">Matching Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {resume.skills_found?.map((skill, i) => (
                                  <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {resume.missing_skills?.length > 0 && (
                              <div>
                                <p className="text-xs text-[#6B6662] mb-1.5">Missing Critical Skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {resume.missing_skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Justification */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-[#1A1817] uppercase tracking-wide mb-2">AI Analysis</h4>
                        <p className="text-sm text-[#6B6662] leading-relaxed bg-white p-4 rounded border border-[#E5E1DC]">
                          {resume.justification}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-lg border border-dashed border-[#E5E1DC] text-[#9B9791]">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-light">Upload resumes to see detailed analysis here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeShortlisting;
