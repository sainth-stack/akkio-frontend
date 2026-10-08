import React from 'react';
import ChatSidebarSection from './ChatSidebarSection';
import { SAMPLE_PROMPT_TEMPLATES } from './utils/samplePromptTemplates';
import './SamplePromptTemplates.css';

export default function SamplePromptTemplates({ onSelect, disabled }) {
    const count = SAMPLE_PROMPT_TEMPLATES.length;

    return (
        <ChatSidebarSection
            title="Prompt templates"
            summary={`${count} samples`}
            defaultOpen={false}
        >
            <p className="sample-prompt-templates__hint">Read the sample below, then use it in the chat input.</p>
            <div className="sample-prompt-templates__list">
                {SAMPLE_PROMPT_TEMPLATES.map((t) => (
                    <article key={t.id} className="sample-prompt-templates__card">
                        <header className="sample-prompt-templates__card-head">
                            <div>
                                <h3 className="sample-prompt-templates__item-title">{t.title}</h3>
                                <p className="sample-prompt-templates__item-sub">{t.subtitle}</p>
                            </div>
                            <button
                                type="button"
                                className="sample-prompt-templates__use"
                                disabled={disabled}
                                onClick={() => onSelect && onSelect(t.prompt)}
                            >
                                Use
                            </button>
                        </header>
                        <pre className="sample-prompt-templates__preview">{t.prompt}</pre>
                    </article>
                ))}
            </div>
        </ChatSidebarSection>
    );
}
