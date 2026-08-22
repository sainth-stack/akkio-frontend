import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import ChatInterface from './ChatInterface';
import TabPanel from './TabPanel';
import './AppBuilder.css';
import api, { apiFetch, wsUrl, wsAuthPayload } from '../utils/api';

const PIPELINE_RUNNING = [
    'PRD_RUNNING', 'UIUX_RUNNING', 'ARCHITECTURE_RUNNING', 'PLAN_RUNNING', 'CODEGEN_RUNNING',
];
const PIPELINE_FAILED = [
    'PRD_FAILED', 'UIUX_FAILED', 'ARCHITECTURE_FAILED', 'PLAN_FAILED', 'CODEGEN_FAILED',
];

const normalizeAgentsState = (agents) => {
    if (!agents || typeof agents !== 'object') return agents;
    const out = {};
    for (const [key, val] of Object.entries(agents)) {
        out[key] = val?.status === 'running'
            ? { ...val, status: 'interrupted', message: val.message || 'Interrupted (page reload)' }
            : val;
    }
    return out;
};

const deriveCurrentPhase = (app) => {
    const code = app.generated_code_json;
    const hasCode = code && typeof code === 'object' && Object.keys(code).length > 0;
    if (hasCode || app.pipeline_status === 'CODEGEN_COMPLETE') return 'code_generated';
    if (app.agents_state && Object.keys(app.agents_state).length > 0) {
        const values = Object.values(app.agents_state);
        if (values.every(a => a?.status === 'complete')) return 'agents_complete';
        if (values.some(a => a?.status === 'running' || a?.status === 'interrupted')) return 'agents';
    }
    if (app.pipeline_status === 'CODEGEN_RUNNING') return 'agents';
    if (app.plan?.length || app.architecture || app.generated_uiux || app.prd) return 'prd_complete';
    return 'idle';
};

