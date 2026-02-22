import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import './Login.css';

const Login: React.FC = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const navigate = useNavigate();

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 40;
        const y = (clientY / window.innerHeight - 0.5) * 40;
        setMousePos({ x, y });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const loginPromise = authAPI.login(mobile, password);

        toast.promise(loginPromise, {
            loading: 'Authenticating your credentials...',
            success: (data) => {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data));

                // Route based on role
                setTimeout(() => {
                    if (data.role === 'OWNER') navigate('/owner');
                    else if (data.role === 'SERVER') navigate('/server');
                }, 800);

                return `Welcome back, ${data.name}!`;
            },
            error: (err) => {
                setIsLoading(false);
                return err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
            },
        });

        try {
            await loginPromise;
        } catch (error) {
            console.error("Login Error:", error);
        }
    };

    return (
        <div className="login-page" onMouseMove={handleMouseMove}>
            {/* Interactive Background Mesh - Premium Deep Parallax */}
            <div className="bg-parallax-layer" style={{
                transform: `scale(1.1) translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`
            }}></div>

            {/* Cinematic Floating Elements with Dynamic Depth */}
            <div className="floating-element" style={{
                top: '12%', left: '8%',
                transform: `translate(${mousePos.x * -1.2}px, ${mousePos.y * -1.2}px) rotate(${mousePos.x * 0.3}deg)`,
                fontSize: '6.5rem'
            }}>🍕</div>
            <div className="floating-element" style={{
                top: '55%', left: '10%',
                transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px) rotate(${mousePos.x * -0.8}deg)`,
                fontSize: '5rem'
            }}>🍱</div>
            <div className="floating-element" style={{
                top: '18%', right: '12%',
                transform: `translate(${mousePos.x * -2.5}px, ${mousePos.y * -2.5}px) rotate(${mousePos.x * 0.7}deg)`,
                fontSize: '6rem'
            }}>🍜</div>
            <div className="floating-element" style={{
                top: '70%', right: '15%',
                transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px) rotate(${mousePos.y * 0.4}deg)`,
                fontSize: '5.5rem'
            }}>🍔</div>
            <div className="floating-element" style={{
                top: '40%', left: '45%',
                transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`,
                fontSize: '3.5rem'
            }}>🥟</div>

            <div className="login-card">
                <div className="login-header">
                    <div className="logo-container">
                        <div className="steam-container">
                            <div className="steam-line"></div>
                            <div className="steam-line"></div>
                            <div className="steam-line"></div>
                        </div>
                        <span className="main-icon">🍱</span>
                    </div>
                    <h1>Staff <span>Management</span></h1>
                    <p>SpinServe Digital Dining Suite</p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <span className="icon">📱</span>
                        <input
                            type="text"
                            placeholder="Mobile Number"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="tel"
                        />
                    </div>

                    <div className="input-group">
                        <span className="icon">🔒</span>
                        <input
                            type="password"
                            placeholder="Security Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Enter Suite'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
