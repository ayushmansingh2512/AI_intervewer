import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { Award, Lightbulb, MessageSquare, Download } from 'lucide-react';
import { API_URL } from '../config';

const VoiceInterviewResults = () => {
  const location = useLocation();
  const { state } = useLocation();
  const questions = state?.questions || [];
  const evaluations = state?.evaluations || [];
  const [overallEvaluation, setOverallEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const evaluateOverall = async () => {
      try {
        const response = await axios.post(`${API_URL}/evaluate-voice-interview`, {
          questions: questions,
          evaluations: evaluations,
        });
        setOverallEvaluation(response.data);
      } catch (error) {
        toast.error('Failed to get overall voice interview evaluation. Please try again.');
        console.error('Error evaluating voice interview:', error);
      } finally {
        setLoading(false);
      }
    };

    if (questions.length > 0 && evaluations.length > 0) {
      evaluateOverall();
    } else {
      setLoading(false);
    }
  }, [questions, evaluations]);

  const generatePDF = async () => {
    if (!overallEvaluation) {
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

      const addText = (text, fontSize = 12, isBold = false, color = [26, 24, 23]) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 2;
      };

      const addSection = (title) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        addText(title, 16, true, [212, 165, 116]);
        yPosition += 2;
      };

      const addSeparator = () => {
        doc.setDrawColor(229, 225, 220);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      };

      const addNewPage = () => {
        doc.addPage();
        yPosition = 20;
      };

      const addImage = async (elementId, height = 80) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#FFFFFF',
          });

          if (yPosition + height > pageHeight - 20) {
            addNewPage();
          }

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height / canvas.width) * imgWidth;
          doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, height));
          yPosition += Math.min(imgHeight, height) + 5;
        } catch (error) {
          console.error('Error capturing chart:', error);
        }
      };

      // Header
      doc.setFontSize(24);
      doc.setTextColor(26, 24, 23);
      doc.setFont('helvetica', 'bold');
      doc.text('Voice Interview Results', margin, yPosition);
      yPosition += 15;

      addText(new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), 12, false, [107, 102, 98]);
      addSeparator();

      // Overall Score
      addSection('Overall Performance');
      addText(`Overall Score: ${overallEvaluation.overall_score}/10`, 14, true);
      addText(overallEvaluation.overall_feedback, 11, false, [107, 102, 98]);
      yPosition += 5;

      // Question Scores Summary
      addSection('Question-wise Scores');
      let scoreText = '';
      overallEvaluation.question_scores.forEach((q) => {
        scoreText += `${q.name}: ${q.score}/10 | `;
      });
      addText(scoreText.trim(), 10, false, [107, 102, 98]);
      yPosition += 5;

      // Add Chart Image
      addSection('Performance Chart');
      await addImage('voice-chart', 100);

      // Detailed Feedback
      addSection('Detailed Question Feedback');
      evaluations.forEach((item, index) => {
        if (yPosition > pageHeight - 50) {
          addNewPage();
        }

        addText(`Question ${index + 1}: ${questions[index]}`, 11, true);
        addText(`Score: ${item.score}/10`, 10, false, [212, 165, 116]);
        addText(`Transcribed Answer: ${item.transcribed_text}`, 9, false, [107, 102, 98]);
        addText(`Feedback: ${item.feedback}`, 9, false, [107, 102, 98]);
        yPosition += 5;

        const line1 = doc.splitTextToSize(`Q: ${questions[index]}`, contentWidth);
        const line2 = doc.splitTextToSize(`A: ${item.transcribed_text}`, contentWidth);
        yPosition += Math.max(line1.length, line2.length) * 2;
      });

      // Recommendations
      if (yPosition > pageHeight - 30) {
        addNewPage();
      }
      addSection('Recommendations for Improvement');
      overallEvaluation.recommendations.forEach((rec, index) => {
        if (yPosition > pageHeight - 30) {
          addNewPage();
        }
        addText(`${index + 1}. ${rec}`, 10, false, [107, 102, 98]);
        yPosition += 3;
      });

      doc.save('voice-interview-results.pdf');
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
          <p className="text-[#6B6662] font-light">Getting your voice interview results...</p>
        </div>
      </div>
    );
  }

  if (!overallEvaluation) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#6B6662] font-light">Could not retrieve voice interview evaluation. Please try again.</p>
        </div>
      </div>
    );
  }

  const { overall_score, overall_feedback, question_scores, recommendations } = overallEvaluation;

  return (
    <div className="min-h-screen bg-[#F7F5F2] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
              Voice Interview Results
            </h1>
            <p className="text-[#6B6662] font-light">
              Your voice interview performance summary and detailed feedback
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

        {/* Overall Score Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC] mb-8">
          <div className="text-center">
            <p className="text-sm font-light text-[#6B6662] mb-2 tracking-wide uppercase">Overall Score</p>
            <p className="text-6xl font-light text-[#1A1817] mb-2">{overall_score}</p>
            <p className="text-[#6B6662] font-light">out of 10</p>
          </div>
        </div>

        {/* Overall Feedback */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC] mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-[#D4A574]" strokeWidth={1.5} />
            <h2 className="text-2xl font-light text-[#1A1817]">Overall Feedback</h2>
          </div>
          <p className="text-[#6B6662] font-light leading-relaxed">
            {overall_feedback}
          </p>
        </div>

        {/* Question Scores Chart */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC] mb-8">
          <h3 className="text-xl font-light text-[#1A1817] mb-6">Question-wise Performance</h3>
          <div id="voice-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={question_scores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DC" />
                <XAxis dataKey="name" tick={{ fill: '#6B6662', fontWeight: 300 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#6B6662', fontWeight: 300 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E1DC',
                    borderRadius: '8px',
                    fontWeight: 300
                  }}
                  formatter={(value, name, props) => [`${value}/10`, props.payload.name]}
                />
                <Bar dataKey="score" fill="#1A1817" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Feedback for each question */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-[#D4A574]" strokeWidth={1.5} />
            <h2 className="text-2xl font-light text-[#1A1817]">Detailed Question Feedback</h2>
          </div>
          {evaluations.map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-light text-[#1A1817]">Question {index + 1}: {questions[index]}</h3>
                <span className="bg-[#F7F5F2] px-4 py-2 rounded-lg text-[#1A1817] font-light">
                  {item.score}/10
                </span>
              </div>
              <p className="text-[#6B6662] font-light leading-relaxed mb-2">
                <strong>Transcribed Answer:</strong> {item.transcribed_text}
              </p>
              <p className="text-[#6B6662] font-light leading-relaxed">
                <strong>Feedback:</strong> {item.feedback}
              </p>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-[#D4A574]" strokeWidth={1.5} />
            <h2 className="text-2xl font-light text-[#1A1817]">Recommendations for Improvement</h2>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-[#F7F5F2] rounded-lg">
                <span className="text-[#D4A574] font-light">{index + 1}.</span>
                <span className="text-[#6B6662] font-light">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterviewResults;