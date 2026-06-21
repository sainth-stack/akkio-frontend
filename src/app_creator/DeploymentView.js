import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Spinner from 'react-bootstrap/Spinner';
import './DeploymentView.css';

const DeploymentView = ({ projectName, appId }) => {
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployment, setDeployment] = useState(null);
    const [error, setError] = useState(null);
    const [pollInterval, setPollInterval] = useState(null);
    
    const [isPushingToGithub, setIsPushingToGithub] = useState(false);
    const [githubError, setGithubError] = useState(null);
    const [githubSuccess, setGithubSuccess] = useState(null);
    const [showGithubForm, setShowGithubForm] = useState(false);
    const [githubRepoUrl, setGithubRepoUrl] = useState('');
    const [createNewRepo, setCreateNewRepo] = useState(false);
    const [newRepoName, setNewRepoName] = useState('');

    useEffect(() => {
        if (appId || projectName) {
            loadDeploymentStatus();
        }
        
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appId, projectName]);

    const loadDeploymentStatus = async () => {
        try {
            const params = {};
            if (appId) params.app_id = appId;
            else if (projectName) params.project_name = projectName;

            const response = await api.get('/deployment/status', { params });
            const data = response.data;
            if (data.deployment_status !== 'not_deployed') {
                setDeployment(data);
                if (data.deployment_status === 'deploying') {
                    startPolling();
                }
            }
        } catch (err) {
            console.error('Error loading deployment status:', err);
        }
    };

    const startPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }

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
        if (!projectName) {
            setError('Missing required information for deployment');
            return;
        }

        setIsDeploying(true);
        setError(null);

        try {
            const response = await api.post('/deployment/deploy', {
                app_id: appId || null,
                project_name: projectName,
            });

            if (response.status === 200) {
                startPolling();
            } else {
                setError(response.data?.detail || 'Deployment failed');
                setIsDeploying(false);
            }
        } catch (err) {
            setError(err.response?.data?.detail || `Deployment error: ${err.message}`);
            setIsDeploying(false);
        }
    };

    const handleRedeploy = async () => {
        if (!projectName) {
            setError('Missing required information for redeployment');
            return;
        }

        setIsDeploying(true);
        setError(null);

        try {
            const response = await api.post('/deployment/redeploy', {
                app_id: appId || null,
                project_name: projectName,
            });

            if (response.status === 200) {
                startPolling();
            } else {
                setError(response.data?.detail || 'Redeployment failed');
                setIsDeploying(false);
            }
        } catch (err) {
            setError(err.response?.data?.detail || `Redeployment error: ${err.message}`);
            setIsDeploying(false);
        }
    };

    const handlePushToGithub = async () => {
        if (!projectName) {
            setGithubError('Missing project name');
            return;
        }

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
            const response = await api.post('/github/push', {
                project_name: projectName,
                repo_url: createNewRepo ? null : githubRepoUrl,
                create_repo: createNewRepo,
                repo_name: createNewRepo ? newRepoName : null,
                branch: 'main',
                commit_message: 'Deploy from Akkio App Builder'
            });

            const data = response.data;
            setGithubSuccess(`Successfully pushed to GitHub: ${data.repo_url}`);
            setShowGithubForm(false);
            setGithubRepoUrl('');
            setNewRepoName('');
        } catch (err) {
            setGithubError(err.response?.data?.detail || `GitHub push error: ${err.message}`);
        } finally {
            setIsPushingToGithub(false);
        }
    };

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

            {!projectName && (
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
                </div>
            )}

            {error && (
                <div className="deployment-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

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
                        disabled={isDeploying || !projectName}
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
                    {!projectName && (
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
