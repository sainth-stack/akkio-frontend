import React from 'react';

const AppView = ({ projectName, runState }) => {
    if (!projectName) {
        return (
            <div style={{ padding: 20, color: '#666' }}>
                Generate an app first.
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
                title="Generated App"
                src={runState.frontend_url}
                className="app-iframe"
            />
        </div>
    );
};

export default AppView;

