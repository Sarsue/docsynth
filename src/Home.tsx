import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { useDarkMode } from './DarkModeContext';

const Home: React.FC = () => {
    const { darkMode } = useDarkMode();

    return (
        <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
            <Link to="/login" className="signin-link">
                <button className="google-sign-in-button">Sign in with Google</button>
            </Link>
            <div className="video-container">
                {/* Display the appropriate GIF based on dark mode */}
                <img
                    src={darkMode ? "https://firebasestorage.googleapis.com/v0/b/docsynth-fbb02.appspot.com/o/dark-mode-text.gif?alt=media&token=4b0c24b4-468c-4ce3-8a04-20d2ac5d18ca" : "https://firebasestorage.googleapis.com/v0/b/docsynth-fbb02.appspot.com/o/light-mode-text.gif?alt=media&token=ed8bee31-9906-432b-990e-799b8352fa9c"}
                    alt={darkMode ? "Dark Mode Animated Video" : "Light Mode Animated Video"}
                />
            </div>
            <div className="company-logo-container">
                <img src="/company-logo.png" alt="Company Logo" />
            </div>
        </div>
    );
};

export default Home;
