from pdfminer.high_level import extract_text
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfparser import PDFParser
from pdfminer.pdfpage import PDFPage
from PIL import Image
import pytesseract
import os


def extract_text_from_pdf(pdf_file):
    text = ""
    with open(pdf_file, 'rb') as file:
        parser = PDFParser(file)
        document = PDFDocument(parser)
        total_pages = len(list(PDFPage.create_pages(document)))

        for page_number in range(1, total_pages + 1):
            # Extract text from each page
            page_text = extract_text(file, page_numbers=[page_number])
            text += page_text

    return text.strip()


def extract_text_from_image(image_file):
    return pytesseract.image_to_string(Image.open(image_file))


def extract_text_from_txt(txt_file):
    print(txt_file)
    if os.path.exists(txt_file):
        with open(txt_file, 'r', encoding='utf-8') as file:
            return file.read()
    else:
        return "File not found"


def handle_file(file):
    extracted_text = []
    temp_dir = os.path.join(os.getcwd(), 'source_documents')

    try:
        # Save received files to the temporary folder
        file_paths = []
        extracted_text.append(file.filename + " summary is")
        file_path = os.path.join(temp_dir, file.filename)
        file.save(file_path)
        file_paths.append(file_path)
        file_extension = file_path.rsplit('.', 1)[1].lower()

        if file_extension == 'pdf':
            text = extract_text_from_pdf(file_path)
        elif file_extension in ['jpg', 'jpeg', 'png', 'gif']:
            text = extract_text_from_image(file_path)
        elif file_extension == 'txt':
            text = extract_text_from_txt(file_path)
        else:
            text = f"Unsupported file type: {file_extension}"

        extracted_text.append(text)

    finally:
        # Delete temporary files
        for file_path in file_paths:
            os.remove(file_path)

        # Remove the temporary directory
        # os.rmdir(temp_dir)

    return '\n'.join(extracted_text)


if __name__ == "__main__":
    result = extract_text_from_pdf(
        "/Users/osas/Documents/dev/augur/api/source_documents/test.pdf")
    text = result["text"]
    metadata = result["metadata"]

    for page_info in metadata:
        page_number = page_info["page_number"]
        text_length = page_info["text_length"]
        print(f"Page {page_number}: {text_length} characters : text {text}")
