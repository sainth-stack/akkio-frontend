import React, { useState } from 'react';
import {
    IconBadge,
    IoDocumentTextOutline,
    IoColorPaletteOutline,
    IoBrushOutline,
    IoLayersOutline,
    IoStopCircleOutline,
} from './AppBuilderIcons';

const PlanView = ({
    plan,
    prd,
    generatedUIUX,
    generatedArchitecture,
    onGenerateUIUX,
    onGenerateStyle,
    onGenerateArch,
    onGeneratePlan,
    designTokens,
    designSystemMd,
    onRegeneratePrd,
    onRegeneratePlan,
    isLoading,
    streamingArchitectureText,
    onStop,
    pipelineStatus,
    pipelineError,
    onRetryPipeline,
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
        { id: 'prd', label: 'Product Requirements', icon: IoDocumentTextOutline, step: 1 },
        { id: 'uiux', label: 'UI/UX Design', icon: IoColorPaletteOutline, step: 2 },
        { id: 'style', label: 'Design System', icon: IoBrushOutline, step: 3 },
        { id: 'arch', label: 'Architecture', icon: IoLayersOutline, step: 4 },
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
                    <IoStopCircleOutline size={15} />
                    Stop Generating
                </button>
            )}
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const EmptyState = ({ message, action, actionText, icon: EmptyIcon = IoDocumentTextOutline }) => (
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
            <IconBadge icon={EmptyIcon} variant="slate" size={22} className="plan-empty-icon" />
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px', marginTop: '16px' }}>{message}</p>
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

    const FailureBanner = ({ label, onRetry }) => (
        <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
        }}>
            <div style={{ fontSize: 13, color: '#991b1b' }}>
                <strong>{label}</strong>
                {pipelineError && <span style={{ marginLeft: 8 }}>{pipelineError.slice(0, 180)}</span>}
            </div>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
            )}
        </div>
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

    const renderPRD = () => {
        const prdLoading = isLoading || pipelineStatus === 'PRD_RUNNING';

        return (
        <div style={styles.card}>
            {pipelineStatus === 'PRD_FAILED' && (
                <FailureBanner label="PRD generation failed" onRetry={onRetryPipeline} />
            )}
            <div style={styles.sectionTitle}>
                <span>Product Requirements Document</span>
                {prd && !prdLoading && <RegenerateButton onClick={onRegeneratePrd} label="Regenerate PRD" />}
            </div>

            {prd ? (
                <>
                    {renderMarkdown(prd)}
                    {!prdLoading && !generatedUIUX && (
                        <NextStepButton
                            onClick={() => { setActiveSection('uiux'); onGenerateUIUX(); }}
                            label="Next: Generate UI/UX Design"
                        />
                    )}
                    {!prdLoading && generatedUIUX && (
                        <NextStepButton
                            onClick={() => setActiveSection('uiux')}
                            label="Next: Review UI/UX Design"
                        />
                    )}
                </>
            ) : (
                prdLoading ?
                    <LoadingState text="Generating comprehensive requirements..." /> :
                    <EmptyState
                        message="Please enter your app requirements in the chat to start."
                    />
            )}
        </div>
        );
    };

    const renderUIUX = () => (
        <div style={styles.card}>
            {pipelineStatus === 'UIUX_FAILED' && (
                <FailureBanner label="UI/UX generation failed" onRetry={onGenerateUIUX} />
            )}
            <div style={styles.sectionTitle}>
                <span>UI/UX Design</span>
                {generatedUIUX && !isLoading && <RegenerateButton onClick={() => onGenerateUIUX({ force: true })} />}
            </div>

            {generatedUIUX ? (
                <>
                    {renderMarkdown(generatedUIUX)}
                    {!isLoading && !designTokens && !designSystemMd && (
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e2e8f0', paddingTop: '24px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => { setActiveSection('arch'); onGenerateArch(); }}
                                style={styles.buttonSecondary}
                            >
                                Next: Architecture (use UI/UX only)
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveSection('style'); onGenerateStyle?.(); }}
                                style={styles.buttonPrimary}
                            >
                                Next: Generate Design System
                            </button>
                        </div>
                    )}
                    {!isLoading && (designTokens || designSystemMd) && !generatedArchitecture && (
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
                    // Only render primitive values in the main list. Skip objects/arrays.
                    if (key === 'key_components' || key === 'key_services' || (typeof value === 'object' && value !== null)) return null;
                    return (
                        <div key={key} style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>{key.replace('_', ' ')}</div>
                            <div style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>{String(value)}</div>
                        </div>
                    );
                })}
                {/* Key Components Tags */}
                {(data?.key_components || data?.key_services) && (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Core Components</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {(data?.key_components || data?.key_services || []).map((comp, i) => (
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
                        {(schema?.tables || []).map((table, i) => (
                            <tr key={i} style={{ borderBottom: i === (schema?.tables?.length || 0) - 1 ? 'none' : '1px solid #e2e8f0' }}>
                                <td style={{ padding: '16px', verticalAlign: 'top', fontWeight: 600, color: '#334155', minWidth: '150px' }}>{table?.name}</td>
                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                    {(table?.columns || []).map((col, j) => (
                                        <div key={j} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontFamily: 'monospace', color: '#ef4444', fontSize: '13px' }}>{col?.name}</span>
                                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{col?.type}</span>
                                            {col?.primary_key && <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '4px' }}>PK</span>}
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

    const renderDesignSystem = () => (
        <div style={styles.card}>
            {pipelineStatus === 'STYLE_FAILED' && (
                <FailureBanner label="Design system generation failed" onRetry={onGenerateStyle} />
            )}
            <div style={styles.sectionTitle}>
                <span>Design System</span>
                {(designTokens || designSystemMd) && !isLoading && (
                    <RegenerateButton onClick={onGenerateStyle} label="Regenerate" />
                )}
            </div>

            {designSystemMd ? renderMarkdown(designSystemMd) : null}

            {designTokens?.colors && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                    {Object.entries((designTokens.design_tokens || designTokens).colors || designTokens.colors).map(([name, hex]) => (
                        <div key={name} style={{ textAlign: 'center' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 8, background: hex, border: '1px solid #e2e8f0' }} />
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{name}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{hex}</div>
                        </div>
                    ))}
                </div>
            )}

            {(designTokens || designSystemMd) ? (
                !isLoading && !generatedArchitecture && (
                    <NextStepButton
                        onClick={() => { setActiveSection('arch'); onGenerateArch(); }}
                        label="Next: Design Architecture"
                    />
                )
            ) : (
                isLoading && activeSection === 'style' ?
                    <LoadingState text="Building SaaS design tokens and CSS..." /> :
                    <EmptyState
                        message="UI/UX approved. Generate a production-ready design system."
                        action={() => onGenerateStyle?.()}
                        actionText="Generate Design System"
                    />
            )}
        </div>
    );

    const renderArchitecture = () => (
        <div style={styles.card}>
            {pipelineStatus === 'ARCHITECTURE_FAILED' && (
                <FailureBanner label="Architecture generation failed" onRetry={onGenerateArch} />
            )}
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
                            <p style={{ margin: '0', color: '#166534', fontSize: '14px' }}>Architecture is set. Click <strong>Generate Code</strong> in the header above.</p>
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

    return (
        <div style={styles.container}>
            {/* Tab Header */}
            <div style={styles.tabHeader}>
                {sections.map((s) => {
                    const isActive = activeSection === s.id;
                    const SectionIcon = s.icon;
                    return (
                        <div
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            style={styles.tabItem(isActive)}
                        >
                            <span className={`plan-step-badge ${isActive ? 'active' : ''}`}>
                                <SectionIcon size={14} aria-hidden />
                            </span>
                            <span>{s.step}. {s.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Content Area */}
            <div style={styles.contentArea}>
                {activeSection === 'prd' && renderPRD()}
                {activeSection === 'uiux' && renderUIUX()}
                {activeSection === 'style' && renderDesignSystem()}
                {activeSection === 'arch' && renderArchitecture()}
            </div>
        </div>
    );
};

export default PlanView;
