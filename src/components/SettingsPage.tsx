// SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentView from './PaymentView';
import KnowledgeBaseComponent from './KnowledgeBaseComponent';
import type { Stripe } from '@stripe/stripe-js';
import './SettingsPage.css'; // Import the CSS file
import { User } from 'firebase/auth';
import { useDarkMode } from '../DarkModeContext';
import { Persona } from './types';
interface File {
    id: number;
    name: string;
    publicUrl: string;
}

interface SettingsPageProps {
    stripePromise: Promise<Stripe | null>;
    user: User | null; // Adjust the user prop type
    subscriptionStatus: string | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ stripePromise, user, subscriptionStatus }) => {
    const navigate = useNavigate();

    const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<File[]>([]);
    const [subscriptionStatusLocal, setSubscriptionStatusLocal] = useState(subscriptionStatus);
    const { darkMode, setDarkMode } = useDarkMode();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);


    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };
    const handleSubscriptionChange = (newStatus: string) => {
        setSubscriptionStatusLocal(newStatus);
    };
    useEffect(() => {
        // Fetch user files with the user token
        if (user) {
            fetchPersonas()
            fetchUserFiles();
        }
    }, [user]); // Run this effect whenever the user object changes

    const fetchUserFiles = async () => {
        if (!user) {
            return;
        }

        try {
            const token = await user.getIdToken();

            const response = await fetch('http://127.0.0.1:5000/api/v1/files', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const files = await response.json();
                setKnowledgeBaseFiles(files);
            } else {
                console.error('Failed to fetch user files:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching user files:', error);
        }
    };

    const handleDeleteFile = async (fileId: number) => {
        if (!user) {
            console.error('User is not available.');
            return;
        }

        // Add logic to delete the file on the server
        try {
            const token = await user.getIdToken();

            const deleteResponse = await fetch(`http://127.0.0.1:5000/api/v1/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (deleteResponse.ok) {
                setKnowledgeBaseFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
            } else {
                console.error('Failed to delete file:', deleteResponse.statusText);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const fetchPersonas = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/v1/personas');
            if (response.ok) {
                const personasData = await response.json();
                setPersonas(personasData);
            } else {
                console.error('Failed to fetch personas:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching personas:', error);
        }
    };
    const handlePersonaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const personaName = event.target.name;
        const isChecked = event.target.checked;
        if (isChecked) {
            setSelectedPersonas((prevSelected) => [...prevSelected, personaName]);
        } else {
            setSelectedPersonas((prevSelected) => prevSelected.filter((p) => p !== personaName));
        }
    };

    const handleSave = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch('http://127.0.0.1:5000/api/v1/user/personas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ selectedPersonas }),
            });
            if (response.ok) {
                console.log('User personas updated successfully');
            } else {
                console.error('Failed to update user personas:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating user personas:', error);
        }
    };
    return (
        <div className={`settings-container ${darkMode ? 'dark-mode' : ''}`}>
            <button className="close-button" onClick={() => navigate('/chat')}>
                Close
            </button>
            <h2 className="settings-header">Settings</h2>
            {/* Dark mode toggle button */}
            <div className="dark-mode-toggle">
                <label htmlFor="darkModeToggle">Dark Mode:</label>
                <input
                    id="darkModeToggle"
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                />
            </div>
            <div className="settings-section">
                <PaymentView stripePromise={stripePromise}
                    user={user}
                    subscriptionStatus={subscriptionStatusLocal}
                    onSubscriptionChange={handleSubscriptionChange}
                />
            </div>
            <div className="settings-section">
                <KnowledgeBaseComponent files={knowledgeBaseFiles} onDeleteFile={handleDeleteFile} darkMode={darkMode} />
            </div>
            {/* Personas selection */}
            <div className="settings-section">
                <h3>Personas</h3>
                <ul>
                    {personas.map((persona) => (
                        <li key={persona.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    name={persona.name}
                                    checked={selectedPersonas.includes(persona.name)}
                                    onChange={handlePersonaChange}
                                />
                                {persona.name}
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Save button */}
            <div className="settings-section">
                <button onClick={handleSave}>Save</button>
            </div>
        </div>

    );
};

export default SettingsPage;