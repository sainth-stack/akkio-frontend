import React from 'react';

import Spinner from 'react-bootstrap/Spinner';

const AppView = ({ projectName, runState, isRunLoading, logs, appRefreshKey = 0 }) => {
    if (!projectName) {
        return (
            <div style={{ padding: 20, color: '#666' }}>
                Generate an app first.
            </div>
        );
    }

    if (isRunLoading) {
        const recentLogs = logs && logs.length > 0 ? logs.slice(-5) : ["Starting environment..."];
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                backgroundColor: '#f8f9fa',
                padding: '20px'
            }}>
                <div style={{
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <h5 style={{ color: '#495057', fontSize: '18px', fontWeight: '500' }}>Starting Application...</h5>
                </div>

                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    backgroundColor: '#1e1e1e',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#d4d4d4',
                    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                    fontSize: '13px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    maxHeight: '200px',
                    overflowY: 'hidden'
                }}>
                    <div style={{
                        borderBottom: '1px solid #333',
                        paddingBottom: '8px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ color: '#9cdcfe', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>System Logs</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                        </div>
                    </div>
                    {recentLogs.map((log, index) => (
                        <div key={index} style={{
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            opacity: index === recentLogs.length - 1 ? 1 : 0.7
                        }}>
                            <span style={{ color: '#569cd6', marginRight: '8px' }}>&gt;</span>
                            {log.replace(/\[system\]/i, '').trim()}
                        </div>
                    ))}
                    <div style={{ marginTop: '8px', animation: 'blink 1s step-end infinite' }}>
                        <span style={{ color: '#27c93f' }}>_</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!runState?.frontend_url) {
        return (
            <div style={{ padding: 20, color: '#666' }}>
                Click <strong>Run</strong> in the Code tab to start the generated app.
            </div>
        );
    }

    return (
        <div className="app-view">
            <div className="app-view-header">
                <div className="app-view-title">
                    Running: <span style={{ fontFamily: 'monospace' }}>{runState.frontend_url}</span>
                </div>
                <div className="app-view-actions">
                    <a href={runState.frontend_url} target="_blank" rel="noreferrer">
                        Open in new tab
                    </a>
                </div>
            </div>
            <iframe
                key={appRefreshKey}
                title="Generated App"
                src={runState.frontend_url}
                className="app-iframe"
            />
        </div>
    );
};

export default AppView;

