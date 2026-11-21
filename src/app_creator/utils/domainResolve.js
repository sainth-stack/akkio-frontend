/** Align sidebar domain with the prompt (SAP dropdown + manufacturing PRD → manufacturing). */
import { AGENTIC_DOMAIN_MANUFACTURING, AGENTIC_DOMAIN_SAP } from '../agenticDomains';
import { isSupplyChainContext } from './supplyChainDetect';

function textLooksLikeSapSimilarity(text) {
    const low = String(text || '').toLowerCase();
    return (
        /\bsap\b.*\b(similar|similarity|ticket)/.test(low)
        || /\bsimilarity tickets\b/.test(low)
        || (low.includes('sap community') && low.includes('ticket'))
    );
}

function textLooksLikeManufacturingOps(text) {
    const low = String(text || '').toLowerCase();
    return (
        isSupplyChainContext(null, '', text)
        || /\b(oee|mtbf|mttr|work order|downtime|manufacturing|supply chain|vendor)\b/.test(low)
        || /\bmanufacturing\s+(inventory|supply|vendor|procurement)\b/.test(low)
        || /\b(dashboard,\s*analytics,\s*reports?)\b/.test(low)
    );
}

/**
 * @param {string} selectedDomain
 * @param {string} [requirement]
 * @param {string} [prd]
 */
export function resolveEffectiveDomain(selectedDomain, requirement = '', prd = '') {
    const blob = `${requirement}\n${prd}`;
    if (selectedDomain === AGENTIC_DOMAIN_SAP) {
        if (textLooksLikeManufacturingOps(blob) && !textLooksLikeSapSimilarity(blob)) {
            return AGENTIC_DOMAIN_MANUFACTURING;
        }
    }
    return selectedDomain;
}

export function shouldUseSapCodegenPipeline(selectedDomain, requirement = '', prd = '', files = {}) {
    const effective = resolveEffectiveDomain(selectedDomain, requirement, prd);
    if (effective !== AGENTIC_DOMAIN_SAP) {
        return false;
    }
    if (textLooksLikeManufacturingOps(`${requirement}\n${prd}`) && !textLooksLikeSapSimilarity(`${requirement}\n${prd}`)) {
        return false;
    }
    return effective === AGENTIC_DOMAIN_SAP;
}