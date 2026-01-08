import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';

const GetStarted = () => {
  const [resume, setResume] = useState(null);
  const [leetcodeLink, setLeetcodeLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [languages, setLanguages] = useState('');
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [normalSkills, setNormalSkills] = useState('');
  const [otherSkills, setOtherSkills] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { authToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const formData = new FormData();
    if (resume) formData.append('resume', resume);
    formData.append('leetcode_link', leetcodeLink);
    formData.append('linkedin_link', linkedinLink);
    formData.append('github_link', githubLink);
    formData.append('languages', languages);
    formData.append('technical_skills', technicalSkills);
    formData.append('normal_skills', normalSkills);
    formData.append('other_skills', otherSkills);

    console.log('Auth Token:', authToken);

    try {
      const response = await axios.put(`${API_URL}/users/me/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      setMessage('Profile updated successfully!');
      navigate('/dashboard'); // Redirect to dashboard after successful update
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    }
  };

  return (
    <div className="get-started-container">
      <h2>Tell us more about yourself!</h2>
      <form onSubmit={handleSubmit} className="get-started-form">
        <div className="form-group">
          <label htmlFor="resume">Upload Resume (PDF/DOCX):</label>
          <input
            type="file"
            id="resume"
            accept=".pdf,.docx"
            onChange={(e) => setResume(e.target.files[0])}
          />
        </div>

        <div className="form-group">
          <label htmlFor="leetcodeLink">LeetCode Profile Link:</label>
          <input
            type="text"
            id="leetcodeLink"
            value={leetcodeLink}
            onChange={(e) => setLeetcodeLink(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="linkedinLink">LinkedIn Profile Link:</label>
          <input
            type="text"
            id="linkedinLink"
            value={linkedinLink}
            onChange={(e) => setLinkedinLink(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="githubLink">GitHub Profile Link:</label>
          <input
            type="text"
            id="githubLink"
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="languages">Languages (comma-separated):</label>
          <input
            type="text"
            id="languages"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="technicalSkills">Technical Skills (comma-separated):</label>
          <input
            type="text"
            id="technicalSkills"
            value={technicalSkills}
            onChange={(e) => setTechnicalSkills(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="normalSkills">Normal Skills (comma-separated):</label>
          <input
            type="text"
            id="normalSkills"
            value={normalSkills}
            onChange={(e) => setNormalSkills(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="otherSkills">Other Skills (comma-separated):</label>
          <input
            type="text"
            id="otherSkills"
            value={otherSkills}
            onChange={(e) => setOtherSkills(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-button">Save Profile</button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}
    </div>
  );
};

export default GetStarted;