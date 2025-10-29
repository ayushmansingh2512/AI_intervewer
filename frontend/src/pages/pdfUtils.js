// pdfUtils.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateVoiceInterviewPDF = async (overallEvaluation, evaluations, questions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Helper functions
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
    addText(title, 16, true, [212, 165, 116]); // #D4A574
    yPosition += 2;
  };

  const addSeparator = () => {
    doc.setDrawColor(229, 225, 220); // #E5E1DC
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  const addNewPage = () => {
    doc.addPage();
    yPosition = 20;
  };

  // Header
  doc.setFontSize(24);
  doc.setTextColor(26, 24, 23);
  doc.setFont('helvetica', 'bold');
  doc.text('Voice Interview Results', margin, yPosition);
  yPosition += 15;

  addText(new Date().toLocaleDateString(), 12, false, [107, 102, 98]); // #6B6662
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

  // Detailed Feedback
  addSection('Detailed Question Feedback');
  evaluations.forEach((item, index) => {
    if (yPosition > pageHeight - 40) {
      addNewPage();
    }
    
    addText(`Question ${index + 1}: ${questions[index]}`, 11, true);
    addText(`Score: ${item.score}/10`, 10, false, [212, 165, 116]);
    addText(`Transcribed Answer: ${item.transcribed_text}`, 9, false, [107, 102, 98]);
    addText(`Feedback: ${item.feedback}`, 9, false, [107, 102, 98]);
    yPosition += 5;
    addSeparator();
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
};

export const generateTextInterviewPDF = async (evaluation, questions, answers) => {
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

  // Header
  doc.setFontSize(24);
  doc.setTextColor(26, 24, 23);
  doc.setFont('helvetica', 'bold');
  doc.text('Technical Interview Results', margin, yPosition);
  yPosition += 15;

  addText(new Date().toLocaleDateString(), 12, false, [107, 102, 98]);
  addSeparator();

  // Average Score
  const averageScore = (evaluation.reduce((sum, item) => sum + item.score, 0) / evaluation.length).toFixed(1);
  addSection('Overall Performance');
  addText(`Average Score: ${averageScore}/10`, 14, true);
  yPosition += 5;

  // Detailed Feedback
  addSection('Question & Answer Review');
  evaluation.forEach((item, index) => {
    if (yPosition > pageHeight - 50) {
      addNewPage();
    }

    addText(`Question ${index + 1}`, 12, true, [212, 165, 116]);
    addText(questions[index], 10, false, [26, 24, 23]);
    yPosition += 3;

    addText('Answer:', 10, true);
    addText(answers[index], 9, false, [107, 102, 98]);
    yPosition += 3;

    addText(`Score: ${item.score}/10`, 10, false, [212, 165, 116]);
    addText(`Feedback: ${item.feedback}`, 9, false, [107, 102, 98]);
    yPosition += 5;

    addSeparator();
  });

  doc.save('technical-interview-results.pdf');
};

export const generateCVAnalysisPDF = async (analysis, canvasRef) => {
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

  const addImage = (canvas, height = 80) => {
    if (yPosition + height > pageHeight - 20) {
      addNewPage();
    }
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, height));
    yPosition += Math.min(imgHeight, height) + 5;
  };

  // Header
  doc.setFontSize(24);
  doc.setTextColor(26, 24, 23);
  doc.setFont('helvetica', 'bold');
  doc.text('CV Analysis Report', margin, yPosition);
  yPosition += 15;

  addText(new Date().toLocaleDateString(), 12, false, [107, 102, 98]);
  addSeparator();

  // Overall Score
  addSection('Overall Assessment');
  addText(`Overall Score: ${analysis.overall_score}/10`, 14, true);
  addText(analysis.overall_feedback, 11, false, [107, 102, 98]);
  yPosition += 5;

  // Relevant Points
  addSection('Relevant Points');
  analysis.relevant_points.forEach((point) => {
    if (yPosition > pageHeight - 30) {
      addNewPage();
    }
    addText(`✓ ${point}`, 10, false, [16, 185, 129]); // green
  });
  yPosition += 5;

  // Irrelevant Points
  addSection('Points to Remove');
  analysis.irrelevant_points.forEach((point) => {
    if (yPosition > pageHeight - 30) {
      addNewPage();
    }
    addText(`✗ ${point}`, 10, false, [239, 68, 68]); // red
  });
  yPosition += 5;

  // Languages & Technologies
  addSection('Languages & Technologies');
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
  
  addText('Meeting Standards:', 11, true, [16, 185, 129]);
  analysis.industry_standards.meeting.forEach((item) => {
    if (yPosition > pageHeight - 30) {
      addNewPage();
    }
    addText(`• ${item}`, 10, false, [107, 102, 98]);
  });
  yPosition += 3;

  addText('Needs Improvement:', 11, true, [245, 158, 11]); // orange
  analysis.industry_standards.not_meeting.forEach((item) => {
    if (yPosition > pageHeight - 30) {
      addNewPage();
    }
    addText(`• ${item}`, 10, false, [107, 102, 98]);
  });
  yPosition += 5;

  // Recommendations
  addSection('Recommendations');
  analysis.recommendations.forEach((rec, index) => {
    if (yPosition > pageHeight - 30) {
      addNewPage();
    }
    addText(`${index + 1}. ${rec}`, 10, false, [107, 102, 98]);
    yPosition += 3;
  });

  doc.save('cv-analysis-report.pdf');
};

// Helper function to capture chart as canvas
export const captureChartAsCanvas = async (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    });
    return canvas;
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
};