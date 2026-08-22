import React from 'react';

const AgentsView = ({
    agents,
    onRegenerate,
    isLoading
}) => {
    const entries = Object.entries(agents || {});

    if (!entries.length) {
        return (
            <div style={{ padding: 40, color: '#666', textAlign: 'center' }}>
                <h3>Agent Execution</h3>
                <p>No agent activity yet. Click &quot;Generate Code&quot; to start code generation.</p>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'running':
                return '#007bff';
            case 'complete':
                return '#28a745';
            case 'error':
                return '#dc3545';
            case 'stopped':
                return '#6b7280';
            default:
                return '#6c757d';
        }
    };

    const formatDuration = (started, completed) => {
        if (!started) return '';
        if (!completed) return 'In progress...';
        const duration = (completed - started) / 1000;
        return `Completed in ${duration.toFixed(1)}s`;
    };

    const formatAgentName = (name) => {
        const mapping = {
            'planning_agent_step1_req': 'Planning Agent (Requirements)',
            'planning_agent_step2_plan': 'Planning Agent (Plan)',
            'planning_agent_step3_arch': 'Planning Agent (Architecture)',
            'requirement_agent': 'Requirement Agent',
            'structuring_agent': 'Structuring Agent',
            'architecture_agent': 'Architecture Agent',
            'contract_agent': 'Contract Agent',
            'schema_agent': 'Schema Agent',
            'code_generator_agent': 'Code Generation Agent',
            'coding_agent': 'Coding Agent',
            'validation_agent': 'Validation Agent',
            'runner_agent': 'Execution Agent',
            'update_code_agent': 'Code Update Agent'
        };
        if (mapping[name]) return mapping[name];

        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="agents-view" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fafafa'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e0e0e0',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Agent Execution Pipeline</h2>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Real-time agent execution status
                    </p>
                </div>
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        disabled={isLoading}
                        style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#dc3545',
                            backgroundColor: 'white',
                            border: '1px solid #dc3545',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Restarting...' : 'Restart Agents'}
                    </button>
                )}
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px'
            }}>
                <div className="agents-timeline" style={{ position: 'relative', maxWidth: '900px', margin: '0 auto' }}>
                    {entries.map(([name, info], index) => {
                        const status = info?.status || 'pending';
                        const isLast = index === entries.length - 1;

                        return (
                            <div key={name} style={{ position: 'relative', paddingLeft: '48px', paddingBottom: '28px' }}>
                                {/* Timeline line */}
                                {!isLast && (
                                    <div style={{
                                        position: 'absolute',
                                        left: '19px',
                                        top: '40px',
                                        bottom: '0',
                                        width: '2px',
                                        backgroundColor: '#d0d0d0'
                                    }} />
                                )}

                                {/* Timeline dot */}
                                <div style={{
                                    position: 'absolute',
                                    left: '0',
                                    top: '12px',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    border: `3px solid ${getStatusColor(status)}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: getStatusColor(status),
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    <span style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: getStatusColor(status),
                                        display: 'inline-block'
                                    }} />
                                </div>

                                {/* Agent card */}
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    borderLeft: `4px solid ${getStatusColor(status)}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, color: '#333', fontSize: '16px', fontWeight: '600' }}>
                                            {formatAgentName(name)}
                                        </h4>
                                        <span style={{
                                            fontSize: '11px',
                                            padding: '5px 14px',
                                            borderRadius: '16px',
                                            backgroundColor: getStatusColor(status),
                                            color: 'white',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {status}
                                        </span>
                                    </div>

                                    {/* Streaming progress log */}
                                    {info?.progress && info.progress.length > 0 && (
                                        <div style={{
                                            marginBottom: '12px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            fontSize: '13px',
                                            fontFamily: 'Monaco, Consolas, monospace',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            {(info?.progress || []).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: '6px 0',
                                                        color: item.type === 'complete' ? '#28a745' :
                                                            item.type === 'start' ? '#007bff' : '#555',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        borderBottom: idx < info.progress.length - 1 ? '1px solid #eee' : 'none',
                                                        animation: idx === info.progress.length - 1 ? 'slideInProgress 0.3s ease-out' : 'none'
                                                    }}
                                                >
                                                    <span style={{
                                                        marginRight: '8px',
                                                        fontSize: '10px',
                                                        color: '#999',
                                                        minWidth: '45px',
                                                        flexShrink: 0
                                                    }}>
                                                        {new Date(item.timestamp).toLocaleTimeString('en-US', {
                                                            hour12: false,
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        })}
                                                    </span>
                                                    <span style={{
                                                        marginRight: '8px',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        color: '#64748b',
                                                        minWidth: '48px'
                                                    }}>
                                                        {item.type === 'start' ? 'Start' :
                                                            item.type === 'complete' ? 'Done' :
                                                                item.type === 'stopped' ? 'Stopped' : 'Update'}
                                                    </span>
                                                    <span style={{ flex: 1, lineHeight: '1.5' }}>{item.text}</span>
                                                </div>
                                            ))}

                                            {/* Show loading indicator if running */}
                                            {status === 'running' && (
                                                <div style={{
                                                    padding: '8px 0',
                                                    color: '#007bff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontSize: '12px'
                                                }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#007bff',
                                                        marginRight: '8px',
                                                        animation: 'pulse 1.5s ease-in-out infinite'
                                                    }} />
                                                    Processing...
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {info?.error && (
                                        <div style={{
                                            backgroundColor: '#fff3cd',
                                            border: '1px solid #ffc107',
                                            color: '#856404',
                                            padding: '12px',
                                            borderRadius: '6px',
                                            marginTop: '12px',
                                            fontSize: '13px'
                                        }}>
                                            <strong>Error:</strong> {info.error}
                                        </div>
                                    )}

                                    {info?.data && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '14px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            border: '1px solid #e9ecef',
                                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <strong style={{ color: '#495057' }}>Output Result:</strong>
                                                <span style={{ fontSize: '11px', color: '#adb5bd' }}>
                                                    {typeof info.data === 'object' ? 'Structured Data' : 'Text'}
                                                </span>
                                            </div>

                                            <div style={{
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                backgroundColor: '#fff',
                                                padding: '10px',
                                                borderRadius: '4px',
                                                border: '1px solid #dee2e6'
                                            }}>
                                                {(() => {
                                                    const data = info.data;

                                                    // Special handling for coding agent files
                                                    if (data.generated_files) {
                                                        const fileNames = Object.keys(data.generated_files);
                                                        return (
                                                            <div>
                                                                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#28a745' }}>
                                                                    ✓ {fileNames.length} files generated successfully
                                                                </div>
                                                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#666' }}>
                                                                    {fileNames.map(f => <li key={f}>{f}</li>)}
                                                                </ul>
                                                            </div>
                                                        );
                                                    }

                                                    // Special handling for db_schema
                                                    if (data.db_schema?.schema) {
                                                        return (
                                                            <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px' }}>
                                                                {data.db_schema.schema}
                                                            </div>
                                                        );
                                                    }

                                                    // Fallback to JSON or string
                                                    return (
                                                        <pre style={{
                                                            margin: 0,
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                            fontSize: '12px',
                                                            color: '#333',
                                                            fontFamily: 'Monaco, Consolas, monospace'
                                                        }}>
                                                            {typeof data === 'string'
                                                                ? data
                                                                : JSON.stringify(data, null, 2)
                                                            }
                                                        </pre>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {(info?.started_at || info?.completed_at) && (
                                        <div style={{
                                            marginTop: '12px',
                                            fontSize: '12px',
                                            color: '#888',
                                            fontStyle: 'italic'
                                        }}>
                                            {formatDuration(info.started_at, info.completed_at)}
                                        </div>
                                    )}

                                </div>
                            </div>
                        );
                    })}
                </div>

                {entries.every(([_, info]) => info?.status === 'complete') && (
                    <div style={{
                        maxWidth: '900px',
                        margin: '24px auto 0 auto',
                        padding: '18px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '15px',
                        border: '1px solid #c3e6cb'
                    }}>
                        All agents completed successfully! Click "View Generated Code" to continue.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentsView;

