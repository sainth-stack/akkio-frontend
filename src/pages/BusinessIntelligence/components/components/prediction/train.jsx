import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../../../../components/EmptyState';
import { FaBrain } from "react-icons/fa";
import { MdOutlineModelTraining } from "react-icons/md";
import ImageModelTraining from '../popups/ImageModelTraining';
import { message } from "antd";

const Train = () => {
    const navigate = useNavigate();
    const filename = typeof window !== 'undefined' ? (localStorage.getItem('filename') || '') : '';
    const [imageTrainingOpen, setImageTrainingOpen] = useState(false);

    const handleTrainingComplete = (result) => {
        message.success(`Model "${result.model_name}" is ready to use!`);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f7f8fa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 40
        }}>
            {!filename ? (
                <div style={{ width: '100%' }}>
                    <EmptyState />
                </div>
            ) : (
            <>
            <h1 style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#22223b',
                marginBottom: 36,
                letterSpacing: 0.2,
                textAlign: 'center'
            }}>
                Train Model
            </h1>
            <div style={{
                display: 'flex',
                gap: 40,
                justifyContent: 'center',
                width: '100%',
                maxWidth: 1100
            }}>
                {/* Predict Card */}
                <div
                    onClick={() => navigate('/predict')}
                    style={{
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 2px 16px rgba(60,72,100,0.08)',
                        padding: '32px 36px',
                        minWidth: 340,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        border: '1px solid #e5eaf2',
                        transition: 'box-shadow 0.2s',
                        cursor: 'pointer',
                    }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(59,130,246,0.13)'}
                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(60,72,100,0.08)'}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#e8f0fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 18
                    }}>
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                            <path d="M9 3L5 7l4 4M5 7h10a6 6 0 016 6v4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#22223b', marginBottom: 6 }}>Predict</div>
                    <div style={{ fontSize: 15, color: '#6b7a90', fontWeight: 400 }}>Autonomously predict outcomes, risks, and classifications from your real time data.</div>
                </div>
                {/* Forecast Card */}
                <div
                    onClick={() => navigate('/forecast')}
                    style={{
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 2px 16px rgba(60,72,100,0.08)',
                        padding: '32px 36px',
                        minWidth: 340,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        border: '1px solid #e5eaf2',
                        transition: 'box-shadow 0.2s',
                        cursor: 'pointer',
                    }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(59,130,246,0.13)'}
                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(60,72,100,0.08)'}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#e8f0fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 18
                    }}>
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                            <path d="M3 3v18h18" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 16l3-3 4 4 6-7" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#22223b', marginBottom: 6 }}>Forecast</div>
                    <div style={{ fontSize: 15, color: '#6b7a90', fontWeight: 400 }}>Forecast future trends and performance using time-aware AI models.</div>
                </div>
                {/* Vision Card */}
                <div
                    onClick={() => setImageTrainingOpen(true)}
                    style={{
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 2px 16px rgba(60,72,100,0.08)',
                        padding: '32px 36px',
                        minWidth: 340,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        border: '1px solid #e5eaf2',
                        transition: 'box-shadow 0.2s',
                        cursor: 'pointer',
                    }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(59,130,246,0.13)'}
                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(60,72,100,0.08)'}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 18,
                        position: 'relative'
                    }}>
                        <MdOutlineModelTraining
                            color="#10b981"
                            style={{ width: 28, height: 28 }}
                        />
                        <FaBrain
                            style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 14,
                                height: 14,
                                color: '#8b5cf6'
                            }}
                        />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#22223b', marginBottom: 6 }}>Vision</div>
                    <div style={{ fontSize: 15, color: '#6b7a90', fontWeight: 400 }}>Upload images to train custom CNN models for classification (defects, quality, categories).</div>
                </div>
            </div>
            </>
            )}

            <ImageModelTraining
                isOpen={imageTrainingOpen}
                onClose={() => setImageTrainingOpen(false)}
                onTrainingComplete={handleTrainingComplete}
            />
        </div>
    )
}

export default Train;