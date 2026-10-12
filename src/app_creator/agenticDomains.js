/** Agentic Builder — user-selected app domain (not LLM-inferred). */

export const AGENTIC_DOMAIN_RETAIL = 'retail';
export const AGENTIC_DOMAIN_MANUFACTURING = 'manufacturing';

export const AGENTIC_DOMAINS = [
    {
        id: AGENTIC_DOMAIN_RETAIL,
        label: 'Retail (E-Commerce)',
        description: 'Online store, catalog, cart, orders, customers',
    },
    {
        id: AGENTIC_DOMAIN_MANUFACTURING,
        label: 'Manufacturing',
        description: 'Production, OEE, quality, work orders, plant KPIs',
    },
];

export function getAgenticDomainLabel(id) {
    return AGENTIC_DOMAINS.find((d) => d.id === id)?.label || 'Select domain';
}
