import React, { useState, useEffect } from 'react';
import { akkiourl } from '../utils/const';
import Spinner from 'react-bootstrap/Spinner';
import './DeploymentView.css';

const DeploymentView = ({ projectName, appId, userEmail }) => {
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployment, setDeployment] = useState(null);
    const [error, setError] = useState(null);
    const [pollInterval, setPollInterval] = useState(null);
    
    // GitHub state
    const [isPushingToGithub, setIsPushingToGithub] = useState(false);
    const [githubError, setGithubError] = useState(null);
    const [githubSuccess, setGithubSuccess] = useState(null);
    const [showGithubForm, setShowGithubForm] = useState(false);
    const [githubRepoUrl, setGithubRepoUrl] = useState('');
    const [createNewRepo, setCreateNewRepo] = useState(false);
    const [newRepoName, setNewRepoName] = useState('');

    const apiBase = akkiourl;

    // Debug: Log props to console
    useEffect(() => {
        console.log('DeploymentView Props:', { projectName, appId, userEmail });
    }, [projectName, appId, userEmail]);

    useEffect(() => {
        // Load existing deployment status if we have project name and user email
        if ((appId || projectName) && userEmail) {
            loadDeploymentStatus();
        }
        
        // Cleanup polling on unmount
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appId, projectName, userEmail]);

    const loadDeploymentStatus = async () => {
        try {
            // Build query parameters
            const params = new URLSearchParams({
                user_email: userEmail
            });
            
            if (appId) {
                params.append('app_id', appId);
            } else if (projectName) {
                params.append('project_name', projectName);
            }
            
            const response = await fetch(`${apiBase}/deployment/status?${params.toString()}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.deployment_status !== 'not_deployed') {
                    setDeployment(data);
                    
                    // If deployment is in progress, start polling
                    if (data.deployment_status === 'deploying') {
                        startPolling();
                    }
                }
            }
        } catch (err) {
            console.error('Error loading deployment status:', err);
        }
    };

    const startPolling = () => {
        // Clear any existing interval
        if (pollInterval) {
            clearInterval(pollInterval);
        }

        // Poll every 3 seconds
        const interval = setInterval(async () => {
            await loadDeploymentStatus();
        }, 3000);

        setPollInterval(interval);
    };

    const stopPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
        }
    };

    const handleDeploy = async () => {
        if (!projectName || !userEmail) {
            setError('Missing required information for deployment');
            return;
        }

        setIsDeploying(true);
        setError(null);

        try {
            const response = await fetch(`${apiBase}/deployment/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app_id: appId || null,
                    project_name: projectName,
                    user_email: userEmail
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Start polling for status updates
                startPolling();
            } else {
                setError(data.detail || 'Deployment failed');
                setIsDeploying(false);
            }
        } catch (err) {
            setError(`Deployment error: ${err.message}`);
            setIsDeploying(false);
        }
    };

    const handleRedeploy = async () => {
        if (!projectName || !userEmail) {
            setError('Missing required information for redeployment');
            return;
        }

        setIsDeploying(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiBase}/deployment/redeploy`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        app_id: appId || null,
                        project_name: projectName,
                        user_email: userEmail
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                // Start polling for status updates
                startPolling();
            } else {
                setError(data.detail || 'Redeployment failed');
                setIsDeploying(false);
            }
        } catch (err) {
            setError(`Redeployment error: ${err.message}`);
            setIsDeploying(false);
        }
    };

    const handlePushToGithub = async () => {
        if (!projectName) {
            setGithubError('Missing project name');
            return;
        }

        // Validate inputs
        if (createNewRepo) {
            if (!newRepoName) {
                setGithubError('Please enter a repository name');
                return;
            }
        } else {
            if (!githubRepoUrl) {
                setGithubError('Please enter a repository URL');
                return;
            }
        }

        setIsPushingToGithub(true);
        setGithubError(null);
        setGithubSuccess(null);

        try {
            const response = await fetch(`${apiBase}/github/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_name: projectName,
                    repo_url: createNewRepo ? null : githubRepoUrl,
                    create_repo: createNewRepo,
                    repo_name: createNewRepo ? newRepoName : null,
                    branch: 'main',
                    commit_message: 'Deploy from Akkio App Builder'
                })
            });

            const data = await response.json();

            if (response.ok) {
                setGithubSuccess(`Successfully pushed to GitHub: ${data.repo_url}`);
                setShowGithubForm(false);
                // Reset form
                setGithubRepoUrl('');
                setNewRepoName('');
            } else {
                setGithubError(data.detail || 'Failed to push to GitHub');
            }
        } catch (err) {
            setGithubError(`GitHub push error: ${err.message}`);
        } finally {
            setIsPushingToGithub(false);
        }
    };

    // Stop polling when deployment completes or fails
    useEffect(() => {
        if (deployment) {
            if (deployment.deployment_status === 'deployed' || deployment.deployment_status === 'failed') {
                stopPolling();
                setIsDeploying(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deployment]);

    const getStatusBadge = (status) => {
        const badges = {
            'deploying': { color: '#ffc107', text: 'Deploying' },
            'deployed': { color: '#28a745', text: 'Live' },
            'failed': { color: '#dc3545', text: 'Failed' },
            'pending': { color: '#6c757d', text: 'Pending' }
        };
        
        const badge = badges[status] || badges['pending'];
        
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: '4px',
                backgroundColor: badge.color,
                color: '#fff',
                fontSize: '13px',
                fontWeight: '500'
            }}>
                {badge.text}
            </span>
        );
    };

    return (
        <div className="deployment-view">
            <div className="deployment-header">
                <h3>Deployment</h3>
                <p>Deploy your generated app to EC2 and push to GitHub</p>
            </div>

            {/* Debug Info - only show if actually missing critical info */}
            {(!projectName || !userEmail) && (
                <div className="deployment-debug" style={{ 
                    padding: '12px', 
                    background: '#fff3cd', 
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    fontSize: '13px'
                }}>
                    <strong>Debug Info:</strong>
                    <div>Project Name: {projectName || 'Missing'}</div>
                    <div>App ID: {appId || 'Not saved (optional)'}</div>
                    <div>User Email: {userEmail || 'Missing'}</div>
                </div>
            )}

            {error && (
                <div className="deployment-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* GitHub Section */}
            <div className="github-section" style={{ 
                marginTop: '24px', 
                padding: '20px', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                    Push to GitHub
                </h4>
                
                {githubSuccess && (
                    <div style={{
                        padding: '12px',
                        background: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        marginBottom: '12px',
                        color: '#155724',
                        fontSize: '13px'
                    }}>
                        <strong>Success:</strong> {githubSuccess}
                    </div>
                )}

                {githubError && (
                    <div style={{
                        padding: '12px',
                        background: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        marginBottom: '12px',
                        color: '#721c24',
                        fontSize: '13px'
                    }}>
                        <strong>Error:</strong> {githubError}
                    </div>
                )}

                {!showGithubForm ? (
                    <button
                        className="btn-github"
                        onClick={() => setShowGithubForm(true)}
                        disabled={!projectName}
                        style={{
                            padding: '10px 20px',
                            background: '#24292e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: projectName ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                        Push to GitHub
                    </button>
                ) : (
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <input
                                    type="checkbox"
                                    checked={createNewRepo}
                                    onChange={(e) => setCreateNewRepo(e.target.checked)}
                                />
                                <span style={{ fontSize: '14px' }}>Create new repository</span>
                            </label>
                        </div>

                        {createNewRepo ? (
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>
                                    Repository Name:
                                </label>
                                <input
                                    type="text"
                                    value={newRepoName}
                                    onChange={(e) => setNewRepoName(e.target.value)}
                                    placeholder="my-awesome-app"
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                />
                                <small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6c757d' }}>
                                    Format: username/repo-name or org-name/repo-name
                                </small>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>
                                    Repository URL:
                                </label>
                                <input
                                    type="text"
                                    value={githubRepoUrl}
                                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                                    placeholder="https://github.com/username/repo.git"
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handlePushToGithub}
                                disabled={isPushingToGithub}
                                style={{
                                    padding: '8px 16px',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: isPushingToGithub ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {isPushingToGithub ? (
                                    <>
                                        <Spinner animation="border" size="sm" />
                                        Pushing...
                                    </>
                                ) : (
                                    'Push'
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowGithubForm(false);
                                    setGithubError(null);
                                    setGithubRepoUrl('');
                                    setNewRepoName('');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {!deployment || deployment.deployment_status === 'not_deployed' ? (
                <div className="deployment-empty">
                    <h4>Ready to Deploy</h4>
                    <p>Deploy your app to EC2 and get live URLs</p>
                    <button
                        className="btn-deploy"
                        onClick={handleDeploy}
                        disabled={isDeploying || !projectName || !userEmail}
                    >
                        {isDeploying ? (
                            <>
                                <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} />
                                Deploying...
                            </>
                        ) : (
                            'Deploy to EC2'
                        )}
                    </button>
                    {(!projectName || !userEmail) && (
                        <p style={{ marginTop: '12px', fontSize: '13px', color: '#dc3545' }}>
                            Please generate code first before deploying
                        </p>
                    )}
                </div>
            ) : (
                <div className="deployment-info">
                    <div className="deployment-status-row">
                        <span className="label">Status:</span>
                        {getStatusBadge(deployment.deployment_status)}
                    </div>

                    {deployment.deployment_status === 'deploying' && (
                        <div className="deployment-progress">
                            <Spinner animation="border" size="sm" />
                            <span>Deploying your app to EC2... This may take a few minutes.</span>
                        </div>
                    )}

                    {deployment.deployment_status === 'deployed' && (
                        <>
                            <div className="deployment-urls">
                                {deployment.frontend_url && (
                                    <div className="url-card">
                                        <div className="url-label">
                                            <strong>Frontend URL</strong>
                                        </div>
                                        <div className="url-content">
                                            <a
                                                href={deployment.frontend_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="url-link"
                                            >
                                                {deployment.frontend_url}
                                            </a>
                                            <button
                                                className="btn-copy"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(deployment.frontend_url);
                                                    alert('Copied to clipboard');
                                                }}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {deployment.backend_url && (
                                    <div className="url-card">
                                        <div className="url-label">
                                            <strong>Backend URL</strong>
                                        </div>
                                        <div className="url-content">
                                            <a
                                                href={deployment.backend_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="url-link"
                                            >
                                                {deployment.backend_url}
                                            </a>
                                            <button
                                                className="btn-copy"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(deployment.backend_url);
                                                    alert('Copied to clipboard');
                                                }}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="deployment-actions">
                                <button
                                    className="btn-redeploy"
                                    onClick={handleRedeploy}
                                    disabled={isDeploying}
                                >
                                    Redeploy
                                </button>
                            </div>
                        </>
                    )}

                    {deployment.deployment_status === 'failed' && (
                        <>
                            {deployment.error_message && (
                                <div className="deployment-error">
                                    <strong>Error Details:</strong>
                                    <pre>{deployment.error_message}</pre>
                                </div>
                            )}
                            <div className="deployment-actions">
                                <button
                                    className="btn-retry"
                                    onClick={handleDeploy}
                                    disabled={isDeploying}
                                >
                                    Retry Deployment
                                </button>
                            </div>
                        </>
                    )}

                    <div className="deployment-meta">
                        <div className="meta-item">
                            <span className="meta-label">Project:</span>
                            <span className="meta-value">{deployment.project_name}</span>
                        </div>
                        {deployment.deployed_at && (
                            <div className="meta-item">
                                <span className="meta-label">Deployed:</span>
                                <span className="meta-value">
                                    {new Date(deployment.deployed_at).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeploymentView;
