import React, { useState } from 'react';
import FileViewerComponent from './FileViewerComponent';
import './KnowledgeBaseComponent.css';

interface File {
    id: number;
    name: string;
    publicUrl: string;
}

interface KnowledgeBaseComponentProps {
    files: File[];
    onDeleteFile: (fileId: number) => void;
    darkMode: boolean; // Add dark mode prop
}

const KnowledgeBaseComponent: React.FC<KnowledgeBaseComponentProps> = ({ files, onDeleteFile, darkMode }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileClick = (file: File) => {
        setSelectedFile(file);
    };

    const handleCloseFileViewer = () => {
        setSelectedFile(null);
    };

    const handleDeleteClick = (file: File) => {
        setSelectedFile(file);
    };

    const handleDeleteConfirm = () => {
        if (selectedFile) {
            onDeleteFile(selectedFile.id);
            setSelectedFile(null);
        }
    };

    const handleDeleteCancel = () => {
        setSelectedFile(null);
    };

    return (
        <div className={`knowledgebase-container ${darkMode ? 'dark-mode' : ''}`}>

            <h3>Knowledgebase Management</h3>
            <ul className="file-list">
                {files.map((file) => (
                    <li key={file.id}>
                        <span className="file-link" onClick={() => handleFileClick(file)}>
                            {file.name}
                        </span>
                        <button
                            className="delete-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                const isConfirmed = window.confirm(`Are you sure you want to delete ${file.name}?`);
                                if (isConfirmed) {
                                    onDeleteFile(file.id);
                                }
                            }}
                        >
                            X
                        </button>
                    </li>
                ))}
            </ul>

            {selectedFile && (
                <FileViewerComponent file={selectedFile} onClose={handleCloseFileViewer} darkMode={darkMode} />
            )}
        </div>
    );
};

export default KnowledgeBaseComponent;