const AppBuilder = () => {
    const { id: editId } = useParams();
    const navigate = useNavigate();
    const email = useMemo(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user?.email || localStorage.getItem('email') || '';
        } catch (e) { return ''; }
    }, []);

    const [messages, setMessages] = useState([]);
    const [plan, setPlan] = useState([]);
    const [prd, setPrd] = useState('');
    const [fileTree, setFileTree] = useState(null);
    const [files, setFiles] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Plan');
    const [projectName, setProjectName] = useState(null);
    const [agents, setAgents] = useState({});
    const [logs, setLogs] = useState([]);
    const [runState, setRunState] = useState(null);
    const [appRefreshKey, setAppRefreshKey] = useState(0);
    const [currentPhase, setCurrentPhase] = useState('idle'); // idle, prd, prd_complete, agents, agents_complete, code_generated
    const [currentRequirement, setCurrentRequirement] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState([]);
    const [generatedArchitecture, setGeneratedArchitecture] = useState(null);
    const [activeBuildTab, setActiveBuildTab] = useState('Multi Agents');
    const [isCodegenLoading, setIsCodegenLoading] = useState(false);
    const [isUpdateCodeInProgress, setIsUpdateCodeInProgress] = useState(false);
    const [isTreeLoading, setIsTreeLoading] = useState(false);
    const [appId, setAppId] = useState(null); // DB app id after create
    const [loadingApp, setLoadingApp] = useState(!!editId);
    const [useSandboxBuild, setUseSandboxBuild] = useState(() => {
        try {
            return localStorage.getItem('akkio_use_sandbox_build') === '1';
        } catch (e) {
            return false;
        }
    });
    const [pipelineStatus, setPipelineStatus] = useState(null);
    const [pipelineError, setPipelineError] = useState(null);
    const [buildStatus, setBuildStatus] = useState(null);
    const [buildError, setBuildError] = useState(null);
    const [buildLog, setBuildLog] = useState('');

    const updateAppInDb = useCallback(async (updates) => {
        const id = appIdRef.current;
        if (!id) return false;
        try {
            await api.put(`/app-builder/apps/${id}`, updates);
            return true;
        } catch (e) {
            console.error('Error updating app in DB:', e);
            return false;
        }
    }, []);

    const codegenWsRef = useRef(null); // WebSocket reference for code generation
    const updateCodeWsRef = useRef(null);
    const abortControllerRef = useRef(null);
    const planningSessionRef = useRef(false);
    const appIdRef = useRef(null); // current app id for section-wise save
    const agentsAccumulatorRef = useRef({}); // mirror of agents state for reliable save
    useEffect(() => { appIdRef.current = appId; }, [appId]);

    useEffect(() => {
        try {
            localStorage.setItem('akkio_use_sandbox_build', useSandboxBuild ? '1' : '0');
        } catch (e) { /* ignore */ }
    }, [useSandboxBuild]);

    // State for new planning steps
    const [generatedUIUX, setGeneratedUIUX] = useState('');
    const [clarifiedRequirement, setClarifiedRequirement] = useState('');

    // Renamed to be specific to PRD start
    const handleStartPlanning = async (text) => {
        // Cancel previous if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        planningSessionRef.current = true;

        const newMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, newMessage, { role: 'ai', content: "" }]);
        setIsLoading(true);
        setActiveTab('Plan');
        setPipelineStatus('PRD_RUNNING');
        setPipelineError(null);
        // Reset all plan states
        setPlan([]);
        setPrd('');
        setGeneratedUIUX('');
        setGeneratedArchitecture(null);
        setFileTree(null);
        setFiles({});
        setAgents({});
        setLogs([]);
        setRunState(null);
        setCurrentPhase('prd');
        setCurrentRequirement(text);
        setClarifiedRequirement('');

        const localProjectName = projectName || ("generated_app_" + Date.now());
        if (!projectName) setProjectName(localProjectName);

        const append = (delta) => {
            setMessages(prev => {
                if (prev.length === 0) return prev;
                const next = [...prev];
                const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                if (lastIdx === -1) return prev;
                next[lastIdx] = { ...next[lastIdx], content: (next[lastIdx].content || "") + delta };
                return next;
            });
        };

        const existingId = appId || editId;
        let createdAppId = existingId || null;

        try {
            const appName = (text || '').slice(0, 100) || localProjectName;
            if (existingId) {
                await api.put(`/app-builder/apps/${existingId}`, {
                    app_name: appName,
                    prompt: text,
                    project_name: localProjectName,
                });
                setAppId(existingId);
            } else {
                const createRes = await api.post('/app-builder/apps', {
                    app_name: appName,
                    prompt: text,
                    project_name: localProjectName,
                });
                const createData = createRes.data;
                if (createData.status === 'success' && createData.app?.id) {
                    createdAppId = createData.app.id;
                    setAppId(createData.app.id);
                }
            }
        } catch (e) {
            console.error('Error saving app record:', e);
            append("Could not save app record. Planning will continue, but progress may not persist.\n");
        }

        let lastPrd = '';
        try {
            append("Starting PRD generation...\n\n");

            // Call new planning API for PRD
            await streamPlanningStep('prd', { requirement: text, app_id: createdAppId || appId }, append, (data) => {
                if (data.event === 'prd_chunk') setPrd(prev => prev + (data.data || ''));
                if (data.event === 'prd_complete') {
                    lastPrd = data.data || '';
                    setPrd(lastPrd);
                }
            });

            if (!lastPrd.trim()) {
                throw new Error('PRD generation returned empty content. Check your OpenAI API key in Settings or akkio-fastapi/.env.');
            }

            append("PRD complete. Please review and proceed to UI/UX Design.\n");
            setPipelineStatus('PRD_COMPLETE');
            setPipelineError(null);

            // Update app in DB with PRD
            if (createdAppId && lastPrd) {
                try {
                    await api.put(`/app-builder/apps/${createdAppId}`, { prd: lastPrd });
                } catch (e) {
                    console.error('Error updating app with PRD:', e);
                }
            }

            if (createdAppId && !editId) {
                navigate(`/app-builder/edit/${createdAppId}`, { replace: true });
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                append("\n🛑 Process stopped by user.\n");
            } else {
                console.error('Error in PRD generation:', error);
                append(`\nError: ${error.message}\n`);
                setPipelineStatus('PRD_FAILED');
                setPipelineError(error.message);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
            planningSessionRef.current = false;
        }
    };

    const handleUpdateCode = async (text) => {
        if (!projectName) return;

        const newMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, newMessage, { role: 'ai', content: "Updating code based on your request...\n" }]);
        setIsLoading(true);
        setIsUpdateCodeInProgress(true);
        setActiveTab('Build');
        setActiveBuildTab('Multi Agents');

        const sessionId = `session_update_${Date.now()}`;
        const socketUrl = wsUrl(`/agents/update-code-ws/${sessionId}`);

        const ws = new WebSocket(socketUrl);
        updateCodeWsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify(wsAuthPayload({
                user_request: text,
                project_name: projectName,
                app_id: appId || null
            })));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.event === 'agent_start') {
                    const next = {
                        ...agentsAccumulatorRef.current,
                        [data.agent]: {
                            status: 'running',
                            message: data.message,
                            progress: [{ type: 'start', text: data.message, timestamp: Date.now() }],
                            started_at: Date.now()
                        }
                    };
                    agentsAccumulatorRef.current = next;
                    setAgents(next);
                }

                if (data.event === 'agent_progress') {
                    const prev = agentsAccumulatorRef.current;
                    const next = {
                        ...prev,
                        [data.agent]: {
                            ...prev[data.agent],
                            message: data.message,
                            progress: [
                                ...(prev[data.agent]?.progress || []),
                                { type: 'progress', text: data.message, timestamp: Date.now() }
                            ]
                        }
                    };
                    agentsAccumulatorRef.current = next;
                    setAgents(next);
                }

                if (data.event === 'prd_updated') {
                    setPrd(data.data);
                }

                if (data.event === 'architecture_updated') {
                    setGeneratedArchitecture(data.data);
                }

                if (data.event === 'agent_complete') {
                    const prev = agentsAccumulatorRef.current;
                    const next = {
                        ...prev,
                        [data.agent]: {
                            ...prev[data.agent],
                            status: 'complete',
                            message: data.message,
                            data: data.data,
                            progress: [
                                ...(prev[data.agent]?.progress || []),
                                { type: 'complete', text: data.message, timestamp: Date.now() }
                            ],
                            completed_at: Date.now()
                        }
                    };
                    agentsAccumulatorRef.current = next;
                    setAgents(next);
                    // Save agents after update_code completes
                    if (appIdRef.current && email) {
                        updateAppInDb({ agents_state: next });
                    }

                    const responseData = data.data;

                    setMessages(prev => {
                        const next = [...prev];
                        const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                        if (lastIdx !== -1) {
                            const filesList = (responseData.updated_files || []).map(f => `  • ${f}`).join('\n');
                            next[lastIdx].content = `\n✅ Code updated!\n\n${responseData.analysis}\n\nFiles updated:\n${filesList || '  (none)'}\n\nRun the app again to see your changes.`;
                        }
                        return next;
                    });

                    // Evict updated files from the local cache so FileExplorer re-fetches fresh content
                    if (responseData.updated_files && responseData.updated_files.length > 0) {
                        setFiles(prev => {
                            const next = { ...prev };
                            responseData.updated_files.forEach(f => {
                                delete next[f];
                            });
                            return next;
                        });
                        setAppRefreshKey(k => k + 1);
                    }

                    // Switch to Code tab so user sees the changes immediately
                    setActiveTab('Build');
                    setActiveBuildTab('Code');

                    // Reload project tree to reflect new/changed files
                    if (projectName) loadProjectTree(projectName);

                    setIsLoading(false);
                    setIsUpdateCodeInProgress(false);
                    updateCodeWsRef.current = null;
                    ws.close();
                }

                if (data.event === 'error') {
                    setIsUpdateCodeInProgress(false);
                    setMessages(prev => {
                        const next = [...prev];
                        const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                        if (lastIdx !== -1) {
                            next[lastIdx].content = `\nError updating code: ${data.message}`;
                        }
                        return next;
                    });
                    setIsLoading(false);
                    updateCodeWsRef.current = null;
                    ws.close();
                }

            } catch (e) {
                console.error("Error parsing WebSocket message: ", e);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setMessages(prev => {
                const next = [...prev];
                const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                if (lastIdx !== -1) {
                    next[lastIdx].content = (next[lastIdx].content || "") + `\nWebSocket connection error`;
                }
                return next;
            });
            setIsLoading(false);
            setIsUpdateCodeInProgress(false);
            updateCodeWsRef.current = null;
        };

        ws.onclose = () => {
            updateCodeWsRef.current = null;
            setIsLoading(false);
            setIsUpdateCodeInProgress(false);
        };
    };

    const handleChatMessage = (text) => {
        // If we already have a project and code has been generated, treat as an update request
        const hasGeneratedCode = currentPhase === 'code_generated'
            || currentPhase === 'agents_complete'
            || Object.keys(files).length > 0
            || fileTree !== null;

        if (projectName && hasGeneratedCode) {
            handleUpdateCode(text);
        } else {
            handleStartPlanning(text);
        }
    };

    const handleStopPlanning = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
    };


    const handleStopCodegen = () => {
        if (codegenWsRef.current) {
            codegenWsRef.current.close();
            codegenWsRef.current = null;
        }
        setIsCodegenLoading(false);
        setAgents(prev => {
            const current = prev?.code_generator_agent;
            if (!current) return prev;
            return {
                ...prev,
                code_generator_agent: {
                    ...current,
                    status: 'stopped',
                    message: 'Code generation stopped by user.',
                    progress: [
                        ...(current.progress || []),
                        { type: 'stopped', text: 'Code generation stopped by user.', timestamp: Date.now() }
                    ]
                }
            };
        });
    };

    const streamPlanningStep = async (step, body, append, onData) => {
        try {
            const response = await apiFetch(`/planning/${step}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: abortControllerRef.current?.signal
            });

            if (!response.ok) throw new Error(`Failed to generate ${step}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    let data;
                    try {
                        data = JSON.parse(line);
                    } catch (parseErr) {
                        console.error('Planning stream JSON parse error', parseErr, line.slice(0, 120));
                        continue;
                    }
                    if (data.event === 'start') append(`${data.message}\n`);
                    if (data.event === 'error') throw new Error(data.message || `Failed to generate ${step}`);
                    onData(data);
                }
            }
        } catch (e) {
            throw e;
        }
    };

    const handleGenerateUIUX = async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        const append = (delta) => {
            setMessages(prev => {
                const next = [...prev];
                const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                if (lastIdx !== -1) next[lastIdx].content += delta;
                return next;
            });
        };

        let lastUIUX = '';
        try {
            append("\nStarting UI/UX Design...\n");
            await streamPlanningStep('uiux', { requirement: currentRequirement, prd, app_id: appId }, append, (data) => {
                if (data.event === 'uiux_chunk') setGeneratedUIUX(prev => prev + data.data);
                if (data.event === 'uiux_complete') {
                    lastUIUX = data.data || '';
                    setGeneratedUIUX(lastUIUX);
                }
            });
            append("UI/UX Design complete.\n");
            setPipelineStatus('UIUX_COMPLETE');
            setPipelineError(null);
            if (lastUIUX) updateAppInDb({ generated_uiux: lastUIUX });
        } catch (e) {
            if (e.name === 'AbortError') append("\n🛑 Stopped by user.\n");
            else {
                append(`Error: ${e.message}\n`);
                setPipelineStatus('UIUX_FAILED');
                setPipelineError(e.message);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const [streamingArchitectureText, setStreamingArchitectureText] = useState('');

    const handleGenerateArch = async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        setStreamingArchitectureText('');
        setGeneratedArchitecture(null);

        const append = (delta) => {
            setMessages(prev => {
                const next = [...prev];
                const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                if (lastIdx !== -1) next[lastIdx].content += delta;
                return next;
            });
        };

        let lastArch = null;
        try {
            append("\nStarting Architectural Design...\n");
            await streamPlanningStep('architecture', { requirement: currentRequirement, prd, uiux: generatedUIUX, app_id: appId }, append, (data) => {
                if (data.event === 'architecture_chunk') setStreamingArchitectureText(prev => prev + data.data);
                if (data.event === 'architecture_complete') {
                    lastArch = data.data || null;
                    setGeneratedArchitecture(lastArch);
                    setCurrentPhase('prd_complete'); // Enable "Create Agents" button (no Master Plan step)
                }
            });
            append("Architecture complete.\n");
            setPipelineStatus('ARCHITECTURE_COMPLETE');
            setPipelineError(null);
            if (lastArch != null) updateAppInDb({ architecture: lastArch });
        } catch (e) {
            if (e.name === 'AbortError') append("\n🛑 Stopped by user.\n");
            else {
                append(`Error: ${e.message}\n`);
                setPipelineStatus('ARCHITECTURE_FAILED');
                setPipelineError(e.message);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleGeneratePlan = async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        const append = (delta) => {
            setMessages(prev => {
                const next = [...prev];
                const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                if (lastIdx !== -1) next[lastIdx].content += delta;
                return next;
            });
        };

        let lastPlan = null;
        try {
            append("\nStarting Implementation Plan...\n");
            await streamPlanningStep('plan', { requirement: currentRequirement, prd, architecture: generatedArchitecture, app_id: appId }, append, (data) => {
                if (data.event === 'plan_step') setPlan(prev => [...prev, data.data]);
                if (data.event === 'plan_complete') {
                    lastPlan = data.data || null;
                    setGeneratedPlan(lastPlan);
                    setCurrentPhase('prd_complete'); // Enable "Create Agents" button
                }
            });
            append("Plan complete. Ready to build.\n");
            setPipelineStatus('PLAN_COMPLETE');
            setPipelineError(null);
            if (lastPlan != null) updateAppInDb({ plan: lastPlan });
        } catch (e) {
            if (e.name === 'AbortError') append("\n🛑 Stopped by user.\n");
            else {
                append(`Error: ${e.message}\n`);
                setPipelineStatus('PLAN_FAILED');
                setPipelineError(e.message);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleCreateAgents = async () => {
        if (!generatedArchitecture) {
            alert('Complete Architecture in the Plan tab before generating code.');
            setActiveTab('Plan');
            return;
        }
        if (!projectName) {
            alert('Missing project name.');
            return;
        }

        setIsLoading(true);
        setIsCodegenLoading(true);
        setCurrentPhase('agents');
        setPipelineStatus('CODEGEN_RUNNING');
        setPipelineError(null);
        setActiveTab('Build');
        setActiveBuildTab('Multi Agents');

        const appendAi = (delta) => {
            setMessages(prev => {
                if (prev.length === 0) return prev;
                const next = [...prev];
                const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                if (lastIdx === -1) return [...prev, { role: 'ai', content: delta }];
                next[lastIdx] = { ...next[lastIdx], content: (next[lastIdx].content || "") + delta };
                return next;
            });
        };

        try {
            appendAi("\n\nGenerating code from your PRD, UI/UX, and architecture...\n\n");
            await executeCodegenWithWebSocket(
                clarifiedRequirement || currentRequirement,
                generatedPlan,
                generatedArchitecture,
                projectName,
                prd,
                generatedUIUX || "",
                appendAi
            );
            appendAi("\nCode generation complete. Review files in the Code tab or click Run App.\n");
            setCurrentPhase('code_generated');
            setActiveBuildTab('Code');
        } catch (error) {
            console.error('Error in code generation:', error);
            appendAi(`\nError: ${error.message}\n`);
            setPipelineStatus('CODEGEN_FAILED');
            setPipelineError(error.message);
            setCurrentPhase('prd_complete');
        } finally {
            setIsLoading(false);
            setIsCodegenLoading(false);
        }
    };

    const loadProjectTree = async (projName) => {
        if (!projName) return;
        setIsTreeLoading(true);
        try {
            const res = await apiFetch(`/app-builder/projects/${projName}/tree`);
            if (res.ok) {
                const data = await res.json();
                setFileTree(data.tree);
            }
        } catch (error) {
            console.error('Error loading project tree:', error);
        } finally {
            setIsTreeLoading(false);
        }
    };

    // Load app when editing (editId from route) – restore all section content
    useEffect(() => {
        if (!editId) {
            setLoadingApp(false);
            return;
        }
        const loadApp = async () => {
            setLoadingApp(true);
            try {
                const res = await api.get(`/app-builder/apps/${editId}`);
                const data = res.data;
                if (data.status === 'success' && data.app) {
                    const app = data.app;

                    // Don't overwrite in-flight planning (PRD stream / chat)
                    if (planningSessionRef.current) {
                        setAppId(app.id);
                        if (app.project_name) setProjectName(app.project_name);
                        return;
                    }

                    // Restore all section content
                    setCurrentRequirement(app.prompt || '');
                    setProjectName(app.project_name || null);
                    setPrd(app.prd || '');
                    setGeneratedUIUX(app.generated_uiux || '');
                    const planArr = Array.isArray(app.plan) ? app.plan : [];
                    setPlan(planArr);
                    setGeneratedPlan(planArr.length ? planArr : []);
                    setGeneratedArchitecture(app.architecture || null);
                    setAppId(app.id);
                    setPipelineStatus(app.pipeline_status || null);
                    setPipelineError(app.pipeline_error || null);
                    setBuildStatus(app.build_status || null);
                    setBuildError(app.build_error || null);
                    setBuildLog(app.build_log || '');

                    if (app.preview_url) {
                        setRunState({
                            frontend_url: app.preview_url,
                            project_name: app.project_name,
                            backend_url: app.live_url || null,
                        });
                    }
                    if (app.build_log) {
                        const logLines = app.build_log.split('\n').filter(Boolean);
                        if (logLines.length) setLogs(logLines);
                    }

                    // Build initial messages summarizing loaded sections
                    const parts = [];
                    if (app.prompt) parts.push(`**Prompt:** ${app.prompt.slice(0, 150)}${app.prompt.length > 150 ? '...' : ''}`);
                    if (app.prd) parts.push('**PRD** loaded.');
                    if (app.generated_uiux) parts.push('**UI/UX Design** loaded.');
                    if (app.architecture) parts.push('**Architecture** loaded.');
                    if (planArr.length) parts.push('**Implementation Plan** loaded.');

                    // Restore agents state
                    if (app.agents_state) {
                        const normalized = normalizeAgentsState(app.agents_state);
                        agentsAccumulatorRef.current = normalized;
                        setAgents(normalized);
                        parts.push('**Agent Logs** loaded.');
                    }

                    // Restore generated code from DB
                    if (app.generated_code_json) {
                        try {
                            const codeRes = await api.get(`/app-builder/apps/${editId}/code`);
                            const codeData = codeRes.data;
                            if (codeData.status === 'success') {
                                setFiles(codeData.files || {});
                                setFileTree(codeData.tree || []);
                                parts.push('**Generated Code** loaded from DB.');
                            } else {
                                // Fallback to what was in the main app object
                                setFiles(app.generated_code_json);
                                parts.push('**Generated Code** loaded.');
                                if (app.project_name) loadProjectTree(app.project_name);
                            }
                        } catch (err) {
                            console.error("Error fetching code from DB:", err);
                            setFiles(app.generated_code_json);
                            if (app.project_name) loadProjectTree(app.project_name);
                        }
                    } else if (app.project_name) {
                        loadProjectTree(app.project_name);
                    }

                    const summary = parts.length ? parts.join('\n') : 'App loaded. Continue from the Plan tab.';

                    setMessages([
                        { role: 'user', content: app.prompt || '' },
                        { role: 'ai', content: summary }
                    ]);

                    setCurrentPhase(deriveCurrentPhase(app));
                }
            } catch (e) {
                console.error('Error loading app:', e);
                alert('Failed to load this app. It may have been deleted.');
                navigate('/app-builder');
            } finally {
                setLoadingApp(false);
            }
        };
        loadApp();
    }, [editId, navigate]);

    // Poll pipeline / build status when a step is in progress (survives refresh)
    useEffect(() => {
        if (!appId || loadingApp) return;
        const pipelineBusy = PIPELINE_RUNNING.includes(pipelineStatus);
        const buildBusy = buildStatus === 'BUILDING';
        if (!pipelineBusy && !buildBusy) return;

        let cancelled = false;
        const poll = async () => {
            try {
                const res = await api.get(`/app-builder/apps/${appId}/status`);
                const data = res.data;
                if (cancelled || data.status !== 'success') return;
                if (data.pipeline_status) setPipelineStatus(data.pipeline_status);
                if (data.pipeline_error !== undefined) setPipelineError(data.pipeline_error);
                if (data.build_status) setBuildStatus(data.build_status);
                if (data.build_error !== undefined) setBuildError(data.build_error);
                if (data.build_log) setBuildLog(data.build_log);
                if (data.preview_url) {
                    setRunState(prev => ({
                        ...(prev || {}),
                        frontend_url: data.preview_url,
                        project_name: projectName,
                    }));
                    if (data.build_status === 'BUILD_SUCCESS') {
                        setIsRunLoading(false);
                    }
                }
            } catch (e) {
                console.error('Error polling app status:', e);
            }
        };

        poll();
        const interval = setInterval(poll, 4000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [appId, loadingApp, pipelineStatus, buildStatus, projectName]);

    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (codegenWsRef.current) codegenWsRef.current.close();
            if (updateCodeWsRef.current) updateCodeWsRef.current.close();
        };
    }, []);

    const filesRef = useRef(files);
    useEffect(() => { filesRef.current = files; }, [files]);
    const loadFile = useCallback(async (path) => {
        // Use in-memory files first (from DB) to avoid 404 when project not yet on disk
        const cached = filesRef.current?.[path];
        if (cached !== undefined) return cached;
        if (!projectName) return null;
        const res = await apiFetch(`/app-builder/projects/${projectName}/file?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error(`Failed to load file: ${path}`);
        const data = await res.json();
        setFiles(prev => ({ ...prev, [path]: data.content }));
        return data.content;
    }, [projectName]);

    const saveFile = useCallback(async (path, content) => {
        if (!projectName) throw new Error("No project yet");
        const res = await apiFetch(`/app-builder/projects/${projectName}/file`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, content })
        });
        if (!res.ok) throw new Error(`Failed to save file: ${path}`);
        setFiles(prev => ({ ...prev, [path]: content }));
        return true;
    }, [projectName]);

    const [isRunLoading, setIsRunLoading] = useState(false);

    const handleDownloadCode = useCallback(async () => {
        if (!projectName) return;
        try {
            const response = await apiFetch(`/app-builder/projects/${projectName}/download`);
            if (!response.ok) throw new Error('Failed to download project');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading project:', error);
            setLogs(prev => [...prev, `Error downloading project: ${error.message}`]);
        }
    }, [projectName]);

    const handleRun = useCallback(async () => {
        if (!projectName) return;
        setLogs(prev => [...prev, `Starting project ${projectName}...`]);
        setIsRunLoading(true);
        setBuildStatus('BUILDING');
        setBuildError(null);
        setActiveTab('Build');
        setActiveBuildTab('Build'); // Show App View immediately

        try {
            let gotReady = false;
            const response = await apiFetch(`/app-builder/projects/${projectName}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    install: true,
                    ...(useSandboxBuild ? { use_sandbox: true } : {})
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start project');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep partial line

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        if (data.event === 'status') {
                            setLogs(prev => [...prev, `[System] ${data.message}`]);
                        }

                        if (data.event === 'error') {
                            setLogs(prev => [...prev, `[Error] ${data.message}`]);
                            setBuildStatus('BUILD_FAILED');
                            setBuildError(data.message);
                        }

                        if (data.event === 'warning') {
                            setLogs(prev => [...prev, `[Warning] ${data.message}`]);
                        }

                        if (data.event === 'frontend_url') {
                            setRunState(prev => ({ ...(prev || {}), frontend_url: data.frontend_url }));
                            setActiveTab('Build');
                            setActiveBuildTab('Build');
                            setLogs(prev => [...prev, `[System] ${data.message || 'Open app: ' + data.frontend_url}`]);
                        }

                        if (data.event === 'ready') {
                            gotReady = true;
                            setRunState(data.data);
                            setBuildStatus('BUILD_SUCCESS');
                            setBuildError(null);
                            setIsRunLoading(false); // don't wait for stream close (reload can hang the connection)
                            setActiveTab('Build');
                            setActiveBuildTab('Build'); // App View sub-tab
                            setLogs(prev => [...prev, `[System] ${data.message}`]);
                        }

                    } catch (e) {
                        console.error("Error parsing run event:", e);
                    }
                }
            }

            if (!gotReady) {
                setLogs(prev => [...prev, '[System] Build stream ended without ready event.']);
            }

        } catch (error) {
            console.error('Error starting project:', error);
            const msg = error.message === 'Failed to fetch'
                ? 'Connection lost during build (server may still be building). Wait and click Retry Run, or check the API server logs.'
                : error.message;
            setLogs(prev => [...prev, `Error: ${msg}`]);
            setBuildStatus('BUILD_FAILED');
            setBuildError(msg);
        } finally {
            setIsRunLoading(false);
        }
    }, [projectName, useSandboxBuild]);

    const collectFilePathsFromTree = (nodes, acc = []) => {
        for (const node of nodes || []) {
            if (node.type === 'file' && node.path) acc.push(node.path);
            if (node.children?.length) collectFilePathsFromTree(node.children, acc);
        }
        return acc;
    };

    const loadGeneratedCodeIntoEditor = async (projName) => {
        if (!projName) return;
        if (appId) {
            try {
                const res = await api.get(`/app-builder/apps/${appId}/code`);
                const codeData = res.data;
                if (codeData?.status === 'success' && codeData.files) {
                    setFiles(codeData.files);
                    if (codeData.tree?.length) setFileTree(codeData.tree);
                    return;
                }
            } catch (e) {
                console.error('Error loading code from DB:', e);
            }
        }
        try {
            const treeRes = await apiFetch(`/app-builder/projects/${projName}/tree`);
            if (!treeRes.ok) return;
            const treeData = await treeRes.json();
            const tree = treeData.tree || [];
            setFileTree(tree);
            const paths = collectFilePathsFromTree(tree);
            const loaded = {};
            await Promise.all(
                paths.slice(0, 80).map(async (path) => {
                    try {
                        const fileRes = await apiFetch(
                            `/app-builder/projects/${projName}/file?path=${encodeURIComponent(path)}`
                        );
                        if (fileRes.ok) {
                            const fileData = await fileRes.json();
                            loaded[path] = fileData.content;
                        }
                    } catch {
                        /* skip unreadable files */
                    }
                })
            );
            if (Object.keys(loaded).length) setFiles(prev => ({ ...prev, ...loaded }));
        } catch (e) {
            console.error('Error loading code from disk:', e);
        }
    };

    const executeCodegenWithWebSocket = async (requirement, plan, architecture, project_name, prdText, uiuxText, appendAi) => {
        return new Promise((resolve, reject) => {
            agentsAccumulatorRef.current = {};
            let settled = false;
            const sessionId = `session_${Date.now()}`;
            const socketUrl = wsUrl(`/codegen/execute/${sessionId}`);

            appendAi(`Connecting to code generation service...\n`);

            const ws = new WebSocket(socketUrl);
            codegenWsRef.current = ws;

            const finish = (fn, arg) => {
                if (settled) return;
                settled = true;
                fn(arg);
            };

            ws.onopen = () => {
                appendAi("Connected for code generation.\n\n");
                ws.send(JSON.stringify(wsAuthPayload({
                    requirement,
                    plan,
                    prd: prdText || "",
                    architecture,
                    uiux: uiuxText || "",
                    project_name,
                    app_id: appId || null,
                })));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.event === 'generation_start') {
                        appendAi(`${data.message}\n\n`);
                    }

                    if (data.event === 'agent_start') {
                        const next = {
                            ...agentsAccumulatorRef.current,
                            [data.agent]: {
                                status: 'running',
                                message: data.message,
                                progress: [{ type: 'start', text: data.message, timestamp: Date.now() }],
                                started_at: Date.now()
                            }
                        };
                        agentsAccumulatorRef.current = next;
                        setAgents(next);
                    }

                    if (data.event === 'agent_progress') {
                        const prev = agentsAccumulatorRef.current;
                        const next = {
                            ...prev,
                            [data.agent]: {
                                ...prev[data.agent],
                                message: data.message,
                                progress: [
                                    ...(prev[data.agent]?.progress || []),
                                    { type: 'progress', text: data.message, timestamp: Date.now() }
                                ]
                            }
                        };
                        agentsAccumulatorRef.current = next;
                        setAgents(next);
                        appendAi(`  ${data.message}\n`);
                    }

                    if (data.event === 'agent_complete') {
                        const prev = agentsAccumulatorRef.current;
                        const next = {
                            ...prev,
                            [data.agent]: {
                                ...prev[data.agent],
                                status: 'complete',
                                message: data.message,
                                data: data.data,
                                progress: [
                                    ...(prev[data.agent]?.progress || []),
                                    { type: 'complete', text: data.message, timestamp: Date.now() }
                                ],
                                completed_at: Date.now()
                            }
                        };
                        agentsAccumulatorRef.current = next;
                        setAgents(next);
                        if (data.agent === 'build_verify_agent' || data.agent === 'validation_agent') {
                            appendAi(`\n${data.message}\n`);
                        }
                    }

                    if (data.event === 'build_start' || data.event === 'build_fix_attempt') {
                        appendAi(`\n${data.message}\n`);
                    }

                    if (data.event === 'build_log') {
                        appendAi(`  ${data.message}\n`);
                    }

                    if (data.event === 'build_failed') {
                        appendAi(`\n⚠ ${data.message}\n`);
                    }

                    if (data.event === 'build_success') {
                        appendAi(`\n✓ ${data.message}\n`);
                    }

                    if (data.event === 'codegen_complete') {
                        appendAi(`\n${data.message}\n`);
                        appendAi(`Files generated: ${data.data.files_count}\n\n`);
                        loadProjectTree(project_name);
                        loadGeneratedCodeIntoEditor(project_name);
                        setCurrentPhase('code_generated');
                        setPipelineStatus('CODEGEN_COMPLETE');
                        setPipelineError(null);
                        settled = true;
                        ws.close();
                        const agentsToSave = agentsAccumulatorRef.current;
                        updateAppInDb({ agents_state: agentsToSave });
                        finish(resolve);
                    }

                    if (data.event === 'agent_error') {
                        appendAi(`\nError: ${data.error || data.message}\n`);
                        settled = true;
                        ws.close();
                        finish(reject, new Error(data.error || data.message || 'Code generation failed'));
                    }

                    if (data.event === 'error') {
                        appendAi(`\nError: ${data.message}\n`);
                        settled = true;
                        ws.close();
                        finish(reject, new Error(data.message));
                    }

                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                appendAi(`\nWebSocket connection error\n`);
                finish(reject, error);
            };

            ws.onclose = () => {
                codegenWsRef.current = null;
                if (!settled) {
                    appendAi("\nCode generation connection closed unexpectedly.\n");
                    finish(reject, new Error('Code generation connection closed'));
                }
            };
        });
    };

    const handleStartCodegen = async () => {
        if (!projectName || !generatedArchitecture) {
            alert('Cannot start code generation: missing project name or architecture.');
            return;
        }
        await handleCreateAgents();
    };

    const handlePipelineRetry = useCallback(() => {
        if (!pipelineStatus && buildStatus !== 'BUILD_FAILED') return;
        if (pipelineStatus === 'PRD_FAILED') {
            handleStartPlanning(currentRequirement);
        } else if (pipelineStatus === 'UIUX_FAILED') {
            handleGenerateUIUX();
        } else if (pipelineStatus === 'ARCHITECTURE_FAILED') {
            handleGenerateArch();
        } else if (pipelineStatus === 'PLAN_FAILED') {
            handleGeneratePlan();
        } else if (pipelineStatus === 'CODEGEN_FAILED') {
            handleCreateAgents();
        } else if (buildStatus === 'BUILD_FAILED') {
            handleRun();
        }
    }, [pipelineStatus, buildStatus, currentRequirement]); // eslint-disable-line react-hooks/exhaustive-deps

    const showPipelineBanner = pipelineStatus && (
        PIPELINE_RUNNING.includes(pipelineStatus)
        || PIPELINE_FAILED.includes(pipelineStatus)
        || buildStatus === 'BUILD_FAILED'
    );

    const handleRestartCodegen = async () => {
        if (!window.confirm("Restart code generation based on current architecture?")) return;
        await handleStartCodegen();
    };

    if (loadingApp) {
        return (
            <div className="app-builder-container" style={{ display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/app-builder')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}
                    >
                        ← Back to App Builder
                    </button>
                </header>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: 24 }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <Spinner animation="border" />
                        <p style={{ margin: 0, fontSize: 14 }}>Loading app...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-builder-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '14px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
                <button
                    type="button"
                    onClick={() => navigate('/app-builder')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#475569' }}
                >
                    ← Back to App Builder
                </button>
            </header>
            {showPipelineBanner && (
                <div
                    className="pipeline-status-banner"
                    style={{
                        padding: '10px 24px',
                        backgroundColor: PIPELINE_FAILED.includes(pipelineStatus) || buildStatus === 'BUILD_FAILED' ? '#fef2f2' : '#eff6ff',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexShrink: 0,
                    }}
                >
                    <div style={{ fontSize: 13, color: '#334155' }}>
                        {PIPELINE_RUNNING.includes(pipelineStatus) && (
                            <span>Pipeline in progress: <strong>{pipelineStatus.replace(/_/g, ' ')}</strong></span>
                        )}
                        {(PIPELINE_FAILED.includes(pipelineStatus) || buildStatus === 'BUILD_FAILED') && (
                            <span>
                                {buildStatus === 'BUILD_FAILED' ? 'Build failed' : (pipelineStatus || 'Pipeline failed').replace(/_/g, ' ')}
                                {(pipelineError || buildError) && (
                                    <span style={{ color: '#b91c1c', marginLeft: 8 }}>
                                        — {(pipelineError || buildError).slice(0, 200)}
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                    {(PIPELINE_FAILED.includes(pipelineStatus) || buildStatus === 'BUILD_FAILED') && (
                        <button
                            type="button"
                            onClick={handlePipelineRetry}
                            style={{
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 600,
                                backgroundColor: '#007bff',
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
            )}
            <div className="app-builder-main">
                <ChatInterface
                    onSendMessage={handleChatMessage}
                    messages={messages}
                    isLoading={isLoading}
                    isUpdateMode={!!(projectName && (currentPhase === 'code_generated' || currentPhase === 'agents_complete' || Object.keys(files).length > 0 || fileTree !== null))}
                    isUpdateCodeInProgress={isUpdateCodeInProgress}
                />
                <TabPanel
                    plan={plan}
                    prd={prd}
                    fileTree={fileTree}
                    files={files}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onRun={handleRun}
                    useSandboxBuild={useSandboxBuild}
                    onUseSandboxBuildChange={setUseSandboxBuild}
                    projectName={projectName}
                    agents={agents}
                    logs={logs}
                    runState={runState}
                    appRefreshKey={appRefreshKey}
                    onLoadFile={loadFile}
                    onSaveFile={saveFile}
                    currentPhase={currentPhase}
                    onCreateAgents={handleCreateAgents}
                    onStartCodegen={handleStartCodegen}
                    onRestartCodegen={handleRestartCodegen}
                    onRegeneratePrd={() => handleStartPlanning(currentRequirement)}
                    onRegeneratePlan={handleGeneratePlan}
                    onRegenerateAgents={handleCreateAgents}
                    isLoading={isLoading}
                    isCodegenLoading={isCodegenLoading}
                    isRunLoading={isRunLoading}
                    pipelineStatus={pipelineStatus}
                    pipelineError={pipelineError}
                    onRetryPipeline={handlePipelineRetry}
                    activeBuildTab={activeBuildTab}
                    onBuildTabChange={setActiveBuildTab}
                    generatedUIUX={generatedUIUX}
                    generatedArchitecture={generatedArchitecture}
                    onGenerateUIUX={handleGenerateUIUX}
                    onGenerateArch={handleGenerateArch}
                    onGeneratePlan={handleGeneratePlan}
                    streamingArchitectureText={streamingArchitectureText}
                    onStopPlanning={handleStopPlanning}
                    onStopCodegen={handleStopCodegen}
                    onDownloadCode={handleDownloadCode}
                    appId={appId}
                    isTreeLoading={isTreeLoading}
                    buildStatus={buildStatus}
                    buildError={buildError}
                    buildLog={buildLog}
                />
            </div>
        </div>
    );
};

export default AppBuilder;
