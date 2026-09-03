import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import Spinner from 'react-bootstrap/Spinner';
import {
    IconBadge,
    IoRocketOutline,
    IoCloudUploadOutline,
    IoGitBranchOutline,
    IoGlobeOutline,
} from './AppBuilderIcons';
import './DeploymentView.css';

/** Resolve public API base — env first, then same host as browser (Hostinger), then localhost. */
const getPublicApiBase = () => {
    const fromEnv = (import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '');
    if (fromEnv && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(fromEnv)) {
        return fromEnv;
    }
    if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            const apiPort = import.meta.env.VITE_API_PORT || '8000';
            return `${protocol}//${hostname}:${apiPort}`;
        }
    }
    return fromEnv || 'http://localhost:8000';
};

const PUBLIC_API_BASE = getPublicApiBase();

/** Build canonical app URL from project name (never localhost when on public host). */
const resolveAppUrl = (projectName, storedUrl) => {
    if (projectName) {
        return `${PUBLIC_API_BASE}/app/${projectName}`;
    }
    return normalizePublicUrl(storedUrl);
};

const resolveBackendUrl = (projectName, storedUrl) => {
    if (projectName) {
        return `${PUBLIC_API_BASE}/api/apps/${projectName}`;
    }
    return normalizePublicUrl(storedUrl);
};

/** Replace localhost URLs when a public base is configured. */
const normalizePublicUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (PUBLIC_API_BASE.includes('localhost') || PUBLIC_API_BASE.includes('127.0.0.1')) {
        return url;
    }
    return url
        .replace(/^https?:\/\/localhost:\d+/i, PUBLIC_API_BASE)
        .replace(/^https?:\/\/127\.0\.0\.1:\d+/i, PUBLIC_API_BASE);
};

const normalizeDeployLog = (log) => {
    if (!log) return log;
    if (PUBLIC_API_BASE.includes('localhost') || PUBLIC_API_BASE.includes('127.0.0.1')) return log;
    return log
        .replace(/https?:\/\/localhost:\d+/gi, PUBLIC_API_BASE)
        .replace(/https?:\/\/127\.0\.0\.1:\d+/gi, PUBLIC_API_BASE);
};

const DEPLOY_STEPS = [
    { key: 'QUEUED', label: 'Queued' },
    { key: 'BUILDING', label: 'Building' },
    { key: 'TESTING', label: 'Testing' },
    { key: 'DEPLOYING', label: 'Deploying' },
    { key: 'RUNNING', label: 'Live' },
];

const IN_PROGRESS = new Set(['QUEUED', 'BUILDING', 'TESTING', 'DEPLOYING', 'deploying']);
const TERMINAL = new Set(['RUNNING', 'FAILED', 'deployed', 'failed', 'LOCAL_PREVIEW']);

