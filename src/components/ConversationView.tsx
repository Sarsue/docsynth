import React, { useState, useEffect, useRef } from 'react';
import './ConversationView.css';
import { History, Message } from './types';
import { useDarkMode } from '../DarkModeContext';

interface ConversationViewProps {
    history: History | null;
    onLike: (message: Message) => void;
    onDislike: (message: Message) => void;
    onCopy: (message: Message) => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({ history, onLike, onDislike, onCopy }) => {
    const [historyStatus, setHistoryStatus] = useState<{ [historyId: number]: { [messageId: number]: { liked: boolean; disliked: boolean } } }>({});
    const { darkMode, setDarkMode } = useDarkMode(); // Access the darkMode state and setDarkMode function
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize historyStatus when a new history is loaded
        if (history) {
            const initialStatus: { [messageId: number]: { liked: boolean; disliked: boolean } } = {};

            history.messages.forEach((message) => {
                initialStatus[message.id] = {
                    liked: message.liked || false, // Assuming backend provides liked status
                    disliked: message.disliked || false, // Assuming backend provides disliked status
                };
            });

            setHistoryStatus((prevStatus) => ({
                ...prevStatus,
                [history.id]: initialStatus,
            }));

            // Auto Scroll to the bottom whenever a new history is loaded
            scrollToBottom();
        }
    }, [history]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const getMessageStatus = (historyId: number, messageId: number) => {
        return historyStatus[historyId]?.[messageId] || { liked: false, disliked: false };
    };

    const handleLike = (historyId: number, message: Message) => {
        onLike(message);
        setHistoryStatus((prevStatus) => ({
            ...prevStatus,
            [historyId]: {
                ...prevStatus[historyId],
                [message.id]: { liked: true, disliked: false },
            },
        }));
    };

    const handleDislike = (historyId: number, message: Message) => {
        onDislike(message);
        setHistoryStatus((prevStatus) => ({
            ...prevStatus,
            [historyId]: {
                ...prevStatus[historyId],
                [message.id]: { liked: false, disliked: true },
            },
        }));
    };

    return (
        <div className={`conversation-view ${darkMode ? 'dark-mode' : ''}`}>
            {history?.messages.map((message) => (
                <div
                    key={message.id}
                    className={`chat-message ${message.sender === 'user' ? 'sent' : 'received'}`}
                    style={{
                        backgroundColor: message.sender === 'user' ? 'white' : 'lightsteelblue',
                        alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                >
                    <div className="message-timestamp">{message.timestamp}</div>
                    <div className="message-content">
                        {message.content}
                        {message.sender === 'bot' && (
                            <div className="actions">
                                <button
                                    onClick={() => handleLike(history?.id || 0, message)}
                                    className={`like-button ${getMessageStatus(history?.id || 0, message.id).liked ? 'active' : ''}`}
                                    disabled={getMessageStatus(history?.id || 0, message.id).disliked}
                                    style={{ backgroundColor: getMessageStatus(history?.id || 0, message.id).liked ? 'blue' : '' }}
                                >
                                    Like
                                </button>
                                <button
                                    onClick={() => handleDislike(history?.id || 0, message)}
                                    className={`dislike-button ${getMessageStatus(history?.id || 0, message.id).disliked ? 'active' : ''}`}
                                    disabled={getMessageStatus(history?.id || 0, message.id).liked}
                                    style={{ backgroundColor: getMessageStatus(history?.id || 0, message.id).disliked ? 'blue' : '' }}
                                >
                                    Dislike
                                </button>
                                <button onClick={() => onCopy(message)}>Copy</button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ConversationView;
