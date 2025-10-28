import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../../../../components/EmptyState';

const Train = () => {
    const navigate = useNavigate();
    const filename = typeof window !== 'undefined' ? (localStorage.getItem('filename') || '') : '';
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
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#3b82f6" fillOpacity="0.12"/><path d="M12 7v5l3 3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#22223b', marginBottom: 6 }}>Predict</div>
                    <div style={{ fontSize: 15, color: '#6b7a90', fontWeight: 400 }}>Predict categories and numerical outcomes</div>
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
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#3b82f6" fillOpacity="0.12"/><path d="M5 12h14M12 5v14" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#22223b', marginBottom: 6 }}>Forecast</div>
                    <div style={{ fontSize: 15, color: '#6b7a90', fontWeight: 400 }}>Forecast or create a time dependent model</div>
                </div>
            </div>
            </>
            )}
        </div>
    )
}

export default Train;