const DeploymentView = ({ projectName, appId }) => {
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployment, setDeployment] = useState(null);
    const [deploymentHistory, setDeploymentHistory] = useState([]);
    const [buildStatus, setBuildStatus] = useState(null);
    const [error, setError] = useState(null);
    const pollRef = useRef(null);
    const activeDeploymentIdRef = useRef(null);

    const [isPushingToGithub, setIsPushingToGithub] = useState(false);
    const [githubError, setGithubError] = useState(null);
    const [githubSuccess, setGithubSuccess] = useState(null);
    const [showGithubForm, setShowGithubForm] = useState(false);
    const [githubRepoUrl, setGithubRepoUrl] = useState('');
    const [newRepoName, setNewRepoName] = useState('');
    const [createNewRepo, setCreateNewRepo] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 6000);
    };

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const loadDeploymentHistory = useCallback(async () => {
        if (!appId) return;
        try {
            const response = await api.get('/deployment/history', { params: { app_id: appId, limit: 10 } });
            if (response.data?.deployments) {
                setDeploymentHistory(response.data.deployments);
            }
        } catch (err) {
            console.error('Error loading deployment history:', err);
        }
    }, [appId]);

    const loadDeploymentStatus = useCallback(async () => {
        try {
            const params = {};
            if (activeDeploymentIdRef.current) {
                params.deployment_id = activeDeploymentIdRef.current;
            } else if (appId) {
                params.app_id = appId;
            } else if (projectName) {
                params.project_name = projectName;
            }

            const response = await api.get('/deployment/status', { params });
            const data = response.data;

            if (data.build_status) setBuildStatus(data.build_status);

            if (data.deployment_status === 'not_deployed') {
                setDeployment(null);
                return data;
            }

            setDeployment(data);

            const status = data.deployment_status;
            const trackingActive = activeDeploymentIdRef.current
                ? String(data.deployment_id) === String(activeDeploymentIdRef.current)
                : true;

            if (TERMINAL.has(status) && trackingActive) {
                stopPolling();
                setIsDeploying(false);
                activeDeploymentIdRef.current = null;
                loadDeploymentHistory();
                if (status === 'RUNNING') {
                    showToast('Deployment complete — your app is live!', 'success');
                }
            } else if (IN_PROGRESS.has(status) && trackingActive) {
                setIsDeploying(true);
            }

            return data;
        } catch (err) {
            console.error('Error loading deployment status:', err);
            const msg = err.response?.data?.detail || err.message || 'Failed to load deployment status';
            setError(msg);
            showToast(msg, 'error');
            return null;
        }
    }, [appId, projectName, stopPolling, loadDeploymentHistory]);

    const startPolling = useCallback(() => {
        stopPolling();
        pollRef.current = setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadDeploymentStatus();
            }
        }, 2000);
    }, [loadDeploymentStatus, stopPolling]);

    useEffect(() => {
        if (appId || projectName) {
            loadDeploymentStatus().then((data) => {
                if (data && IN_PROGRESS.has(data.deployment_status)) {
                    if (data.deployment_id) {
                        activeDeploymentIdRef.current = String(data.deployment_id);
                    }
                    startPolling();
                }
            });
            loadDeploymentHistory();
        }
        return () => stopPolling();
    }, [appId, projectName, loadDeploymentStatus, loadDeploymentHistory, startPolling, stopPolling]);

    const handleDeploy = async (rebuild = false) => {
        if (!projectName) {
            setError('Missing required information for deployment');
            return;
        }

        setIsDeploying(true);
        setError(null);
        setDeployment((prev) => ({
            ...(prev || {}),
            project_name: projectName,
            deployment_status: 'QUEUED',
            deploy_log: 'Starting deployment...\nDeploy queued',
        }));

        try {
            const response = await api.post('/deployment/deploy', {
                app_id: appId || null,
                project_name: projectName,
                rebuild,
            });
            const deploymentId = response.data?.deployment_id;
            if (deploymentId) {
                activeDeploymentIdRef.current = String(deploymentId);
            }

            await loadDeploymentStatus();
            startPolling();
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
        setDeployment((prev) => ({
            ...(prev || {}),
            project_name: projectName,
            deployment_status: 'QUEUED',
            deploy_log: 'Starting redeploy (rebuild)...\nDeploy queued',
        }));

        try {
            const response = await api.post('/deployment/redeploy', {
                app_id: appId || null,
                project_name: projectName,
            });
            const deploymentId = response.data?.deployment_id;
            if (deploymentId) {
                activeDeploymentIdRef.current = String(deploymentId);
            }

            await loadDeploymentStatus();
            startPolling();
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

    const normalizeStatus = (status) => {
        if (status === 'LOCAL_PREVIEW') return 'LOCAL_PREVIEW';
        if (status === 'deployed') return 'RUNNING';
        if (status === 'failed') return 'FAILED';
        if (status === 'deploying') return 'DEPLOYING';
        return status;
    };

    const getStatusBadge = (status) => {
        const normalized = normalizeStatus(status);
        const badges = {
            QUEUED: { color: '#6c757d', text: 'Queued' },
            BUILDING: { color: '#fd7e14', text: 'Building' },
            TESTING: { color: '#17a2b8', text: 'Testing' },
            DEPLOYING: { color: '#ffc107', text: 'Deploying' },
            RUNNING: { color: '#28a745', text: 'Live' },
            LOCAL_PREVIEW: { color: '#0ea5e9', text: 'Preview' },
            FAILED: { color: '#dc3545', text: 'Failed' },
            pending: { color: '#6c757d', text: 'Pending' },
        };

        const badge = badges[normalized] || badges.pending;

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

    const liveUrl = resolveAppUrl(
        deployment?.project_name || projectName,
        deployment?.live_url || deployment?.frontend_url || deployment?.preview_url
    );
    const backendUrl = resolveBackendUrl(
        deployment?.project_name || projectName,
        deployment?.backend_url
    );
    const displayStatus = deployment ? normalizeStatus(deployment.deployment_status) : null;
    const isLocalPreview = deployment?.deployment_status === 'LOCAL_PREVIEW' || deployment?.mode === 'local';
    const showProgress = isDeploying || (displayStatus && IN_PROGRESS.has(displayStatus));
    const isLive = displayStatus === 'RUNNING';
    const isFailed = displayStatus === 'FAILED';

    const activeStepIndex = (() => {
        if (!displayStatus) return isDeploying ? 0 : -1;
        const idx = DEPLOY_STEPS.findIndex((s) => s.key === displayStatus);
        if (idx >= 0) return idx;
        if (isDeploying) return 0;
        return -1;
    })();

    const renderDeployStepper = () => (
        <div className="deployment-stepper">
            {DEPLOY_STEPS.map((step, idx) => {
                const isDone = isLive || activeStepIndex > idx;
                const isActive = !isLive && activeStepIndex === idx && showProgress;
                return (
                    <div
                        key={step.key}
                        className={`deployment-step ${isDone ? 'deployment-step--done' : ''} ${isActive ? 'deployment-step--active' : ''}`}
                    >
                        <div className="deployment-step-dot">
                            {isDone && !isActive ? '✓' : isActive ? <Spinner animation="border" size="sm" /> : idx + 1}
                        </div>
                        <span className="deployment-step-label">{step.label}</span>
                    </div>
                );
            })}
        </div>
    );

    const renderUrlCard = (label, url, icon = null) => (
        <div className="url-card">
            <div className="url-label">
                {icon}
                <strong>{label}</strong>
            </div>
            <div className="url-content">
                <a href={url} target="_blank" rel="noopener noreferrer" className="url-link">
                    {url}
                </a>
                <button
                    type="button"
                    className="btn-copy"
                    onClick={() => {
                        navigator.clipboard.writeText(url);
                        showToast('Copied to clipboard', 'success');
                    }}
                >
                    Copy
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn-open-live">
                    Open
                </a>
            </div>
        </div>
    );

    return (
        <div className="deployment-view">
            <div className="deployment-header">
                <div className="deployment-header-title">
                    <IconBadge icon={IoRocketOutline} variant="indigo" size={18} />
                    <div>
                        <h3>Deployment</h3>
                        <p>
                            {showProgress
                                ? 'Publishing your app — this may take a minute...'
                                : isLive
                                    ? 'Your app is live and ready to share'
                                    : isLocalPreview
                                        ? 'Build succeeded — deploy to get your public URL'
                                        : 'Deploy your generated app and get a live URL'}
                        </p>
                    </div>
                </div>
            </div>

            {toast && (
                <div style={{
                    marginBottom: 16,
                    padding: '12px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    backgroundColor: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
                    border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                    color: toast.type === 'error' ? '#991b1b' : '#166534',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span>{toast.message}</span>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                    >
                        ×
                    </button>
                </div>
            )}

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

            {deployment?.build_status && deployment.build_status !== 'BUILD_SUCCESS' && !isLive && (
                <div style={{
                    padding: '12px',
                    background: '#fff7ed',
                    border: '1px solid #fdba74',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#9a3412',
                }}>
                    Run the app in the <strong>Build</strong> tab first (build must succeed), or redeploy with rebuild.
                </div>
            )}

            {error && (
                <div className="deployment-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {deploymentHistory.length > 1 && (
                <div style={{ marginBottom: 24, padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Deployment History</h4>
                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: '#64748b' }}>
                                <th style={{ padding: '8px 4px' }}>Date</th>
                                <th style={{ padding: '8px 4px' }}>Status</th>
                                <th style={{ padding: '8px 4px' }}>URL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deploymentHistory.map((d) => (
                                <tr key={d.deployment_id || d.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 4px' }}>{d.deployed_at ? new Date(d.deployed_at).toLocaleString() : '—'}</td>
                                    <td style={{ padding: '8px 4px' }}>{getStatusBadge(d.deployment_status)}</td>
                                    <td style={{ padding: '8px 4px', wordBreak: 'break-all' }}>
                                        {resolveAppUrl(d.project_name, d.live_url || d.frontend_url) || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="github-section" style={{
                marginTop: '24px',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }}>
                <h4 className="github-section-title">
                    <IoGitBranchOutline size={18} />
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
                        <IoGitBranchOutline size={16} />
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

            {!deployment ? (
                <div className="deployment-empty">
                    <IconBadge icon={IoCloudUploadOutline} variant="slate" size={24} className="deployment-empty-icon" />
                    <h4>Ready to Deploy</h4>
                    <p>
                        {buildStatus === 'BUILD_SUCCESS'
                            ? 'Build succeeded. Click Deploy to publish your live URL.'
                            : <>Run the app in the <strong>Build</strong> tab first, then deploy at <code>{resolveAppUrl(projectName)}</code></>}
                    </p>
                    <button
                        className="btn-deploy"
                        onClick={() => handleDeploy(false)}
                        disabled={isDeploying || !projectName}
                    >
                        {isDeploying ? (
                            <>
                                <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} />
                                Deploying...
                            </>
                        ) : (
                            <>
                                <IoCloudUploadOutline size={16} />
                                Deploy to Hostinger
                            </>
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

                    {showProgress && renderDeployStepper()}

                    {showProgress && (
                        <div className="deployment-progress">
                            <Spinner animation="border" size="sm" />
                            <span>
                                {displayStatus === 'QUEUED' && 'Waiting to start deployment...'}
                                {displayStatus === 'BUILDING' && 'Building frontend (npm install + build)...'}
                                {displayStatus === 'TESTING' && 'Running backend tests...'}
                                {displayStatus === 'DEPLOYING' && 'Running health check and registering live URL...'}
                                {!displayStatus && isDeploying && 'Starting deployment...'}
                            </span>
                        </div>
                    )}

                    {isLive && liveUrl && (
                        <div className="deployment-success-banner">
                            <IoGlobeOutline size={20} />
                            <span>Deployment successful — your app is live</span>
                        </div>
                    )}

                    {isLocalPreview && !showProgress && liveUrl && (
                        <div className="deployment-preview-panel">
                            <p className="deployment-preview-note">
                                Preview is ready. Click <strong>Deploy</strong> below to publish the public URL
                                {PUBLIC_API_BASE.includes('localhost') ? ' (set VITE_BASE_URL to your server IP for production links)' : ''}.
                            </p>
                            {renderUrlCard('Preview URL', liveUrl, <IoGlobeOutline size={16} />)}
                            <button
                                type="button"
                                className="btn-deploy"
                                onClick={() => handleDeploy(false)}
                                disabled={isDeploying || !projectName}
                                style={{ marginTop: 16 }}
                            >
                                {isDeploying ? (
                                    <>
                                        <Spinner animation="border" size="sm" style={{ marginRight: 8 }} />
                                        Deploying...
                                    </>
                                ) : (
                                    <>
                                        <IoCloudUploadOutline size={16} />
                                        Deploy to Live URL
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {deployment.deploy_log && (showProgress || isLive || isFailed || isLocalPreview) && (
                        <div style={{ marginTop: 16 }}>
                            <strong style={{ fontSize: 13 }}>Deploy log</strong>
                            <pre style={{
                                marginTop: 8,
                                background: '#1e1e1e',
                                color: '#d4d4d4',
                                padding: 12,
                                borderRadius: 6,
                                fontSize: 12,
                                maxHeight: 240,
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap',
                            }}>
                                {normalizeDeployLog(deployment.deploy_log)}
                            </pre>
                        </div>
                    )}

                    {isLive && liveUrl && (
                        <>
                            <div className="deployment-urls">
                                {renderUrlCard('Live URL', liveUrl, <IoGlobeOutline size={16} />)}
                                {backendUrl && renderUrlCard('Backend API', backendUrl)}
                            </div>

                            <div className="deployment-actions">
                                <button
                                    className="btn-redeploy"
                                    onClick={handleRedeploy}
                                    disabled={isDeploying}
                                >
                                    {isDeploying ? 'Redeploying...' : 'Redeploy (rebuild)'}
                                </button>
                            </div>
                        </>
                    )}

                    {isFailed && (
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
                                    onClick={() => handleDeploy(true)}
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
