export const BUILDER_KIND_APP = 'app';
export const BUILDER_KIND_FULLSTACK = 'fullstack';

const APP_CONFIG = {
    kind: BUILDER_KIND_APP,
    label: 'App Builder',
    listPath: '/app-builder',
    newPath: '/app-builder/new',
    editPath: (id) => `/app-builder/edit/${id}`,
    listTitle: 'Applications',
    newCardLabel: 'New app',
    searchPlaceholder: 'Search apps...',
    chatTitle: 'App Builder',
    chatWelcome: "Hi! I'm your App Architect. Describe the app you want to build, and I'll generate the plan and code for you.",
    chatUpdateTitle: 'Update App',
    backLabel: 'Back to App Builder',
    planSteps: ['prd', 'uiux', 'style', 'arch'],
    autoDesignSystem: false,
};

const FULLSTACK_CONFIG = {
    kind: BUILDER_KIND_FULLSTACK,
    label: 'Agentic Builder',
    listPath: '/agentic-builder',
    newPath: '/agentic-builder/new',
    editPath: (id) => `/agentic-builder/edit/${id}`,
    listTitle: 'Agentic apps',
    newCardLabel: 'New agentic app',
    searchPlaceholder: 'Search agentic apps...',
    chatTitle: 'Agentic Builder',
    chatWelcome: "Hi! I'm your Agentic Architect. Describe the production app you want — I'll write a PRD, UI/UX, architecture, then generate frontend, backend, and integration with mock fallback if APIs fail.",
    chatUpdateTitle: 'Update Agentic App',
    backLabel: 'Back to Agentic Builder',
    planSteps: ['prd', 'uiux', 'arch'],
    autoDesignSystem: true,
    lockedStack: {
        frontend: ['React', 'TypeScript', 'Vite', 'Material UI', 'React Router', 'TanStack Query', 'Recharts'],
        backend: ['Python', 'FastAPI', 'Pydantic', 'SQLAlchemy', 'PostgreSQL', 'REST', 'JWT'],
    },
};

export function getBuilderConfig(kind) {
    return kind === BUILDER_KIND_FULLSTACK ? FULLSTACK_CONFIG : APP_CONFIG;
}

export function isFullstackKind(kind) {
    return kind === BUILDER_KIND_FULLSTACK;
}
