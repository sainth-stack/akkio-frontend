import React from 'react';

import Spinner from 'react-bootstrap/Spinner';

const AppView = ({
    projectName,
    runState,
    isRunLoading,
    logs,
    appRefreshKey = 0,
    buildStatus,
    buildError,
    buildLog,
    onRetryRun,
}) => {
    const previewUrlWithAuth = () => {
        const base = runState?.frontend_url;
        if (!base) return null;
        try {
            const token = localStorage.getItem('access_token') || '';
            if (!token) return base;
            const sep = base.includes('?') ? '&' : '?';
            return `${base}${sep}access_token=${encodeURIComponent(token)}`;
        } catch {
            return base;
        }
    };

    const iframeSrc = previewUrlWithAuth();
    if (!projectName) {
        return (
            <div style={{ padding: 20, color: '#666' }}>
                Generate an app first.
            </div>
        );
    }

    // Prefer showing the live preview as soon as we have a URL (don't wait for stream to close)
    if (iframeSrc && buildStatus !== 'BUILD_FAILED' && (buildStatus === 'BUILD_SUCCESS' || !isRunLoading)) {
        return (
            <div className="app-view">
                <div className="app-view-header">
                    <div className="app-view-title">
                        Running: <span style={{ fontFamily: 'monospace' }}>{runState.frontend_url}</span>
                    </div>
                    <div className="app-view-actions">
                        <a href={iframeSrc} target="_blank" rel="noreferrer">
                            Open in new tab
                        </a>
                    </div>
                </div>
                <iframe
                    key={appRefreshKey}
                    title="Generated App"
                    src={iframeSrc}
                    className="app-iframe"
                />
            </div>
        );
    }

    if (buildStatus === 'BUILD_FAILED') {
        const failureLog = buildLog || (logs && logs.length ? logs.join('\n') : '');
        return (
            <div style={{ padding: 20, color: '#334155' }}>
                <h5 style={{ color: '#b91c1c', marginBottom: 12 }}>Build failed</h5>
                {buildError && (
                    <p style={{ marginBottom: 12, fontSize: 14 }}>{buildError}</p>
                )}
                {failureLog && (
                    <pre style={{
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4',
                        padding: 16,
                        borderRadius: 8,
                        fontSize: 12,
                        maxHeight: 320,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}>
                        {failureLog}
                    </pre>
                )}
                <p style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>
                    Fix the issue above, then click <strong>Run App</strong> in the Build tab header to try again.
                </p>
                {onRetryRun && (
                    <button
                        type="button"
                        onClick={onRetryRun}
                        style={{
                            marginTop: 12,
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Retry Run
                    </button>
                )}
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

    return (
        <div style={{ padding: 20, color: '#666' }}>
            Click <strong>Run App</strong> in the Build tab header to build and preview your generated app.
        </div>
    );
};

export default AppView;
