import React from 'react';
import ChatSidebarSection from './ChatSidebarSection';
import { AGENTIC_DOMAINS, getAgenticDomainLabel } from './agenticDomains';

/**
 * Required for Agentic Builder — pick retail vs manufacturing before describing the app.
 */
const DomainSelector = ({ value, onChange, disabled, required }) => {
    const summary = value ? getAgenticDomainLabel(value) : (required ? 'Required' : 'Not set');

    return (
        <ChatSidebarSection
            title="App domain"
            summary={summary}
            defaultOpen={!value}
            className="domain-selector-section"
        >
            <p className="domain-selector-hint">
                Choose the industry template. Prompts outside this domain (e.g. task manager) will be rejected.
            </p>
            <select
                className="domain-selector-select"
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                aria-label="App domain"
                required={required}
            >
                <option value="" disabled>Select domain…</option>
                {AGENTIC_DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                        {d.label}
                    </option>
                ))}
            </select>
            {value && (
                <p className="domain-selector-desc">
                    {AGENTIC_DOMAINS.find((d) => d.id === value)?.description}
                </p>
            )}
        </ChatSidebarSection>
    );
};

export default DomainSelector;
