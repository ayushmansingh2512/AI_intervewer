
import React from 'react';

const CVPreview = ({ formData }) => {
  const { fullName, email, phone, address, summary, education, experience, skills, template, photo } = formData;

  const renderClassicTemplate = () => (
    <div className="p-8 bg-white text-gray-800">
      <h1 className="text-4xl font-bold mb-2">{fullName}</h1>
      <p className="text-sm mb-4">{email} | {phone} | {address}</p>
      
      <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-1 mb-2">Summary</h2>
      <p className="text-sm mb-4">{summary}</p>

      <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-1 mb-2">Education</h2>
      {education.map((edu, index) => (
        <div key={index} className="mb-2">
          <p className="font-bold">{edu.institution}</p>
          <p className="text-sm">{edu.degree} ({edu.year})</p>
        </div>
      ))}

      <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-1 mb-2 mt-4">Experience</h2>
      {experience.map((exp, index) => (
        <div key={index} className="mb-2">
          <p className="font-bold">{exp.company}</p>
          <p className="text-sm">{exp.role} ({exp.years})</p>
        </div>
      ))}

      <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-1 mb-2 mt-4">Skills</h2>
      <p className="text-sm">{skills}</p>
    </div>
  );

  const renderModernTemplate = () => (
    <div className="flex bg-white">
      <div className="w-1/3 bg-gray-800 text-white p-8">
        {photo && <img src={URL.createObjectURL(photo)} alt="CV Photo" className="w-32 h-32 rounded-full mx-auto mb-4" />}
        <h1 className="text-3xl font-bold text-center mb-2">{fullName}</h1>
        <p className="text-sm text-center mb-4">{email}</p>
        <p className="text-sm text-center mb-4">{phone}</p>
        <p className="text-sm text-center mb-4">{address}</p>
      </div>
      <div className="w-2/3 p-8">
        <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-1 mb-2">Summary</h2>
        <p className="text-sm mb-4">{summary}</p>

        <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-1 mb-2">Education</h2>
        {education.map((edu, index) => (
          <div key={index} className="mb-2">
            <p className="font-bold">{edu.institution}</p>
            <p className="text-sm">{edu.degree} ({edu.year})</p>
          </div>
        ))}

        <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-1 mb-2 mt-4">Experience</h2>
        {experience.map((exp, index) => (
          <div key={index} className="mb-2">
            <p className="font-bold">{exp.company}</p>
            <p className="text-sm">{exp.role} ({exp.years})</p>
          </div>
        ))}

        <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-1 mb-2 mt-4">Skills</h2>
        <p className="text-sm">{skills}</p>
      </div>
    </div>
  );

  const renderCreativeTemplate = () => (
    <div className="p-8 bg-white text-gray-800 relative">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600 tracking-wider">{fullName}</h1>
        <p className="text-lg text-gray-500 mt-2">{email} &bull; {phone} &bull; {address}</p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-1">
          <h2 className="text-xl font-bold text-blue-600 mb-4">SKILLS</h2>
          <p className="text-sm">{skills}</p>
        </div>
        <div className="col-span-2">
          <h2 className="text-2xl font-bold border-b-4 border-blue-600 pb-2 mb-4">Summary</h2>
          <p className="text-sm mb-6">{summary}</p>

          <h2 className="text-2xl font-bold border-b-4 border-blue-600 pb-2 mb-4">Experience</h2>
          {experience.map((exp, index) => (
            <div key={index} className="mb-4">
              <p className="font-bold text-lg">{exp.role} | {exp.company}</p>
              <p className="text-sm text-gray-500">{exp.years}</p>
            </div>
          ))}

          <h2 className="text-2xl font-bold border-b-4 border-blue-600 pb-2 mb-4 mt-6">Education</h2>
          {education.map((edu, index) => (
            <div key={index} className="mb-4">
              <p className="font-bold text-lg">{edu.institution}</p>
              <p className="text-sm text-gray-500">{edu.degree}, {edu.year}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return renderModernTemplate();
      case 'creative':
        return renderCreativeTemplate();
      default:
        return renderClassicTemplate();
    }
  };

  return (
    <div className="shadow-lg">
      {renderTemplate()}
    </div>
  );
};

export default CVPreview;
