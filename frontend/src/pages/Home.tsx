import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="home-hero animate-in">
            <div className="hero-content">
                <h1 className="hero-title">
                    Revolutionize Your <br />
                    <span className="text-gradient">Dining Experience</span>
                </h1>
                <p className="hero-desc">
                    SpinServe combines high-speed hospitality with interactive gamification.
                    Engage your diners, reward loyalty, and boost sales with every spin.
                </p>

                <div className="hero-btns">
                    <button onClick={() => navigate('/login')} className="btn-primary">
                        Get Started
                    </button>
                    <button onClick={() => navigate('/customer/session_001')} className="btn-secondary">
                        View Live Demo
                    </button>
                </div>
            </div>

            <div className="hero-visual">
                <div className="visual-circle">
                    <div className="inner-spin"></div>
                </div>
            </div>

            <section className="value-props">
                <div className="prop-card glass">
                    <div className="icon">🚀</div>
                    <h3>Fast Ordering</h3>
                    <p>Real-time synchronization between waiters and kitchen staff.</p>
                </div>
                <div className="prop-card glass">
                    <div className="icon">🎮</div>
                    <h3>Interactive Gaming</h3>
                    <p>Keep customers entertained with puzzles while they wait for food.</p>
                </div>
                <div className="prop-card glass">
                    <div className="icon">💎</div>
                    <h3>Smart Rewards</h3>
                    <p>Configurable spinner prizes that automatically apply to the bill.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
