import React, { useState } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, AlertCircle, TrendingUp, Code, Award, Download } from 'lucide-react';
import { Treemap, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const CVParser = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || 
          droppedFile.type === 'application/msword' ||
          droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a PDF or Word document');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please upload a CV first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('cv', file);

    try {
      const response = await axios.post('http://localhost:8000/analyze-cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysis(response.data);
      toast.success('CV analyzed successfully!');
    } catch (error) {
      toast.error('Failed to analyze CV. Please try again.');
      console.error('Error analyzing CV:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!analysis) {
      toast.error('No analysis data available');
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

      const addImage = async (elementId, maxHeight = 80) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#FFFFFF',
          });

          if (yPosition + maxHeight > pageHeight - 20) {
            addNewPage();
          }

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height / canvas.width) * imgWidth;
          const finalHeight = Math.min(imgHeight, maxHeight);
          doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, finalHeight);
          yPosition += finalHeight + 5;
        } catch (error) {
          console.error('Error capturing chart:', error);
        }
      };

      // Header
      doc.setFontSize(24);
      doc.setTextColor(26, 24, 23);
      doc.setFont('helvetica', 'bold');
      doc.text('CV Analysis Report', margin, yPosition);
      yPosition += 15;

      addText(new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }), 12, false, [107, 102, 98]);
      addSeparator();

      // Overall Score
      addSection('Overall Assessment');
      addText(`Overall Score: ${analysis.overall_score}/10`, 14, true);
      addText(analysis.overall_feedback, 11, false, [107, 102, 98]);
      yPosition += 5;

      // Add Radar Chart
      addSection('Performance Metrics');
      await addImage('cv-radar-chart', 100);

      // Relevant Points
      addSection('Relevant Points');
      analysis.relevant_points.forEach((point) => {
        if (yPosition > pageHeight - 30) {
          addNewPage();
        }
        addText(`✓ ${point}`, 10, false, [16, 185, 129]);
      });
      yPosition += 5;

      // Irrelevant Points
      addSection('Points to Remove');
      analysis.irrelevant_points.forEach((point) => {
        if (yPosition > pageHeight - 30) {
          addNewPage();
        }
        addText(`✗ ${point}`, 10, false, [239, 68, 68]);
      });
      yPosition += 5;

      // Languages & Technologies with Chart
      addSection('Languages & Technologies');
      await addImage('cv-lang-chart', 100);

      if (yPosition > pageHeight - 50) {
        addNewPage();
      }

      analysis.languages.forEach((lang) => {
        if (yPosition > pageHeight - 30) {
          addNewPage();
        }
        addText(`${lang.name} - ${lang.proficiency}`, 10, true);
        addText(lang.feedback, 9, false, [107, 102, 98]);
        yPosition += 3;
      });
      yPosition += 5;

      // Industry Standards
      addSection('Industry Standards Compliance');

      if (yPosition > pageHeight - 40) {
        addNewPage();
      }
      
      addText('Meeting Standards:', 11, true, [16, 185, 129]);
      analysis.industry_standards.meeting.forEach((item) => {
        if (yPosition > pageHeight - 30) {
          addNewPage();
        }
        addText(`• ${item}`, 10, false, [107, 102, 98]);
      });
      yPosition += 3;

      addText('Needs Improvement:', 11, true, [245, 158, 11]);
      analysis.industry_standards.not_meeting.forEach((item) => {
        if (yPosition > pageHeight - 30) {
          addNewPage();
        }
        addText(`• ${item}`, 10, false, [107, 102, 98]);
      });
      yPosition += 5;

      // Recommendations
      if (yPosition > pageHeight - 30) {
        addNewPage();
      }
      addSection('Recommendations');
      analysis.recommendations.forEach((rec, index) => {
        if (yPosition > pageHeight - 30) {
          addNewPage();
        }
        addText(`${index + 1}. ${rec}`, 10, false, [107, 102, 98]);
        yPosition += 3;
      });

      doc.save('cv-analysis-report.pdf');
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const renderScore = (score) => {
    const percentage = (score / 10) * 100;
    let color = '#EF4444';
    if (percentage >= 70) color = '#10B981';
    else if (percentage >= 50) color = '#F59E0B';

    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-[#E5E1DC] rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-lg font-light text-[#1A1817] min-w-[3rem]">
          {score}/10
        </span>
      </div>
    );
  };

  const colors = ['#D4A574', '#A8D5BA', '#FFB4A2', '#B4A7D6', '#FFD6BA', '#C4B5FD', '#F9A8D4', '#A0E4CB'];

  const getLanguageChartData = () => {
    if (!analysis) return [];
    
    const proficiencyMap = {
      'Beginner': 2.5,
      'Intermediate': 5,
      'Advanced': 7.5,
      'Expert': 10
    };

    return {
      name: "Languages",
      children: analysis.languages.map((lang, idx) => ({
        name: lang.name,
        value: proficiencyMap[lang.proficiency] || 0,
        fill: colors[idx % colors.length]
      }))
    };
  };

  const getRadarChartData = () => {
    if (!analysis) return [];

    return [
      {
        category: 'Overall',
        score: analysis.overall_score
      },
      {
        category: 'Relevance',
        score: (analysis.relevant_points.length / (analysis.relevant_points.length + analysis.irrelevant_points.length)) * 10
      },
      {
        category: 'Standards',
        score: (analysis.industry_standards.meeting.length / (analysis.industry_standards.meeting.length + analysis.industry_standards.not_meeting.length)) * 10
      },
      {
        category: 'Tech Skills',
        score: analysis.languages.reduce((sum, lang) => {
          const proficiencyMap = { 'Beginner': 2.5, 'Intermediate': 5, 'Advanced': 7.5, 'Expert': 10 };
          return sum + (proficiencyMap[lang.proficiency] || 0);
        }, 0) / analysis.languages.length
      }
    ];
  };

  const CustomTreemapContent = (props) => {
    const { x, y, width, height, name, fill } = props;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" />
        <text 
          x={x + width / 2} 
          y={y + height / 2} 
          textAnchor="middle" 
          dominantBaseline="middle"
          fill="#FFFFFF"
          fontSize={12}
          fontWeight={300}
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-light text-[#1A1817] mb-3 tracking-tight">
              CV Parser & Analyzer
            </h1>
            <p className="text-[#6B6662] font-light">
              Upload your CV to receive detailed feedback on relevance, skills, and industry standards
            </p>
          </div>
          {analysis && (
            <button
              onClick={generatePDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg font-light hover:bg-[#C0956B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
            </button>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC] mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-[#D4A574] bg-[#F7F5F2]' 
                : 'border-[#E5E1DC] hover:border-[#D4A574]'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!file ? (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-[#6B6662]" strokeWidth={1.5} />
                <p className="text-[#1A1817] font-light mb-2">
                  Drag and drop your CV here, or
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-[#D4A574] font-light cursor-pointer hover:underline">
                    browse files
                  </span>
                </label>
                <p className="text-sm text-[#9B9791] font-light mt-2">
                  Supports PDF, DOC, DOCX (Max 10MB)
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <FileText className="w-8 h-8 text-[#D4A574]" strokeWidth={1.5} />
                <div className="text-left">
                  <p className="text-[#1A1817] font-light">{file.name}</p>
                  <p className="text-sm text-[#6B6662] font-light">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="ml-4 text-[#6B6662] hover:text-[#1A1817] transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="w-full mt-6 bg-[#1A1817] text-white py-4 rounded-lg font-light tracking-wide hover:bg-[#2D2B28] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing CV...
              </span>
            ) : (
              'Analyze CV'
            )}
          </button>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-[#D4A574]" strokeWidth={1.5} />
                <h2 className="text-2xl font-light text-[#1A1817]">Overall Score</h2>
              </div>
              {renderScore(analysis.overall_score)}
              <p className="mt-4 text-[#6B6662] font-light leading-relaxed">
                {analysis.overall_feedback}
              </p>
            </div>

            {/* Performance Radar Chart */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <h3 className="text-xl font-light text-[#1A1817] mb-6">Performance Overview</h3>
              <div id="cv-radar-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={getRadarChartData()}>
                    <PolarGrid stroke="#E5E1DC" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: '#6B6662', fontWeight: 300, fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 10]} 
                      tick={{ fill: '#6B6662', fontWeight: 300 }}
                    />
                    <Radar 
                      name="Score" 
                      dataKey="score" 
                      stroke="#D4A574" 
                      fill="#D4A574" 
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E1DC',
                        borderRadius: '8px',
                        fontWeight: 300
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Relevant Points */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-[#10B981]" strokeWidth={1.5} />
                <h2 className="text-2xl font-light text-[#1A1817]">Relevant Points</h2>
              </div>
              <ul className="space-y-3">
                {analysis.relevant_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-2 flex-shrink-0" />
                    <span className="text-[#6B6662] font-light">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Irrelevant Points */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-[#EF4444]" strokeWidth={1.5} />
                <h2 className="text-2xl font-light text-[#1A1817]">Points to Remove</h2>
              </div>
              <ul className="space-y-3">
                {analysis.irrelevant_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-2 flex-shrink-0" />
                    <span className="text-[#6B6662] font-light">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Languages & Tools with Chart */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <div className="flex items-center gap-3 mb-6">
                <Code className="w-6 h-6 text-[#D4A574]" strokeWidth={1.5} />
                <h2 className="text-2xl font-light text-[#1A1817]">Languages & Technologies</h2>
              </div>
              
              {/* Treemap Chart */}
              <div className="mb-8" id="cv-lang-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <Treemap
                    data={[getLanguageChartData()]}
                    dataKey="value"
                    stroke="#fff"
                    fill="#D4A574"
                    content={<CustomTreemapContent />}
                  >
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E1DC',
                        borderRadius: '8px',
                        fontWeight: 300
                      }}
                      formatter={(value) => [`${value.toFixed(1)}/10`, 'Proficiency']}
                      cursor={{ fill: 'rgba(212, 165, 116, 0.1)' }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>

              {/* Detailed List */}
              <div className="space-y-4">
                {analysis.languages.map((lang, index) => (
                  <div key={index} className="border-b border-[#E5E1DC] pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#1A1817] font-light">{lang.name}</span>
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        lang.proficiency === 'Expert' ? 'bg-[#10B981]/10 text-[#10B981]' :
                        lang.proficiency === 'Advanced' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' :
                        lang.proficiency === 'Intermediate' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                        'bg-[#6B6662]/10 text-[#6B6662]'
                      }`}>
                        {lang.proficiency}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B6662] font-light">{lang.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Standards */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-[#D4A574]" strokeWidth={1.5} />
                <h2 className="text-2xl font-light text-[#1A1817]">Industry Standards</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-light text-[#1A1817] mb-3">
                    ✓ Meeting Standards
                  </h3>
                  <ul className="space-y-2">
                    {analysis.industry_standards.meeting.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-2 flex-shrink-0" />
                        <span className="text-[#6B6662] font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-light text-[#1A1817] mb-3">
                    ⚠ Needs Improvement
                  </h3>
                  <ul className="space-y-2">
                    {analysis.industry_standards.not_meeting.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-2 flex-shrink-0" />
                        <span className="text-[#6B6662] font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E5E1DC]">
              <h2 className="text-2xl font-light text-[#1A1817] mb-6">Recommendations</h2>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-[#F7F5F2] rounded-lg">
                    <span className="text-[#D4A574] font-light">{index + 1}.</span>
                    <span className="text-[#6B6662] font-light">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVParser;