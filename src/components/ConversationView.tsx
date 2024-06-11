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
    const { darkMode } = useDarkMode();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (history) {
            const initialStatus: { [messageId: number]: { liked: boolean; disliked: boolean } } = {};
            history.messages.forEach((message) => {
                initialStatus[message.id] = {
                    liked: message.liked || false,
                    disliked: message.disliked || false,
                };
            });

            setHistoryStatus((prevStatus) => ({
                ...prevStatus,
                [history.id]: initialStatus,
            }));

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

    const renderMarkdown = (markdown: string) => {
        return { __html: markdown.replace(/\n/g, '<br>') };
    };

    return (
        <div className={`conversation-view ${darkMode ? 'dark-mode' : ''}`}>
            {history?.messages.map((message) => (
                <div
                    key={message.id}
                    className={`chat-message ${message.sender === 'user' ? 'sent' : 'received'}`}
                >
                    <div className="message-timestamp">{message.timestamp}</div>
                    <div className="message-content" dangerouslySetInnerHTML={renderMarkdown(message.content)} />
                    {message.sender === 'bot' && (
                        <div className="actions">
                            <button
                                onClick={() => handleLike(history?.id || 0, message)}
                                className={`like-button ${getMessageStatus(history?.id || 0, message.id).liked ? 'active' : ''}`}
                                disabled={getMessageStatus(history?.id || 0, message.id).disliked}
                            >
                                👍
                            </button>
                            <button
                                onClick={() => handleDislike(history?.id || 0, message)}
                                className={`dislike-button ${getMessageStatus(history?.id || 0, message.id).disliked ? 'active' : ''}`}
                                disabled={getMessageStatus(history?.id || 0, message.id).liked}
                            >
                                👎
                            </button>
                            <button onClick={() => onCopy(message)} className="copy-button">📋</button>
                        </div>
                    )}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ConversationView;
