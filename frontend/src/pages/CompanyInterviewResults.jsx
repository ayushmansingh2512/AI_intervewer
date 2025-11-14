import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';

const CompanyInterviewResults = () => {
  const { interviewId } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/company/interview-results/${interviewId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        });
        setEvaluation(response.data);
      } catch (error) {
        toast.error('Failed to fetch interview results. Please try again.');
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchInterviews = async () => {
      try {
        const response = await axios.get('http://localhost:8000/company/interviews', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        });
        setInterviews(response.data);
      } catch (error) {
        toast.error('Failed to fetch interviews. Please try again.');
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchResults();
    } else {
      fetchInterviews();
    }
  }, [interviewId]);

  const generatePDF = async () => {
    if (!evaluation) {
      toast.error('No evaluation data available');
      return;
    }

    setDownloadingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // ... (PDF generation logic from Results.jsx, adapted for the new data structure)

      doc.save('interview-results.pdf');
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-[#D4A574] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[#6B6662] font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (!interviewId) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
            Interview Results
          </h1>
          <p className="text-[#6B6662] font-light mb-8">
            Select an interview to view the results.
          </p>
          <div className="space-y-4">
            {interviews.map(interview => (
              <Link to={`/company/interview-results/${interview.interview_id}`} key={interview.id} className="block bg-white rounded-lg p-6 shadow-sm border border-[#E5E1DC] hover:border-[#D4A574] transition-all">
                <p className="font-semibold text-[#1A1817]">{interview.candidate_email}</p>
                <p className="text-sm text-[#6B6662]">Interview ID: {interview.interview_id}</p>
              </Link>
            ))}
          </div>
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

  const { questions, answers, evaluation: detailedEvaluation } = evaluation;
  const averageScore = (detailedEvaluation.reduce((sum, item) => sum + item.score, 0) / detailedEvaluation.length).toFixed(1);
  const chartData = detailedEvaluation.map((item, index) => ({
    name: `Q${index + 1}`,
    score: item.score,
  }));

  return (
    <div className="min-h-screen bg-[#F7F5F2] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
              Candidate Interview Results
            </h1>
            <p className="text-[#6B6662] font-light">
              Performance summary and detailed feedback for the candidate.
            </p>
          </div>
          <button
            onClick={generatePDF}
            disabled={downloadingPDF}
            className="flex items-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg font-light hover:bg-[#C0956B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
          </button>
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
          <div id="text-chart">
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
        </div>

        {/* Detailed Feedback */}
        <div className="space-y-6">
          {detailedEvaluation.map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-light text-[#1A1817]">Question {index + 1}</h3>
                <span className="bg-[#F7F5F2] px-4 py-2 rounded-lg text-[#1A1817] font-light">
                  {item.score}/10
                </span>
              </div>
              <p className="text-[#6B6662] font-light leading-relaxed mb-3">
                <strong>Question:</strong> {questions[index]}
              </p>
              <p className="text-[#6B6662] font-light leading-relaxed mb-3">
                <strong>Candidate's Answer:</strong> {answers[index]}
              </p>
              <p className="text-[#6B6662] font-light leading-relaxed">
                <strong>Feedback:</strong> {item.feedback}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyInterviewResults;
