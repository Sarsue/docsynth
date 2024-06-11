// SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentView from './PaymentView';
import KnowledgeBaseComponent from './KnowledgeBaseComponent';
// Import Stripe types directly from the library
import { loadStripe, Stripe } from '@stripe/stripe-js';
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
    const [activeTab, setActiveTab] = useState<'payment' | 'knowledge' | 'persona' | 'general'>('payment');
    const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<File[]>([]);
    const [subscriptionStatusLocal, setSubscriptionStatusLocal] = useState<string | null>(subscriptionStatus);
    const { darkMode, setDarkMode } = useDarkMode();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersonas, setSelectedPersonas] = useState<number[]>([]);
    const [saveMessage, setSaveMessage] = useState<string>(''); // State for save message

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };
    const handleSubscriptionChange = (newStatus: string) => {
        setSubscriptionStatusLocal(newStatus);
    };

    useEffect(() => {
        // Fetch personas when the component mounts
        fetchPersonas();
    }, []); // Run this effect only once when the component mounts

    useEffect(() => {
        // Fetch user files and personas with the user token whenever user changes
        if (user) {
            fetchUserFiles();
            fetchUserPersonas();
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
            const response = await fetch('http://127.0.0.1:5000/api/v1/personas', {
                credentials: 'include', // Include credentials for CORS
            });
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
    // Function to fetch user's selected personas
    const fetchUserPersonas = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch('http://127.0.0.1:5000/api/v1/users/personas', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include', // Include credentials for CORS
            });
            if (response.ok) {
                const userPersonas = await response.json();
                setSelectedPersonas(userPersonas.map((persona: Persona) => persona.id));
            } else {
                console.error('Failed to fetch user personas:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching user personas:', error);
        }
    };

    // Function to handle persona selection/deselection
    const handlePersonaChange = (id: number) => {
        if (selectedPersonas.includes(id)) {
            setSelectedPersonas((prevSelected) => prevSelected.filter((p) => p !== id));
        } else {
            setSelectedPersonas((prevSelected) => [...prevSelected, id]);
        }
    };

    const handleSave = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch('http://127.0.0.1:5000/api/v1/users/personas', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ selected_personas: selectedPersonas }),
            });
            if (response.ok) {
                console.log('User personas updated successfully');
                setSaveMessage('User personas saved successfully'); // Set success message
            } else {
                console.error('Failed to update user personas:', response.statusText);
                setSaveMessage('Failed to save user personas'); // Set error message
            }
        } catch (error) {
            console.error('Error updating user personas:', error);
            setSaveMessage('Error saving user personas'); // Set error message
        }
    };


    return (
        <div className={`settings-container ${darkMode ? 'dark-mode' : ''}`}>
            <button className="close-button" onClick={() => navigate('/chat')}>
                ❌
            </button>
            <div className="tab-buttons">
                <button className={activeTab === 'payment' ? 'active' : ''} onClick={() => setActiveTab('payment')}>Payment</button>
                <button className={activeTab === 'knowledge' ? 'active' : ''} onClick={() => setActiveTab('knowledge')}>Knowledge Management</button>
                <button className={activeTab === 'persona' ? 'active' : ''} onClick={() => setActiveTab('persona')}>Persona</button>
                <button className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>General</button>
            </div>
            <div className="settings-content">
                {activeTab === 'knowledge' && (
                    <KnowledgeBaseComponent files={knowledgeBaseFiles} onDeleteFile={handleDeleteFile} darkMode={darkMode} />
                )}
                {activeTab === 'persona' && (
                    <div>
                        <h3>Personas</h3>
                        <ul>
                            {personas.map((persona) => (
                                <li key={persona.id}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={selectedPersonas.includes(persona.id)}
                                            onChange={() => handlePersonaChange(persona.id)}
                                        />
                                        {persona.name}
                                    </label>
                                </li>
                            ))}
                        </ul>
                        <button className="save-persona-button" onClick={handleSave}>Save</button>
                        {saveMessage && <p className="save-message">{saveMessage}</p>}
                    </div>
                )}
                {activeTab === 'payment' && (
                    <PaymentView stripePromise={stripePromise} user={user} subscriptionStatus={subscriptionStatusLocal} onSubscriptionChange={handleSubscriptionChange} />
                )}
                {activeTab === 'general' && (
                    <div className="dark-mode-toggle">
                        <label htmlFor="darkModeToggle">Dark Mode:</label>
                        <input
                            id="darkModeToggle"
                            type="checkbox"
                            checked={darkMode}
                            onChange={() => setDarkMode(!darkMode)}
                        />
                    </div>
                )}
            </div>
        </div>
    );

};

export default SettingsPage;