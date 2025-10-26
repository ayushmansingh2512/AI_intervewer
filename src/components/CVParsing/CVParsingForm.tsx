// Part 1: Imports, Interfaces, and Constants

import React, { useState, useCallback, useRef } from "react";
// Or if you are using TypeScript with an older React import:
// import React, { useState, useCallback } from "react";
// import { useRef } from "react"; // (Less common now, but also works)
import styles from "./CVParsingForm.module.css"; // Importing the CSS module

// --- Interfaces and Constants ---

/**
 * Interface for the detailed parsed data received from the backend/mock.
 */
interface ParsedProfile {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  educationSummary: string;
  roleHistory: Array<{ title: string; company: string; duration: string }>;
  experienceYears: number;
}

/**
 * Interface combining the file name with the parsed profile data.
 * The 'file' field helps link the data to the original source.
 */
interface CandidateFile {
  id: string; // Unique ID for table keys and deletion
  file: File;
  parsedData: ParsedProfile;
  isAdded: boolean; // Mock flag for tracking if the candidate is added to the database
}

// Define the file types allowed based on requirements: PDF/DOCX/TXT
const ALLOWED_FILE_TYPES = [".pdf", ".docx", ".doc", ".txt"];
const ACCEPT_MIME_TYPES =
  "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingprocessingml.document, text/plain";

// Generate Mock Data function (since we are only doing frontend)
const generateMockParsedData = (fileName: string): ParsedProfile => {
  const name = fileName
    .split(".")[0]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    name: name,
    email: `${name.toLowerCase().replace(/\s/g, ".")}@example.com`,
    phone: "555-123-4567",
    skills: [
      "Java",
      "Spring Boot",
      "Docker",
      "AWS",
      "Kubernetes",
      "Microservices",
      "PostgreSQL",
    ],
    educationSummary: "M.S. Computer Science from State University, 2018",
    roleHistory: [
      {
        title: "Senior Developer",
        company: "Tech Corp",
        duration: "2022 - Present",
      },
      {
        title: "Software Engineer",
        company: "Startup X",
        duration: "2018 - 2022",
      },
    ],
    experienceYears: Math.floor(Math.random() * 6) + 3, // 3 to 8 years
  };
};

