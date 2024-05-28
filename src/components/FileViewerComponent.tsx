import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './FileViewerComponent.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface FileViewerComponentProps {
    file: { name: string; publicUrl: string };
    onClose: () => void;
    darkMode: boolean;
}

const FileViewerComponent: React.FC<FileViewerComponentProps> = ({ file, onClose, darkMode }) => {
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchFileContent = async () => {
            try {
                const response = await fetch(file.publicUrl, {
                    mode: 'cors',
                });

                if (response.ok) {
                    const content = await response.text();
                    setFileContent(content);

                    const dotIndex = file.name.lastIndexOf('.');
                    if (dotIndex !== -1) {
                        const extractedType = file.name.slice(dotIndex + 1);
                        setFileType(extractedType.toLowerCase());
                    }
                } else {
                    console.error('Failed to fetch file content:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching file content:', error);
            }
        };

        fetchFileContent();
    }, [file.publicUrl, file.name]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const renderFileContent = () => {
        switch (fileType) {
            case 'pdf':
                const containerWidth = containerRef.current?.clientWidth || 600;

                return (
                    <Document file={file.publicUrl} onLoadSuccess={onDocumentLoadSuccess} renderMode="svg">
                        {Array.from({ length: numPages }, (_, index) => (
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                width={containerWidth}
                            />
                        ))}
                    </Document>
                );

            case 'mp4':
                return <video src={file.publicUrl} controls width="100%" />;
            case 'txt':
                return <pre>{fileContent}</pre>;
            case 'docx':
                return <div>Render DOCX here</div>;
            default:
                return <div>{fileContent}</div>;
        }
    };

    return (
        <div className={`file-viewer-modal ${darkMode ? 'dark-mode' : ''}`}>
            <div ref={containerRef} className="file-viewer-content">
                <h4>{file.name}</h4>
                {fileContent !== null ? renderFileContent() : <p>Loading...</p>}
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default FileViewerComponent;
