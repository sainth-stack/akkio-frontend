import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const ModelSelector = ({ value, onChange, disabled }) => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('/app-builder/models');
                const data = res.data;
                if (!cancelled && data?.models) {
                    setModels(data.models);
                    if (!value && data.default_model) {
                        onChange?.(data.default_model);
                    }
                }
            } catch (e) {
                console.error('Failed to load models:', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="model-selector" style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', fontWeight: 500 }}>
                <span>Model</span>
                <select
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    disabled={disabled || loading}
                    style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        background: disabled ? '#f1f5f9' : '#fff',
                    }}
                >
                    {loading && <option value="">Loading...</option>}
                    {!loading && models.length === 0 && <option value="">Default</option>}
                    {models.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
            </label>
        </div>
    );
};

export default ModelSelector;
