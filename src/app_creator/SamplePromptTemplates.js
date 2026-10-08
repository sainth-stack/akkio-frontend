import React from 'react';
import { SAMPLE_PROMPT_TEMPLATES } from './utils/samplePromptTemplates';
import './SamplePromptTemplates.css';

export default function SamplePromptTemplates({ onSelect, disabled }) {
    return (
        <div className="sample-prompt-templates">
            <div className="sample-prompt-templates__head">
                <span className="sample-prompt-templates__label">Sample prompt templates</span>
                <span className="sample-prompt-templates__hint">Click to load — edit placeholders, then send</span>
            </div>
            <div className="sample-prompt-templates__list">
                {SAMPLE_PROMPT_TEMPLATES.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        className="sample-prompt-templates__item"
                        disabled={disabled}
                        onClick={() => onSelect && onSelect(t.prompt)}
                    >
                        <span className="sample-prompt-templates__item-title">{t.title}</span>
                        <span className="sample-prompt-templates__item-sub">{t.subtitle}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
