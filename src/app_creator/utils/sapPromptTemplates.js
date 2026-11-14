/**
 * SAP Similarity Tickets — two short prompts (step 1 dashboard, step 2 RAG).
 */
import { AGENTIC_DOMAIN_SAP } from '../agenticDomains';

export const SAP_PROMPT_STEP1 = `Create my SAP Similarity Tickets dashboard.

Include KPI cards for ticket volume and a Community-style list where I can search tickets.

Seed 10 example tickets for now. Add the chat assistant in the app — we will load real SAP context in the next step.`;

export const SAP_PROMPT_STEP2 = `Step 2 — load SAP ticket data and context.

For each ticket, search SAP Community and build per-ticket RAG (first hit + suggested answer).

Refresh the dashboard and assistant so answers use that live context.`;

export const SAP_PROMPT_TEMPLATES = [
    {
        id: 'sap_step1_dashboard',
        title: 'Step 1 — Dashboard',
        subtitle: 'Send first, then Generate Code',
        step: 1,
        prompt: SAP_PROMPT_STEP1,
    },
    {
        id: 'sap_step2_rag',
        title: 'Step 2 — SAP data & RAG',
        subtitle: 'Send after app exists (triggers RAG agent)',
        step: 2,
        prompt: SAP_PROMPT_STEP2,
    },
];

export function sapTemplatesForDomain(domainId) {
    return domainId === AGENTIC_DOMAIN_SAP ? SAP_PROMPT_TEMPLATES : [];
}