from pypdf import PdfReader
import io

def parse_pdf(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from PDF bytes. Fallback to direct text decode if file is a TXT.
    """
    if filename.lower().endswith('.txt'):
        try:
            return file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            try:
                return file_bytes.decode('latin-1')
            except Exception as e:
                raise ValueError(f"Failed to parse text file: {str(e)}")
                
    # Otherwise treat as PDF
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {i+1} ---\n{page_text}"
        
        # Clean extra whitespace
        text = "\n".join(line.rstrip() for line in text.splitlines())
        
        if not text.strip():
            raise ValueError("The PDF contains no extractable text. It might be scanned. Please upload a text-based PDF.")
            
        return text
    except Exception as e:
        if "no extractable text" in str(e).lower():
            raise e
        raise ValueError(f"Failed to parse PDF file: {str(e)}")
