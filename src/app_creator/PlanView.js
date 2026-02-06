import React, { useState, useEffect } from 'react';

const PlanView = ({
    plan,
    prd,
    generatedUIUX,
    generatedArchitecture,
    onGenerateUIUX,
    onGenerateArch,
    onGeneratePlan,
    onRegeneratePrd,
    onRegeneratePlan,
    isLoading,
    streamingArchitectureText, // New prop
    onStop // New prop
}) => {
    const [activeSection, setActiveSection] = useState('prd');

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#f8f9fa',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        },
        tabHeader: {
            display: 'flex',
            backgroundColor: '#fff',
            borderBottom: '1px solid #eaeaea',
            padding: '0 16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            zIndex: 10
        },
        tabItem: (isActive) => ({
            padding: '16px 20px',
            cursor: 'pointer',
            borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
            color: isActive ? '#2563eb' : '#64748b',
            fontWeight: isActive ? 600 : 500,
            fontSize: '14px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }),
        contentArea: {
            flex: 1,
            overflowY: 'auto',
            padding: '8px 16px 16px 16px',
            maxWidth: '100%',
            margin: '0',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
        },
        card: {
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            padding: '20px 24px 24px 24px',
            marginBottom: '10px',
            border: '1px solid #f1f5f9',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
        },
        buttonPrimary: {
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
        },
        buttonSecondary: {
            padding: '8px 16px',
            backgroundColor: '#fff',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        sectionTitle: {
            fontSize: '24px',
            fontWeight: 700,
            color: '#1e293b',
            marginTop: 0,
            marginBottom: '20px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        markdown: {
            color: '#334155',
            lineHeight: 1.7,
            fontSize: '15px'
        },
        terminal: {
            backgroundColor: '#1e293b',
            color: '#e2e8f0',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            marginBottom: '20px',
            border: '1px solid #334155'
        },
        techCard: {
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            ':hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
        },
        badge: {
            display: 'inline-block',
            padding: '4px 10px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: 600,
            marginRight: '8px',
            marginBottom: '8px'
        }
    };

    const sections = [
        { id: 'prd', label: '1. Product Requirements' },
        { id: 'uiux', label: '2. UI/UX Design' },
        { id: 'arch', label: '3. Architecture' }
    ];

    const renderMarkdown = (text) => {
        if (!text) return null;
        return (
            <div style={styles.markdown}>
                {text.split('\n').map((line, i) => {
                    const cleanLine = line.trim();
                    if (cleanLine.startsWith('# '))
                        return <h1 key={i} style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '32px', marginBottom: '16px' }}>{cleanLine.replace('# ', '')}</h1>;
                    if (cleanLine.startsWith('## '))
                        return <h2 key={i} style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginTop: '24px', marginBottom: '12px' }}>{cleanLine.replace('## ', '')}</h2>;
                    if (cleanLine.startsWith('### '))
                        return <h3 key={i} style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginTop: '20px', marginBottom: '10px' }}>{cleanLine.replace('### ', '')}</h3>;
                    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* '))
                        return <li key={i} style={{ marginLeft: '20px', marginBottom: '8px', listStyleType: 'disc' }}>{cleanLine.replace(/^[-*]\s/, '')}</li>;
                    if (cleanLine.match(/^\d+\./))
                        return <div key={i} style={{ marginBottom: '8px', fontWeight: 500 }}>{cleanLine}</div>;
                    if (cleanLine === '') return <br key={i} />;
                    return <p key={i} style={{ marginBottom: '12px' }}>{line}</p>;
                })}
            </div>
        );
    };

    const LoadingState = ({ text }) => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            textAlign: 'center',
            color: '#64748b',
            minHeight: '200px'
        }}>
            <div className="spinner" style={{
                width: '40px', height: '40px', border: '3px solid #e2e8f0',
                borderTop: '3px solid #2563eb', borderRadius: '50%',
                margin: '0 auto 20px', animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '20px' }}>{text}</p>
            {onStop && (
                <button
                    onClick={onStop}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#fff',
                        color: '#ef4444',
                        border: '1px solid #fee2e2',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                >
                    Stop Generating
                </button>
            )}
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const EmptyState = ({ message, action, actionText }) => (
        <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{ fontSize: '36px', marginBottom: '16px', opacity: 0.5, fontWeight: 600 }}>Start</div>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>{message}</p>
            {action && (
                <button
                    onClick={action}
                    disabled={isLoading}
                    style={styles.buttonPrimary}
                >
                    {actionText}
                </button>
            )}
        </div>
    );

    const RegenerateButton = ({ onClick, label = "Regenerate" }) => (
        <button
            onClick={onClick}
            disabled={isLoading}
            style={styles.buttonSecondary}
            title={label}
        >
            {label}
        </button>
    );

    const NextStepButton = ({ onClick, label }) => (
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
            <button
                onClick={onClick}
                style={styles.buttonPrimary}
            >
                {label}
            </button>
        </div>
    );

    const renderPRD = () => (
        <div style={styles.card}>
            <div style={styles.sectionTitle}>
                <span>Product Requirements Document</span>
                {prd && !isLoading && <RegenerateButton onClick={onRegeneratePrd} label="Regenerate PRD" />}
            </div>

            {prd ? (
                <>
                    {renderMarkdown(prd)}
                    {!isLoading && !generatedUIUX && (
                        <NextStepButton
                            onClick={() => { setActiveSection('uiux'); onGenerateUIUX(); }}
                            label="Next: Generate UI/UX Design"
                        />
                    )}
                </>
            ) : (
                isLoading ?
                    <LoadingState text="Generating comprehensive requirements..." /> :
                    <EmptyState
                        message="Please enter your app requirements in the chat to start."
                    />
            )}
        </div>
    );

    const renderUIUX = () => (
        <div style={styles.card}>
            <div style={styles.sectionTitle}>
                <span>UI/UX Design</span>
                {generatedUIUX && !isLoading && <RegenerateButton onClick={onGenerateUIUX} />}
            </div>

            {generatedUIUX ? (
                <>
                    {renderMarkdown(generatedUIUX)}
                    {!isLoading && !generatedArchitecture && (
                        <NextStepButton
                            onClick={() => { setActiveSection('arch'); onGenerateArch(); }}
                            label="Next: Design Architecture"
                        />
                    )}
                </>
            ) : (
                isLoading && activeSection === 'uiux' ?
                    <LoadingState text="Crafting UI/UX experience..." /> :
                    <EmptyState
                        message="Ready to design the user interface."
                        action={() => onGenerateUIUX()}
                        actionText="Generate UI/UX Design"
                    />
            )}
        </div>
    );

    const renderTechCard = (title, data) => {
        if (!data) return null;
        return (
            <div style={styles.techCard}>
                <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    {title}
                </h4>
                {Object.entries(data).map(([key, value]) => {
                    if (key === 'key_components' || key === 'key_services') return null; // Handle separately if needed
                    return (
                        <div key={key} style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>{key.replace('_', ' ')}</div>
                            <div style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>{value}</div>
                        </div>
                    );
                })}
                {/* Key Components Tags */}
                {(data.key_components || data.key_services) && (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Core Components</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {(data.key_components || data.key_services).map((comp, i) => (
                                <span key={i} style={styles.badge}>{comp}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDatabaseTable = (schema) => (
        <div style={{ marginTop: '32px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b', fontSize: '18px' }}>Database Schema</h4>
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Table Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Columns</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schema.tables.map((table, i) => (
                            <tr key={i} style={{ borderBottom: i === schema.tables.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                                <td style={{ padding: '16px', verticalAlign: 'top', fontWeight: 600, color: '#334155', minWidth: '150px' }}>{table.name}</td>
                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                    {table.columns.map((col, j) => (
                                        <div key={j} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontFamily: 'monospace', color: '#ef4444', fontSize: '13px' }}>{col.name}</span>
                                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{col.type}</span>
                                            {col.primary_key && <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '4px' }}>PK</span>}
                                        </div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderArchitecture = () => (
        <div style={styles.card}>
            <div style={styles.sectionTitle}>
                <span>System Architecture</span>
                {generatedArchitecture && !isLoading && <RegenerateButton onClick={onGenerateArch} />}
            </div>

            {/* Streaming View */}
            {isLoading && streamingArchitectureText && !generatedArchitecture && (
                <div>
                    <div style={{ marginBottom: '10px', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Generative stream active...</div>
                    <div style={styles.terminal}>
                        {streamingArchitectureText}
                        <span style={{ display: 'inline-block', width: '8px', height: '14px', backgroundColor: '#3b82f6', marginLeft: '4px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }}></span>
                        <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
                    </div>
                </div>
            )}

            {generatedArchitecture ? (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        {renderTechCard("Frontend", generatedArchitecture.frontend_structure)}
                        {renderTechCard("Backend", generatedArchitecture.backend_structure)}
                    </div>

                    {generatedArchitecture.database_schema && renderDatabaseTable(generatedArchitecture.database_schema)}

                    {!isLoading && (
                        <div style={{ marginTop: '28px', padding: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '18px' }}>Ready to Build</h3>
                            <p style={{ margin: '0', color: '#166534', fontSize: '14px' }}>Architecture is set. Click <strong>Create Agents</strong> in the header above to start the execution pipeline.</p>
                        </div>
                    )}
                </div>
            ) : (
                !streamingArchitectureText && (
                    isLoading && activeSection === 'arch' ?
                        <LoadingState text="Initializing architecture agent..." /> :
                        <EmptyState
                            message="UI/UX approved. Ready to design architecture."
                            action={() => onGenerateArch()}
                            actionText="Generate Architecture"
                        />
                )
            )}
        </div>
    );

    const renderPlanSteps = () => (
        <div style={styles.card}>
            <div style={styles.sectionTitle}>
                <span>Implementation Roadmap</span>
                {plan && plan.length > 0 && !isLoading && <RegenerateButton onClick={onRegeneratePlan} label="Regenerate Plan" />}
            </div>

            {plan && plan.length > 0 ? (
                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {plan.map((step, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: '40px',
                                    backgroundColor: step.status === 'completed' ? '#dcfce7' : '#f1f5f9',
                                    color: step.status === 'completed' ? '#166534' : '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    borderRight: '1px solid #e2e8f0'
                                }}>
                                    {step.id}
                                </div>
                                <div style={{ padding: '16px', flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1e293b' }}>{step.title}</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{step.description}</p>
                                </div>
                                <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '99px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        backgroundColor: step.status === 'completed' ? '#dcfce7' : '#fef3c7',
                                        color: step.status === 'completed' ? '#166534' : '#92400e',
                                        textTransform: 'uppercase'
                                    }}>
                                        {step.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isLoading && (
                        <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '18px' }}>Ready to Build</h3>
                            <p style={{ margin: '0', color: '#166534', fontSize: '14px' }}>The plan is set. Go to the <strong>Build</strong> tab to start the Multi-Agent coding process.</p>
                        </div>
                    )}
                </div>
            ) : (
                isLoading && activeSection === 'plan' ?
                    <LoadingState text="Drafting detailed implementation plan..." /> :
                    <EmptyState
                        message="Architecture defined. Ready to plan implementation steps."
                        action={() => onGeneratePlan()}
                        actionText="Generate Master Plan"
                    />
            )}
        </div>
    );

    return (
        <div style={styles.container}>
            {/* Tab Header */}
            <div style={styles.tabHeader}>
                {sections.map(s => {
                    const isActive = activeSection === s.id;
                    return (
                        <div
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            style={styles.tabItem(isActive)}
                        >
                            <span style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                backgroundColor: isActive ? '#2563eb' : '#e2e8f0',
                                color: isActive ? '#fff' : '#64748b',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: 'bold'
                            }}>
                                {s.id === 'prd' ? '1' : s.id === 'uiux' ? '2' : '3'}
                            </span>
                            {s.label.replace(/^\d+\.\s/, '')}
                        </div>
                    );
                })}
            </div>

            {/* Content Area */}
            <div style={styles.contentArea}>
                {activeSection === 'prd' && renderPRD()}
                {activeSection === 'uiux' && renderUIUX()}
                {activeSection === 'arch' && renderArchitecture()}
            </div>
        </div>
    );
};

export default PlanView;