// Start of the main component
const CVParsingForm: React.FC = () => {
  // Part 2: State Management and Handlers

  // ... (rest of the code is omitted until Part 2 is requested)
  // Part 2: State Management and Handlers

  // State to hold the selected files
  const [files, setFiles] = useState<File[]>([]);
  // State to hold the results of parsing for all files
  const [parsedCandidates, setParsedCandidates] = useState<CandidateFile[]>([]);
  // State to track loading status
  const [isLoading, setIsLoading] = useState(false);
  // State for any general errors
  const [error, setError] = useState<string | null>(null);

  // State for the modal (View details pop-up)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateFile | null>(null);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler to click the hidden input when the custom button is clicked
  const handleLabelClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection from the input
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setParsedCandidates([]);

      // Convert FileList to Array
      const selectedFiles = Array.from(event.target.files || []);

      // Simple validation for file types
      const invalidFiles = selectedFiles.filter((file) => {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        return (
          !fileExtension || !ALLOWED_FILE_TYPES.includes(`.${fileExtension}`)
        );
      });

      if (invalidFiles.length > 0) {
        setError(
          `One or more files have an invalid type. Please upload only: ${ALLOWED_FILE_TYPES.join(
            ", "
          )}.`
        );
        setFiles([]);
        return;
      }

      setFiles(selectedFiles);
    },
    []
  );

  // Handle the form submission (Mock parsing logic)
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one CV file to upload.");
      return;
    }

    // Reset states
    setIsLoading(true);
    setError(null);
    setParsedCandidates([]);

    console.log(`Submitting ${files.length} files for parsing...`);

    try {
      // Simulate network delay for bulk processing
      await new Promise((resolve) =>
        setTimeout(resolve, files.length * 500 + 1000)
      );

      const newCandidates: CandidateFile[] = files.map((file) => ({
        id: crypto.randomUUID(), // Use crypto for unique IDs
        file: file,
        parsedData: generateMockParsedData(file.name),
        isAdded: false,
      }));

      setParsedCandidates(newCandidates);
      setFiles([]); // Clear file input after successful "upload"
      // Reset the native input value to allow the same files to be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (apiError) {
      // General error handling
      setError(
        "Error during CV parsing process. Please check the files and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for the "View" button - opens the modal
  const handleView = (candidate: CandidateFile) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  // Handler for the "Delete" button - removes candidate from the table
  const handleDelete = (id: string) => {
    setParsedCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  // Handler for the individual "Add" button (Mocked)
  const handleAdd = (id: string) => {
    setParsedCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isAdded: true } : c))
    );
    // Log to console for frontend-only verification
    console.log(`Mock: Candidate ${id} added to the database.`);
  };

  // Handler for the "Add All" button (Mocked)
  const handleAddAll = () => {
    setParsedCandidates((prev) => prev.map((c) => ({ ...c, isAdded: true })));
    console.log(
      `Mock: All ${parsedCandidates.length} candidates added to the database.`
    );
  };

  // Part 3: Rendering the File Upload Form and Status
  // Part 3: Rendering the File Upload Form and Status

  return (
    <div className={styles.card}>
      <h2>CV Parsing & Analysis</h2>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        {/* File Input - Custom Button and Hidden Input */}
        <div className={styles.fileInputGroup}>
          <button
            type="button" // Use type="button" to prevent form submission on click
            onClick={handleLabelClick}
            disabled={isLoading}
            className={styles.fileUploadButton}
          >
            {files.length > 0 ? (
              <>
                <i className="fas fa-file-alt"></i> {files.length} file
                {files.length !== 1 ? "s" : ""} selected
              </>
            ) : (
              <>
                <i className="fas fa-upload"></i> Upload CVs (PDF, DOCX, TXT)
              </>
            )}
          </button>

          {/* Hidden native file input element */}
          <input
            id="cv-upload"
            type="file"
            accept={ACCEPT_MIME_TYPES}
            onChange={handleFileChange}
            disabled={isLoading}
            multiple
            ref={fileInputRef} // Attach the ref defined in Part 2
            style={{ display: "none" }} // CRUCIAL: Hide the native input
          />
        </div>

        {/* Status and Error Messages */}
        {error && <p className={styles.errorText}>Error: {error}</p>}
        {isLoading && (
          <p className={styles.loadingText}>
            Parsing in progress... Processing {files.length} files.
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={files.length === 0 || isLoading}
          className={styles.submitButton}
        >
          {isLoading
            ? "Processing..."
            : `Parse ${files.length > 0 ? files.length : ""} CV${
                files.length !== 1 ? "s" : ""
              }`}
        </button>
      </form>

      {/* Display Parsed Data Table */}
      {parsedCandidates.length > 0 && (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <h3>✅ {parsedCandidates.length} CVs Parsed</h3>
            <button
              onClick={handleAddAll}
              disabled={parsedCandidates.every((c) => c.isAdded)}
              className={styles.addAllButton}
            >
              {parsedCandidates.every((c) => c.isAdded)
                ? "All Added"
                : "Add All Candidates"}
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Experience (Yrs)</th>
                <th>Skills (Top 3)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parsedCandidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td data-label="Name" className={styles.nameCell}>
                    {candidate.parsedData.name}
                  </td>
                  <td data-label="Experience">
                    {candidate.parsedData.experienceYears}
                  </td>
                  <td data-label="Skills">
                    {candidate.parsedData.skills.slice(0, 3).join(", ")}...
                  </td>
                  <td data-label="Actions" className={styles.actionsCell}>
                    <button
                      onClick={() => handleView(candidate)}
                      className={styles.actionButton}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleAdd(candidate.id)}
                      disabled={candidate.isAdded}
                      className={
                        candidate.isAdded
                          ? styles.addedButton
                          : styles.addButton
                      }
                    >
                      {candidate.isAdded ? "Added" : "Add"}
                    </button>
                    <button
                      onClick={() => handleDelete(candidate.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>
            *Click "View" for full details, including Education and Work
            History.
          </p>
        </div>
      )}

      {/* Modal/Pop-up for Full Details */}
      {isModalOpen && selectedCandidate && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
            <h3 className={styles.modalTitle}>
              Full Profile: {selectedCandidate.parsedData.name}
            </h3>

            <div className={styles.modalDetailGroup}>
              <p>
                <strong>Source File:</strong> {selectedCandidate.file.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedCandidate.parsedData.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedCandidate.parsedData.phone}
              </p>
            </div>

            <h4 className={styles.modalSectionTitle}>Skills:</h4>
            <p>{selectedCandidate.parsedData.skills.join(", ")}</p>

            <h4 className={styles.modalSectionTitle}>Work History:</h4>
            <ul className={styles.roleList}>
              {selectedCandidate.parsedData.roleHistory.map((role, index) => (
                <li key={index}>
                  <strong>{role.title}</strong> at {role.company} (
                  {role.duration})
                </li>
              ))}
            </ul>

            <h4 className={styles.modalSectionTitle}>Education:</h4>
            <p>{selectedCandidate.parsedData.educationSummary}</p>

            <h4 className={styles.modalSectionTitle}>Experience:</h4>
            <p>{selectedCandidate.parsedData.experienceYears} years</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVParsingForm;
