import React, { useState, useRef } from 'react';
import Lottie from 'lottie-react';
import ghostAnimation from '../assets/images/ghost.json';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Send } from 'lucide-react';
import { API_URL } from '../config';

const Dashboard = () => {
  const firstName = localStorage.getItem('first_name') || 'Guest';
  const [query, setQuery] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const roadmapRef = useRef();

  const [isGhostHovered, setIsGhostHovered] = useState(false);

  const handleGenerateRoadmap = async () => {
    if (!query.trim()) {
      setError('Please enter your goal');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/roadmap/generate-roadmap`, { query }, { timeout: 120000 });
      setRoadmap(response.data);
    } catch (error) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to generate roadmap';
      setError(errMsg);
      console.error('Error generating roadmap:', error);
    }
    setLoading(false);
  };

  const handleSaveAsPdf = async () => {
    try {
      const element = roadmapRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('roadmap.pdf');
    } catch (error) {
      console.error('Error saving PDF:', error);
      setError('Failed to save PDF');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FAF9F5] py-8 px-4">
      <div className="text-center flex flex-col items-center gap-6 w-full">

        <div
          className="mt-8 w-64 h-64 relative"
          onMouseEnter={() => setIsGhostHovered(true)}
          onMouseLeave={() => setIsGhostHovered(false)}
        >
          <Lottie animationData={ghostAnimation} loop={true} />

          {/* MODIFIED: Positioned tooltip to the right */}
          {isGhostHovered && (
            <div className="absolute top-1/2 -translate-y-1/2 left-full ml-4 w-72 bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-xl z-50">
              <p className="leading-relaxed text-center">
                Hey, I am parakh.ai. I will help you to create a roadmap. Please write what you know and what you want to be.
              </p>
              {/* MODIFIED: Arrow pointer (pointing left) */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-0 h-0 border-r-8 border-t-8 border-b-8 border-r-gray-900 border-t-transparent border-b-transparent"></div>
            </div>
          )}
        </div>

        <h1 className="text-5xl font-light text-[#3D3D3A] tracking-tight">
          Good afternoon, <span className="text-[#D97757] font-[DM-Serif-Display]">{firstName}</span>.
        </h1>

        <p className="text-lg text-[#6B6B68] font-medium">
          Ready to prepare for your interview?
        </p>

        <div className="w-full max-w-2xl">
          <div className="relative">
            <textarea
              className="w-full p-4 pr-12 border rounded-lg focus:outline-none resize-none"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#3D3D3A',
                borderColor: '#e1e5e9',
                borderWidth: '1px'
              }}
              rows="4"
              placeholder="Tell me what you know and what you want to become..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleGenerateRoadmap}
              disabled={loading || !query.trim()}
              className="absolute bottom-4 right-4 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90"
              style={{ backgroundColor: '#D97757' }}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {roadmap && (
          <div ref={roadmapRef} className="mt-8 p-8 border border-gray-300 rounded-lg bg-white w-full max-w-2xl">
            <h2 className="text-3xl font-bold mb-6 text-[#3D3D3A]">{roadmap.title}</h2>

            {roadmap.steps.map((step, index) => (
              <div key={index} className="mb-8 pb-6 border-b border-gray-200 last:border-b-0">
                <h3 className="text-2xl font-semibold text-[#D97757] mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-700 mb-4">{step.description}</p>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Topics to Study:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {step.topics_to_study?.map((topic, i) => (
                      <li key={i} className="text-gray-700">{topic}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Practice Questions:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {step.practice_questions?.map((question, i) => (
                      <li key={i} className="text-gray-700">{question}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Resources:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {step.resources?.map((resource, i) => (
                      <li key={i}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {resource.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <button
              className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
              onClick={handleSaveAsPdf}
            >
              Save as PDF
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;