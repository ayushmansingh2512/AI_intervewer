from typing import Optional
import PyPDF2
import docx
import io

def extract_text_from_pdf(file_content: bytes) -> Optional[str]:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text if text.strip() else None
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return None

def extract_text_from_docx(file_content: bytes) -> Optional[str]:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text if text.strip() else None
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return None
