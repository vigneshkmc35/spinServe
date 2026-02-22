import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar glass">
            <div className="nav-container">
                <Link to="/" className="brand">
                    <span className="text-gradient">Spin</span>Serve
                </Link>

                <div className="nav-links">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/server" className="nav-link">Server Dash</Link>
                    <Link to="/customer/session_001" className="nav-link">QR Demo</Link>
                    <Link to="/login" className="btn-primary login-btn">Staff Login</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
