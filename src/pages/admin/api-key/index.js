import { useState, useEffect } from 'react';
import { Input, Button, message, Spin } from 'antd';
import axios from 'axios';
import { adminUrl } from '../../../utils/const';

const API_URL = adminUrl;

const ApiKeyManager = () => {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Fetch existing API key
    const fetchApiKey = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/get-token`);
            setApiKey(response.data.key);
        } catch (error) {
            message.error('Failed to fetch API key');
        } finally {
            setLoading(false);
        }
    };

    // Update API key
    const updateApiKey = async () => {
        if (!apiKey) {
            message.warning('API key cannot be empty');
            return;
        }
        setUpdating(true);
        try {
            await axios.put(`${API_URL}/update-token`, { key: apiKey });
            message.success('API key updated successfully');
        } catch (error) {
            message.error('Failed to update API key');
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        fetchApiKey();
    }, []);

    return (
        <div style={{ padding: '24px', maxWidth: '600px', margin: 'auto' }}>
            <h2>API Key Management</h2>
            {loading ? (
                <Spin />
            ) : (
                <Input.TextArea
                    rows={4}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                />
            )}
            <Button
                type="primary"
                onClick={updateApiKey}
                loading={updating}
                style={{ marginTop: '16px' }}
            >
                Update API Key
            </Button>
        </div>
    );
};

export default ApiKeyManager;
