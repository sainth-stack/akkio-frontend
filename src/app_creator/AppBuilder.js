import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import ChatInterface from './ChatInterface';
import TabPanel from './TabPanel';
import './AppBuilder.css';

const AppBuilder = () => {
    const { id: editId } = useParams();
    const navigate = useNavigate();
    const email = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}')?.email || '';
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
    const [currentPhase, setCurrentPhase] = useState('idle'); // idle, prd, prd_complete, agents, agents_complete, code_generated
    const [currentRequirement, setCurrentRequirement] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState([]);
    const [generatedArchitecture, setGeneratedArchitecture] = useState(null);
    const [activeBuildTab, setActiveBuildTab] = useState('Multi Agents');
    const [isCodegenLoading, setIsCodegenLoading] = useState(false);
    const [appId, setAppId] = useState(null); // DB app id after create
    const [loadingApp, setLoadingApp] = useState(!!editId);

    const apiBase = useMemo(
        () => process.env.REACT_APP_API_URL || 'http://localhost:8000',
        []
    );

    // Save section content to DB when each section completes (for edit load)
    const updateAppInDb = useCallback(async (updates) => {
        const id = appIdRef.current;
        if (!id || !email) return;
        try {
            await fetch(
                `${apiBase}/api/app-builder/apps/${id}?user_email=${encodeURIComponent(email)}`,
                { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }
            );
        } catch (e) {
            console.error('Error updating app in DB:', e);
        }
    }, [apiBase, email]);

    const agentsWsRef = useRef(null); // WebSocket reference for agents
    const codegenWsRef = useRef(null); // WebSocket reference for code generation
    const abortControllerRef = useRef(null);
    const appIdRef = useRef(null); // current app id for section-wise save
    useEffect(() => { appIdRef.current = appId; }, [appId]);

    // State for new planning steps
    const [generatedUIUX, setGeneratedUIUX] = useState('');

    // Generic function to append to AI message
    const appendAi = useRef((delta) => {
        setMessages(prev => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIdx = next.map(m => m.role).lastIndexOf('ai');
            if (lastIdx === -1) return prev;
            next[lastIdx] = { ...next[lastIdx], content: (next[lastIdx].content || "") + delta };
            return next;
        });
    }).current;

    // We can't use useRef for state updater inside async usually if state changes. 
    // Let's use a useCallback that gets fresh state or just use the setMessages functional update as before.

    // Renamed to be specific to PRD start
    const handleStartPlanning = async (text) => {
        // Cancel previous if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const newMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, newMessage, { role: 'ai', content: "" }]);
        setIsLoading(true);
        setActiveTab('Plan');
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

        const localProjectName = "generated_app_" + Date.now();
        setProjectName(localProjectName);

        // Create app record in DB (user_email from localStorage)
        let createdAppId = null;
        const userEmail = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}')?.email || '') : '';
        if (userEmail) {
            try {
                const appName = (text || '').slice(0, 100) || localProjectName;
                const createRes = await fetch(`${apiBase}/api/app-builder/apps`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_email: userEmail,
                        app_name: appName,
                        prompt: text,
                        project_name: localProjectName,
                    }),
                });
                const createData = await createRes.json();
                if (createData.status === 'success' && createData.app?.id) {
                    createdAppId = createData.app.id;
                    setAppId(createData.app.id);
                }
            } catch (e) {
                console.error('Error creating app record:', e);
            }
        }

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

        let lastPrd = '';
        try {
            append("Starting PRD generation...\n\n");

            // Call new planning API for PRD
            await streamPlanningStep('prd', { requirement: text }, append, (data) => {
                if (data.event === 'prd_chunk') setPrd(prev => prev + data.data);
                if (data.event === 'prd_complete') {
                    lastPrd = data.data || '';
                    setPrd(lastPrd);
                }
            });

            append("PRD complete. Please review and proceed to UI/UX Design.\n");

            // Update app in DB with PRD
            if (createdAppId && userEmail && lastPrd) {
                try {
                    await fetch(
                        `${apiBase}/api/app-builder/apps/${createdAppId}?user_email=${encodeURIComponent(userEmail)}`,
                        {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prd: lastPrd }),
                        }
                    );
                } catch (e) {
                    console.error('Error updating app with PRD:', e);
                }
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                append("\n🛑 Process stopped by user.\n");
            } else {
                console.error('Error in PRD generation:', error);
                append(`\nError: ${error.message}\n`);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
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
            const response = await fetch(`${apiBase}/api/planning/${step}`, {
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
                    try {
                        const data = JSON.parse(line);
                        if (data.event === 'start') append(`${data.message}\n`);
                        if (data.event === 'error') throw new Error(data.message);

                        onData(data); // Callback for specific data handling

                    } catch (e) {
                        console.error("JSON parse error", e);
                    }
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
            await streamPlanningStep('uiux', { requirement: currentRequirement, prd }, append, (data) => {
                if (data.event === 'uiux_chunk') setGeneratedUIUX(prev => prev + data.data);
                if (data.event === 'uiux_complete') {
                    lastUIUX = data.data || '';
                    setGeneratedUIUX(lastUIUX);
                }
            });
            append("UI/UX Design complete.\n");
            if (lastUIUX) updateAppInDb({ generated_uiux: lastUIUX });
        } catch (e) {
            if (e.name === 'AbortError') append("\n🛑 Stopped by user.\n");
            else append(`Error: ${e.message}\n`);
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
            await streamPlanningStep('architecture', { requirement: currentRequirement, prd, uiux: generatedUIUX }, append, (data) => {
                if (data.event === 'architecture_chunk') setStreamingArchitectureText(prev => prev + data.data);
                if (data.event === 'architecture_complete') {
                    lastArch = data.data || null;
                    setGeneratedArchitecture(lastArch);
                    setCurrentPhase('prd_complete'); // Enable "Create Agents" button (no Master Plan step)
                }
            });
            append("Architecture complete.\n");
            if (lastArch != null) updateAppInDb({ architecture: lastArch });
        } catch (e) {
            if (e.name === 'AbortError') append("\n🛑 Stopped by user.\n");
            else append(`Error: ${e.message}\n`);
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
            await streamPlanningStep('plan', { requirement: currentRequirement, prd, architecture: generatedArchitecture }, append, (data) => {
                if (data.event === 'plan_step') setPlan(prev => [...prev, data.data]);
                if (data.event === 'plan_complete') {
                    lastPlan = data.data || null;
                    setGeneratedPlan(lastPlan);
                    setCurrentPhase('prd_complete'); // Enable "Create Agents" button
                }
            });
            append("Plan complete. Ready to build.\n");
            if (lastPlan != null) updateAppInDb({ plan: lastPlan });
        } catch (e) {
            if (e.name === 'AbortError') append("\n🛑 Stopped by user.\n");
            else append(`Error: ${e.message}\n`);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleCreateAgents = async () => {
        setIsLoading(true);
        setCurrentPhase('agents');
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
            appendAi("\n\nStarting agent execution...\n\n");
            await executeAgentsWithWebSocket(currentRequirement, generatedPlan, projectName, prd, appendAi);
        } catch (error) {
            console.error('Error in agent execution:', error);
            appendAi(`\nError: ${error.message}\n`);
            setCurrentPhase('prd_complete');
        } finally {
            setIsLoading(false);
        }
    };

    const executeAgentsWithWebSocket = async (requirement, plan, projectName, prdText, appendAi) => {
        return new Promise((resolve, reject) => {
            const sessionId = `session_${Date.now()}`;
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = apiBase.replace('http://', '').replace('https://', '');
            const wsUrl = `${wsProtocol}//${wsHost}/api/agents/execute/${sessionId}`;

            appendAi(`Connecting to agent execution service...\n`);

            const ws = new WebSocket(wsUrl);
            agentsWsRef.current = ws;

            ws.onopen = () => {
                appendAi("Connected to agents.\n\n");

                // Send initial request with PRD
                ws.send(JSON.stringify({
                    requirement,
                    plan,
                    prd: prdText || "",  // Include PRD text
                    uiux: generatedUIUX || "",
                    project_name: projectName
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.event === 'execution_start') {
                        appendAi(`${data.message}\n\n`);
                    }

                    if (data.event === 'agent_start') {
                        setAgents(prev => ({
                            ...prev,
                            [data.agent]: {
                                status: 'running',
                                message: data.message,
                                progress: [{ type: 'start', text: data.message, timestamp: Date.now() }],
                                started_at: Date.now()
                            }
                        }));
                        appendAi(`${data.agent}: ${data.message}\n`);
                    }

                    if (data.event === 'agent_progress') {
                        setAgents(prev => ({
                            ...prev,
                            [data.agent]: {
                                ...prev[data.agent],
                                message: data.message,
                                progress: [
                                    ...(prev[data.agent]?.progress || []),
                                    { type: 'progress', text: data.message, timestamp: Date.now() }
                                ]
                            }
                        }));
                        appendAi(`  ${data.message}\n`);
                    }

                    if (data.event === 'agent_complete') {
                        setAgents(prev => ({
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
                        }));
                        appendAi(`${data.agent}: ${data.message}\n\n`);

                        // Save architecture and auto-start code generation after architecture agent
                        if ((data.agent === 'planning_agent_step3_arch' || data.agent === 'architecture_agent') && data.data) {
                            setGeneratedArchitecture(data.data);
                            appendAi("Starting code generation automatically...\n\n");
                            setIsCodegenLoading(true);
                            setActiveTab('Build');
                            setActiveBuildTab('Multi Agents');
                            executeCodegenWithWebSocket(requirement, plan, data.data, projectName, appendAi)
                                .then(() => setIsCodegenLoading(false))
                                .catch((err) => {
                                    console.error('Auto code generation error:', err);
                                    appendAi(`\nCode generation error: ${err.message}\n`);
                                    setIsCodegenLoading(false);
                                });
                        }
                    }

                    if (data.event === 'agent_error') {
                        setAgents(prev => ({
                            ...prev,
                            [data.agent]: {
                                ...prev[data.agent],
                                status: 'error',
                                error: data.error
                            }
                        }));
                        appendAi(`${data.agent} error: ${data.error}\n\n`);
                    }

                    if (data.event === 'all_complete') {
                        appendAi(`\n${data.message}\n`);
                        appendAi(`Project: ${data.data.project_name}\n`);
                        if (data.data?.files_count) {
                            appendAi(`Files generated: ${data.data.files_count}\n`);
                        }
                        appendAi("\n");
                        appendAi("All agents complete. Code generation runs automatically after architecture.\n");
                        setCurrentPhase('agents_complete');
                        ws.close();
                        resolve();
                    }

                    if (data.event === 'error') {
                        appendAi(`\nError: ${data.message}\n`);
                        ws.close();
                        reject(new Error(data.message));
                    }

                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                appendAi(`\nWebSocket connection error\n`);
                reject(error);
            };

            ws.onclose = () => {
                appendAi("Disconnected from agents\n");
                agentsWsRef.current = null;
            };
        });
    };

    const loadProjectTree = async (projName) => {
        try {
            const res = await fetch(`${apiBase}/api/app-builder/projects/${projName}/tree`);
            if (res.ok) {
                const data = await res.json();
                setFileTree(data.tree);
            }
        } catch (error) {
            console.error('Error loading project tree:', error);
        }
    };

    // Load app when editing (editId from route) – restore all section content
    useEffect(() => {
        if (!editId || !email) {
            setLoadingApp(false);
            return;
        }
        const loadApp = async () => {
            setLoadingApp(true);
            try {
                const res = await fetch(
                    `${apiBase}/api/app-builder/apps/${editId}?user_email=${encodeURIComponent(email)}`
                );
                const data = await res.json();
                if (data.status === 'success' && data.app) {
                    const app = data.app;
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

                    // Build initial messages summarizing loaded sections
                    const parts = [];
                    if (app.prompt) parts.push(`**Prompt:** ${app.prompt.slice(0, 150)}${app.prompt.length > 150 ? '...' : ''}`);
                    if (app.prd) parts.push('**PRD** loaded.');
                    if (app.generated_uiux) parts.push('**UI/UX Design** loaded.');
                    if (app.architecture) parts.push('**Architecture** loaded.');
                    if (planArr.length) parts.push('**Implementation Plan** loaded.');
                    const summary = parts.length ? parts.join('\n') : 'App loaded. Continue from the Plan tab.';

                    setMessages([
                        { role: 'user', content: app.prompt || '' },
                        { role: 'ai', content: summary }
                    ]);

                    // Set phase so Create Agents is available (after architecture; Master Plan removed)
                    if (planArr.length || app.architecture || app.prd) setCurrentPhase('prd_complete');
                }
            } catch (e) {
                console.error('Error loading app:', e);
            } finally {
                setLoadingApp(false);
            }
        };
        loadApp();
    }, [editId, email, apiBase]);

    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (agentsWsRef.current) agentsWsRef.current.close();
            if (codegenWsRef.current) codegenWsRef.current.close();
        };
    }, []);

    const loadFile = useCallback(async (path) => {
        if (!projectName) return null;
        const res = await fetch(`${apiBase}/api/app-builder/projects/${projectName}/file?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error(`Failed to load file: ${path}`);
        const data = await res.json();
        setFiles(prev => ({ ...prev, [path]: data.content }));
        return data.content;
    }, [apiBase, projectName]);

    const saveFile = useCallback(async (path, content) => {
        if (!projectName) throw new Error("No project yet");
        const res = await fetch(`${apiBase}/api/app-builder/projects/${projectName}/file`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, content })
        });
        if (!res.ok) throw new Error(`Failed to save file: ${path}`);
        setFiles(prev => ({ ...prev, [path]: content }));
        return true;
    }, [apiBase, projectName]);

    const [isRunLoading, setIsRunLoading] = useState(false);

    const handleDownloadCode = useCallback(async () => {
        if (!projectName) return;
        try {
            const response = await fetch(`${apiBase}/api/app-builder/projects/${projectName}/download`);
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
    }, [apiBase, projectName]);

    const handleRun = useCallback(async () => {
        if (!projectName) return;
        setLogs(prev => [...prev, `Starting project ${projectName}...`]);
        setIsRunLoading(true);
        setActiveTab('Logs'); // Show logs immediately

        try {
            const response = await fetch(`${apiBase}/api/app-builder/projects/${projectName}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ install: true })
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
                            setIsRunLoading(false); // Stop loading on error
                        }

                        if (data.event === 'ready') {
                            setRunState(data.data);
                            setActiveTab('Build');
                            setActiveBuildTab('Build'); // App View sub-tab
                            setLogs(prev => [...prev, `[System] ${data.message}`]);
                            setIsRunLoading(false); // Stop loading
                        }

                    } catch (e) {
                        console.error("Error parsing run event:", e);
                    }
                }
            }

        } catch (error) {
            console.error('Error starting project:', error);
            setLogs(prev => [...prev, `Error: ${error.message}`]);
            setIsRunLoading(false);
        }
    }, [apiBase, projectName]);

    const executeCodegenWithWebSocket = async (requirement, plan, architecture, project_name, appendAi) => {
        return new Promise((resolve, reject) => {
            const sessionId = `session_${Date.now()}`;
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = apiBase.replace('http://', '').replace('https://', '');
            const wsUrl = `${wsProtocol}//${wsHost}/api/codegen/execute/${sessionId}`;

            appendAi(`Connecting to code generation service...\n`);

            const ws = new WebSocket(wsUrl);
            codegenWsRef.current = ws;

            ws.onopen = () => {
                appendAi("Connected for code generation.\n\n");
                ws.send(JSON.stringify({
                    requirement,
                    plan,
                    prd,
                    architecture,
                    uiux: generatedUIUX || "",
                    project_name
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.event === 'generation_start') {
                        appendAi(`${data.message}\n\n`);
                    }

                    if (data.event === 'agent_start') {
                        setAgents(prev => ({
                            ...prev,
                            [data.agent]: {
                                status: 'running',
                                message: data.message,
                                progress: [{ type: 'start', text: data.message, timestamp: Date.now() }],
                                started_at: Date.now()
                            }
                        }));
                    }

                    if (data.event === 'agent_progress') {
                        setAgents(prev => ({
                            ...prev,
                            [data.agent]: {
                                ...prev[data.agent],
                                message: data.message,
                                progress: [
                                    ...(prev[data.agent]?.progress || []),
                                    { type: 'progress', text: data.message, timestamp: Date.now() }
                                ]
                            }
                        }));
                        appendAi(`  ${data.message}\n`);
                    }

                    if (data.event === 'agent_complete') {
                        setAgents(prev => ({
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
                        }));
                    }

                    if (data.event === 'codegen_complete') {
                        appendAi(`\n${data.message}\n`);
                        appendAi(`Files generated: ${data.data.files_count}\n\n`);
                        loadProjectTree(project_name);
                        setCurrentPhase('code_generated');
                        ws.close();
                        resolve();
                    }

                    if (data.event === 'error') {
                        appendAi(`\nError: ${data.message}\n`);
                        ws.close();
                        reject(new Error(data.message));
                    }

                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                appendAi(`\nWebSocket connection error\n`);
                reject(error);
            };

            ws.onclose = () => {
                appendAi("Disconnected from code generation\n");
                codegenWsRef.current = null;
            };
        });
    };

    const handleRegeneratePrd = () => {
        if (!currentRequirement) {
            alert("Missing requirement. Please enter your requirements again.");
            return;
        }
        if (window.confirm("Regenerate the PRD? This will reset UI/UX, architecture, and plan.")) {
            handleStartPlanning(currentRequirement);
        }
    };

    const handleRegeneratePlan = () => {
        if (window.confirm("Regenerate the plan based on the current PRD and architecture?")) {
            handleGeneratePlan();
        }
    };

    const handleRegenerateAgents = () => {
        if (window.confirm("Restart the agent execution pipeline?")) {
            handleCreateAgents();
        }
    };

    const handleStartCodegen = async () => {
        if (!projectName || !generatedArchitecture) {
            alert("Cannot start code generation: Missing project name or architecture.");
            return;
        }

        setIsCodegenLoading(true);
        setActiveTab('Build');
        setActiveBuildTab('Multi Agents');

        const appendAi = (delta) => {
            setMessages(prev => {
                const next = [...prev];
                const lastIdx = next.map(m => m.role).lastIndexOf('ai');
                if (lastIdx !== -1) {
                    next[lastIdx] = { ...next[lastIdx], content: (next[lastIdx].content || "") + delta };
                } else {
                    return [...prev, { role: 'ai', content: delta }];
                }
                return next;
            });
        };

        try {
            appendAi("\n\nStarting code generation...\n\n");
            await executeCodegenWithWebSocket(currentRequirement, generatedPlan, generatedArchitecture, projectName, appendAi);
            appendAi("\nCode generation complete.\n");
        } catch (error) {
            console.error('Error in code generation:', error);
            appendAi(`\nError: ${error.message}\n`);
        } finally {
            setIsCodegenLoading(false);
        }
    };

    const handleRestartCodegen = async () => {
        if (!window.confirm("Restart code generation based on current architecture?")) return;
        await handleStartCodegen();
    };

    if (loadingApp) {
        return (
            <div className="app-builder-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <header style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/app-builder')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}
                    >
                        ← Back to App Builder
                    </button>
                </header>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Spinner animation="border" />
                        <p style={{ marginTop: '1rem' }}>Loading app...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-builder-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <header style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff' }}>
                <button
                    type="button"
                    onClick={() => navigate('/app-builder')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}
                >
                    ← Back to App Builder
                </button>
            </header>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <ChatInterface
                    onSendMessage={handleStartPlanning}
                    messages={messages}
                    isLoading={isLoading}
                />
                <TabPanel
                    plan={plan}
                    prd={prd}
                    generatedUIUX={generatedUIUX}
                    generatedArchitecture={generatedArchitecture}
                    fileTree={fileTree}
                    files={files}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    activeBuildTab={activeBuildTab}
                    onBuildTabChange={setActiveBuildTab}
                    onDownloadCode={handleDownloadCode}
                    onRun={handleRun}
                    projectName={projectName}
                    agents={agents}
                    logs={logs}
                    runState={runState}
                    onLoadFile={loadFile}
                    onSaveFile={saveFile}
                    currentPhase={currentPhase}
                    onGenerateUIUX={handleGenerateUIUX}
                    onGenerateArch={handleGenerateArch}
                    onGeneratePlan={handleGeneratePlan}
                    onCreateAgents={handleCreateAgents}
                    onStartCodegen={handleStartCodegen}
                    onRestartCodegen={handleRestartCodegen}
                    onRegeneratePrd={handleRegeneratePrd}
                    onRegeneratePlan={handleRegeneratePlan}
                    onRegenerateAgents={handleRegenerateAgents}
                    isLoading={isLoading}
                    isCodegenLoading={isCodegenLoading}
                    isRunLoading={isRunLoading}
                    streamingArchitectureText={streamingArchitectureText}
                    onStopPlanning={handleStopPlanning}
                    onStopCodegen={handleStopCodegen}
                />
            </div>
        </div>
    );
};

export default AppBuilder;
