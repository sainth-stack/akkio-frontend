import React from 'react';
import PlanView from './PlanView';
import FileExplorer from './FileExplorer';
import AgentsView from './AgentsView';
import LogsView from './LogsView';
import AppView from './AppView';
import DeploymentView from './DeploymentView';
import TestView from './TestView';
import Spinner from 'react-bootstrap/Spinner';

const TabPanel = ({
    plan,
    prd,
    fileTree,
    files,
    activeTab,
    onTabChange,
    onRun,
    useSandboxBuild,
    onUseSandboxBuildChange,
    projectName,
    agents,
    logs,
    runState,
    appRefreshKey,
    onLoadFile,
    onSaveFile,
    currentPhase,
    onCreateAgents,
    onStartCodegen,
    onRestartCodegen,
    onRegeneratePrd,
    onRegeneratePlan,
    onRegenerateAgents,
    isLoading,
    isCodegenLoading,
    isRunLoading,
    activeBuildTab,
    onBuildTabChange,
    // New Props for Manual Flow
    generatedUIUX,
    generatedArchitecture,
    onGenerateUIUX,
    onGenerateArch,
    onGeneratePlan,
    streamingArchitectureText,
    onStopPlanning,
    onStopCodegen,
    onDownloadCode,
    // Deployment Props
    appId,
    userEmail,
    apiBase, // Needed for TestView
    isTreeLoading
}) => {
    const tabs = ['Plan', 'Build', 'Deploy'];
    const resolvedBuildTab = activeBuildTab || 'Multi Agents';
    const setResolvedBuildTab = onBuildTabChange || (() => { });

    const renderBuildContent = () => {
        const buildTabs = ['Multi Agents', 'Code', 'Build', 'Test'];

        const renderSubContent = () => {
            switch (resolvedBuildTab) {
                case 'Multi Agents':
                    return (
                        <AgentsView
                            agents={agents}
                            onRegenerate={onRegenerateAgents}
                            isLoading={isLoading}
                        />
                    );
                case 'Code':
                    return (
                        <FileExplorer
                            tree={fileTree}
                            files={files}
                            projectName={projectName}
                            onLoadFile={onLoadFile}
                            onSaveFile={onSaveFile}
                            isTreeLoading={isTreeLoading}
                        />
                    );
                case 'Build': // App View
                    return (
                        <AppView
                            projectName={projectName}
                            runState={runState}
                            isRunLoading={isRunLoading}
                            logs={logs}
                            appRefreshKey={appRefreshKey}
                        />
                    );
                case 'Test':
                    return (
                        <TestView
                            projectName={projectName}
                            apiBase={apiBase || (window.location.protocol + '//' + window.location.hostname + ':5001/api')}
                        />
                    );
                default:
                    return null;
            }
        };

        return (
            <div className="build-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="sub-tabs" style={{
                    display: 'flex',
                    borderBottom: '1px solid #eee',
                    padding: '0 20px',
                    backgroundColor: '#fff'
                }}>
                    {buildTabs.map(tab => (
                        <div
                            key={tab}
                            onClick={() => setResolvedBuildTab(tab)}
                            style={{
                                padding: '12px 20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: resolvedBuildTab === tab ? '600' : 'normal',
                                color: resolvedBuildTab === tab ? '#007bff' : '#666',
                                borderBottom: resolvedBuildTab === tab ? '2px solid #007bff' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab === 'Build' ? 'App View' : tab}
                        </div>
                    ))}
                </div>
                <div className="sub-content" style={{ flex: 1, overflow: 'hidden' }}>
                    {renderSubContent()}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Plan':
                return <PlanView
                    plan={plan}
                    prd={prd}
                    generatedUIUX={generatedUIUX}
                    generatedArchitecture={generatedArchitecture}
                    onGenerateUIUX={onGenerateUIUX}
                    onGenerateArch={onGenerateArch}
                    onGeneratePlan={onGeneratePlan}
                    onRegeneratePrd={onRegeneratePrd}
                    onRegeneratePlan={onRegeneratePlan}
                    isLoading={isLoading}
                    streamingArchitectureText={streamingArchitectureText}
                    onStop={onStopPlanning}
                />;
            case 'Build':
                return renderBuildContent();
            case 'Deploy':
                return (
                    <DeploymentView
                        projectName={projectName}
                        appId={appId}
                        userEmail={userEmail}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="content-section">
            <div className="tabs-header">
                <div className="tabs-left">
                    {tabs.map(tab => (
                        <div
                            key={tab}
                            className={`tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => onTabChange(tab)}
                        >
                            {tab}
                        </div>
                    ))}
                </div>
                <div className="tabs-actions">
                    {/* Common actions can go here */}
                    {currentPhase === 'prd_complete' && activeTab === 'Plan' && (
                        <button
                            className="run-button"
                            onClick={onCreateAgents}
                            disabled={isLoading}
                            style={{
                                backgroundColor: '#28a745',
                                padding: '8px 20px',
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            {isLoading ? 'Creating...' : 'Create Agents'}
                        </button>
                    )}

                    {/* Show Run button in Build tab */}
                    {activeTab === 'Build' && (
                        <>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 12,
                                    color: '#475569',
                                    marginRight: 8,
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }}
                                title="Runs npm install and npm run build in an E2B cloud sandbox (set E2B_API_KEY on the API server)"
                            >
                                <input
                                    type="checkbox"
                                    checked={!!useSandboxBuild}
                                    onChange={(e) => onUseSandboxBuildChange && onUseSandboxBuildChange(e.target.checked)}
                                />
                                E2B sandbox
                            </label>
                            <button
                                className="download-button"
                                onClick={onDownloadCode}
                                disabled={!projectName}
                                style={{
                                    padding: '8px 20px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    backgroundColor: '#17a2b8',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    opacity: !projectName ? 0.7 : 1
                                }}
                            >
                                Download Code
                            </button>
                            <button
                                className="run-button"
                                onClick={onRun}
                                disabled={!projectName || isRunLoading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 20px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    opacity: isRunLoading ? 0.7 : 1,
                                    backgroundColor: '#007bff',
                                    marginLeft: '10px'
                                }}
                            >
                                {isRunLoading && <Spinner animation="border" size="sm" />}
                                {isRunLoading ? 'Starting...' : 'Run App'}
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="tab-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default TabPanel;
