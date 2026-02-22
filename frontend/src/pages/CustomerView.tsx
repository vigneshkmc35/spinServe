import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import './CustomerView.css';

const CustomerView: React.FC = () => {
    const { sessionId } = useParams();
    const [session, setSession] = useState<any>(null);
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<any>(null);

    const fetchSession = async () => {
        try {
            const { data } = await api.get(`/sessions/${sessionId}`);
            setSession(data);
        } catch (e) {
            console.error("Session not found");
        }
    };

    useEffect(() => {
        fetchSession();
        const interval = setInterval(fetchSession, 5000);
        return () => clearInterval(interval);
    }, [sessionId]);

    const handleWinPuzzle = async () => {
        await api.post(`/sessions/${sessionId}/game-won`);
        fetchSession();
    };

    const handleSpin = async () => {
        setSpinning(true);
        setTimeout(async () => {
            const { data } = await api.post(`/sessions/${sessionId}/spin`);
            setResult(data.won_slot);
            setSpinning(false);
            fetchSession();
        }, 3000);
    };

    if (!session) return <div className="loading">Initializing Table Session...</div>;

    const canSpin = session.game_status === 'WON' && !session.reward_won;

    return (
        <div className="customer-container animate-in">
            <div className="bill-card glass">
                <h2>Table Order Summary</h2>
                <div className="bill-total">
                    <p>Current Total</p>
                    <h1>₹ {session.total_amount}</h1>
                </div>
                {session.reward_won && (
                    <div className="applied-reward">
                        🎉 Reward Applied: {session.reward_won.description}
                    </div>
                )}
            </div>

            <div className="game-section">
                {session.game_status === 'LOCKED' && (
                    <div className="locked-msg glass">
                        <div className="icon">🔒</div>
                        <h3>Game Locked</h3>
                        <p>Order for ₹{200 - session.total_amount} more to unlock the prize wheel!</p>
                    </div>
                )}

                {session.game_status === 'UNLOCKED' && (
                    <div className="puzzle-msg glass">
                        <h3>Break the Puzzle!</h3>
                        <p>Solve this quick task to earn your spin.</p>
                        <button className="btn-primary" onClick={handleWinPuzzle}>I Solved It!</button>
                    </div>
                )}

                {(session.game_status === 'WON' || session.game_status === 'PLAYING') && !session.reward_won && (
                    <div className="spinner-box glass">
                        <h3>Spin to Win!</h3>
                        <div className={`wheel-visual ${spinning ? 'spinning' : ''}`}>
                            <div className="pin"></div>
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleSpin}
                            disabled={spinning || !canSpin}
                        >
                            {spinning ? 'Good Luck...' : 'SPIN NOW'}
                        </button>
                    </div>
                )}

                {result && !spinning && (
                    <div className="result-overlay glass animate-in">
                        <h2>CONGRATULATIONS!</h2>
                        <p>You won: <strong>{result.label}</strong></p>
                        <button className="btn-secondary" onClick={() => setResult(null)}>Awesome</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerView;
