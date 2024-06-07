import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ConversationView from './ConversationView';
import InputArea from './InputArea';
import HistoryView from './HistoryView';
import { Message, History } from '../components/types';
import './ChatApp.css';
import { User } from 'firebase/auth';
import { useDarkMode } from '../DarkModeContext';

interface ChatAppProps {
    user: User | null;
    onLogout: () => void;
    subscriptionStatus: string | null;
}

const ChatApp: React.FC<ChatAppProps> = ({ user, onLogout, subscriptionStatus }) => {
    const [loading, setLoading] = useState(false);
    const [histories, setHistories] = useState<{ [key: number]: History }>({});
    const [currentHistory, setCurrentHistory] = useState<number | null>(null);
    const { darkMode, setDarkMode } = useDarkMode(); // Access the darkMode state and setDarkMode function

    const navigate = useNavigate();

    const handleSettingsClick = () => {
        navigate('/settings');
    };

    const updateStatus = async (messageId: number, like: boolean) => {
        try {
            const url = `http://127.0.0.1:5000/api/v1/messages/${like ? 'like' : 'dislike'}/${messageId}`;
            const method = 'POST';

            const response = await callApiWithToken(url, method);

            if (response && response.ok) {
                // Update local state here
                setHistories((prevHistories) => {
                    const updatedHistories = { ...prevHistories };

                    // Check if currentHistory is not null or undefined
                    if (currentHistory !== null && currentHistory !== undefined) {
                        const updatedMessages = updatedHistories[currentHistory]?.messages.map((message) => {
                            if (message.id === messageId) {
                                return { ...message, liked: like, disliked: !like };
                            }
                            return message;
                        });

                        if (updatedMessages) {
                            // Update the specific history with the modified messages
                            updatedHistories[currentHistory] = {
                                ...updatedHistories[currentHistory],
                                messages: updatedMessages,
                            };
                        }
                    }

                    return updatedHistories;
                });

                console.log(`Message ${like ? 'liked' : 'disliked'} successfully`);
            } else {
                console.error(`Failed to ${like ? 'like' : 'dislike'} message`);
                // Handle the error, show a notification, etc.
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        }
    };

    const callApiWithToken = async (url: string, method: string, body?: any) => {
        try {
            const idToken = await user?.getIdToken();

            if (!idToken) {
                console.error('User token not available');
                return null;
            }

            const headers: HeadersInit = {
                'Authorization': `Bearer ${idToken}`,
            };



            const response = await fetch(url, {
                method,
                headers,
                mode: 'cors',
                credentials: 'include',
                body: body ? body : undefined,  // Do not stringify the body for FormData
            });

            return response;
        } catch (error) {
            console.error('Unexpected error calling API:', error);
            return null;
        }
    };


    const handleLike = (message: Message) => {
        updateStatus(message.id, true);
    };

    const handleDislike = (message: Message) => {
        updateStatus(message.id, false);
    };

    const handleCopy = (message: Message) => {
        const textToCopy = message.content;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                console.log('Text successfully copied to clipboard:', textToCopy);
            })
            .catch((err) => {
                console.error('Unable to copy text to clipboard:', err);
            });
    };

    const handleSend = async (message: string, files: File[]) => {
        try {
            setLoading(true);
            console.log('Files to append:', files);
            console.log(subscriptionStatus)
            if (subscriptionStatus === 'active') {
                if (files.length > 0) {
                    const formData = new FormData();

                    for (let i = 0; i < files.length; i++) {
                        formData.append(files[i].name, files[i])
                    }



                    const fileDataResponse = await callApiWithToken(
                        'http://127.0.0.1:5000/api/v1/files',
                        'POST',
                        formData
                    );


                    if (fileDataResponse && fileDataResponse.ok) {
                        const fileData = await fileDataResponse.json();
                        // Handle file data as needed

                        // Show a success notification
                        toast.success(fileData.message, {
                            position: 'top-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else {
                        // Handle other responses (e.g., error responses) here
                        toast.error('File upload failed. Please try again.', {
                            position: 'top-right',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    }

                    // Check if the message is empty after sending files
                    if (!message.trim()) {
                        return; // Early return if the message is empty
                    }
                }
            } else {
                if (files.length > 0) {
                    const formData = new FormData();
                    formData.append('file', files[0]);

                    const fileDataResponse = await callApiWithToken(
                        'http://127.0.0.1:5000/api/v1/files',
                        'POST',  // Use PUT method to overwrite the existing file
                        formData
                    );

                    if (fileDataResponse && fileDataResponse.ok) {
                        const fileData = await fileDataResponse.json();
                        // Handle file data as needed
                        const toastMessage = 'Only The First File is uploaded and will overwrite any existing file on the backend. Subscribe to upload multiple files';
                        // Show a success notification
                        toast.success(toastMessage, {
                            position: 'top-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else {
                        // Handle other responses (e.g., error responses) here
                        toast.error('File upload failed. Please try again.', {
                            position: 'top-right',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    }
                    if (!message.trim()) {
                        return; // Early return if the message is empty
                    }
                }
            }

            if (currentHistory !== null && !isNaN(currentHistory)) {
                const history = histories[currentHistory];

                if (history) {
                    // Simulate sending a temporary message with ID -1
                    const temporaryMessage: Message = {
                        id: -1,
                        content: message,
                        sender: 'user', // You can update this with the actual sender information
                        timestamp: new Date().toLocaleString('en-US', { hour12: false }),
                        liked: false,
                        disliked: false,
                    };

                    const updatedMessages = [...history.messages, temporaryMessage];

                    setHistories((prevHistories) => {
                        const updatedHistory = {
                            ...prevHistories[currentHistory],
                            messages: updatedMessages,
                        };

                        return {
                            ...prevHistories,
                            [currentHistory]: updatedHistory,
                        };
                    });

                    const linkDataResponse = await callApiWithToken(
                        `http://127.0.0.1:5000/api/v1/messages?message=${encodeURIComponent(message)}&history-id=${encodeURIComponent(history.id)}`,
                        'POST'
                    );

                    if (linkDataResponse) {
                        const linkData = await linkDataResponse.json();

                        const newMessages = Array.isArray(linkData)
                            ? linkData.map((messageData: any) => ({
                                id: messageData.id,
                                content: messageData.content,
                                sender: messageData.sender,
                                timestamp: messageData.timestamp,
                                liked: messageData.is_liked === 1,
                                disliked: messageData.is_disliked === 1,
                            }))
                            : [];

                        const updatedMessages = [
                            ...history.messages.filter((msg) => msg.id !== -1),
                            ...newMessages,
                        ];

                        setHistories((prevHistories) => {
                            const updatedHistory = {
                                ...prevHistories[currentHistory],
                                messages: updatedMessages,
                            };

                            return {
                                ...prevHistories,
                                [currentHistory]: updatedHistory,
                            };
                        });
                    }
                }
            } else {
                const createHistoryResponse = await callApiWithToken(
                    `http://127.0.0.1:5000/api/v1/histories?title=${encodeURIComponent(message || 'New Chat')}`,
                    'POST'
                );

                if (createHistoryResponse) {
                    const createHistoryData = await createHistoryResponse.json();

                    if (createHistoryData?.id) {
                        const newHistory: History = {
                            id: createHistoryData.id,
                            title: createHistoryData.title,
                            messages: [],
                        };

                        const temporaryMessage: Message = {
                            id: -1,
                            content: message,
                            sender: 'user', // You can update this with the actual sender information
                            timestamp: new Date().toLocaleString('en-US', { hour12: false }),
                            liked: false,
                            disliked: false,
                        };

                        const updatedMessages = [...newHistory.messages, temporaryMessage];

                        setHistories((prevHistories) => ({
                            ...prevHistories,
                            [newHistory.id]: {
                                ...newHistory,
                                messages: updatedMessages,
                            },
                        }));

                        setCurrentHistory(newHistory.id);

                        const linkDataResponse = await callApiWithToken(
                            `http://127.0.0.1:5000/api/v1/messages?message=${encodeURIComponent(message)}&history-id=${encodeURIComponent(newHistory.id)}`,
                            'POST'
                        );

                        if (linkDataResponse) {
                            const linkData = await linkDataResponse.json();

                            const newMessages = Array.isArray(linkData)
                                ? linkData.map((messageData: any) => ({
                                    id: messageData.id,
                                    content: messageData.content,
                                    sender: messageData.sender,
                                    timestamp: messageData.timestamp,
                                    liked: messageData.is_liked === 1,
                                    disliked: messageData.is_disliked === 1,
                                }))
                                : [];

                            const updatedMessages = [
                                ...newHistory.messages.filter((msg) => msg.id !== -1),
                                ...newMessages,
                            ];

                            setHistories((prevHistories) => ({
                                ...prevHistories,
                                [newHistory.id]: {
                                    ...newHistory,
                                    messages: updatedMessages,
                                },
                            }));
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleClearHistory = async () => {
        try {
            const clearHistoryResponse = await callApiWithToken('http://127.0.0.1:5000/api/v1/histories/all', 'DELETE');

            if (!clearHistoryResponse?.ok) {
                console.error('Failed to clear history:', clearHistoryResponse?.statusText);
                return;
            }

            await fetchHistories();

            setCurrentHistory(null);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    const handleNewChat = async () => {
        try {
            const createHistoryResponse = await callApiWithToken('http://127.0.0.1:5000/api/v1/histories?title=New%20Chat', 'POST');

            if (createHistoryResponse) {
                const createHistoryData = createHistoryResponse.ok ? await createHistoryResponse.json() : null;

                if (createHistoryData?.id) {
                    const newHistory: History = {
                        id: createHistoryData.id,
                        title: createHistoryData.title,
                        messages: [],
                    };

                    setHistories((prevHistories) => ({ ...prevHistories, [newHistory.id]: newHistory }));
                    setCurrentHistory(newHistory.id);
                }
            }
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    };


    const handleDeleteHistory = async (historyId: number | History) => {
        try {
            const idToDelete = typeof historyId === 'number' ? historyId : historyId.id;

            const deleteHistoryResponse = await callApiWithToken(`http://127.0.0.1:5000/api/v1/histories?history-id=${encodeURIComponent(idToDelete)}`, 'DELETE');

            if (deleteHistoryResponse) {
                const deleteHistoryData = await deleteHistoryResponse.json();

                if (deleteHistoryData?.message === 'History deleted successfully') {
                    console.log('History deleted successfully');

                    await fetchHistories();

                    if (currentHistory === idToDelete) {
                        setCurrentHistory(null);
                    }
                } else {
                    console.error('Failed to delete history:', deleteHistoryData?.message);
                }
            }
        } catch (error) {
            console.error('Error deleting history:', error);
        }
    };
    const fetchHistories = async () => {
        try {
            const historiesResponse = await callApiWithToken('http://127.0.0.1:5000/api/v1/histories', 'GET');

            if (!historiesResponse?.ok) {
                console.error('Failed to fetch chat histories:', historiesResponse?.status, historiesResponse?.statusText);
                return;
            }

            let jsonResponse;
            try {
                jsonResponse = await historiesResponse.json();
            } catch (error) {
                console.error('Error parsing JSON response:', error);
                return;
            }

            if (!Array.isArray(jsonResponse)) {
                console.error('Invalid response format:', jsonResponse);
                return;
            }

            const histories: History[] = jsonResponse.map((historyData: any) => ({
                id: historyData.id,
                title: historyData.title,
                messages: (historyData.messages || []).map((messageData: any) => ({
                    id: messageData.id,
                    content: messageData.content,
                    sender: messageData.sender,
                    timestamp: messageData.timestamp,
                    liked: messageData.is_liked === 1,
                    disliked: messageData.is_disliked === 1,
                })),
            }));

            const historiesObject: { [key: number]: History } = {};
            histories.forEach((history) => {
                historiesObject[history.id] = history;
            });

            setHistories(historiesObject);

            const latestHistoryId = histories.length > 0 ? histories[histories.length - 1].id : null;
            setCurrentHistory(latestHistoryId);

            console.log('Loaded Histories:', histories);
        } catch (error) {
            console.error('Error fetching chat histories:', error);
        }
    };

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    useEffect(() => {
        if (user) {
            fetchHistories();
        }
    }, [user]);

    return (
        <div className={`chat-app-container ${darkMode ? 'dark-mode' : ''}`}>
            <div className="conversation-column">
                <ConversationView
                    history={currentHistory !== null ? histories[currentHistory] : null}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onCopy={handleCopy}
                />
                <InputArea onSend={handleSend} isSending={loading} />
                <ToastContainer />
            </div>
            <div className="history-column">
                {user !== null && (
                    <div>
                        <button onClick={handleSettingsClick}>Settings</button>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                )}
                <HistoryView
                    histories={Object.values(histories)}
                    setCurrentHistory={setCurrentHistory as React.Dispatch<React.SetStateAction<number | History | null>>}
                    onClearHistory={handleClearHistory}
                    onNewChat={handleNewChat}
                    onDeleteHistory={handleDeleteHistory}
                />
            </div>
        </div>
    );
};

export default ChatApp;
