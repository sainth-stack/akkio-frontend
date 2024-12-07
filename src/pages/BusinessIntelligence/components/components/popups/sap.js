import { useState } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import './sap.css';
import { akkiourl, transformData } from '../../../../../utils/const';
import { useDataAPI } from '../../contexts/GetDataApi';
import { useNavigate } from 'react-router-dom';

const SapConfig = ({ setSapOpen, onDataReceived }) => {
    const [form] = Form.useForm();
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [showTableSelect, setShowTableSelect] = useState(false);
    const { uploadedData, handleUpload, showContent } = useDataAPI()
    const navigate = useNavigate()
    // Set default values
    useState(() => {
        form.setFieldsValue({
            username: 'DBADMIN',
            password: 'Greddy@123',
            host: 'd256c191-2360-4567-a61e-069cf7b83ea9.hana.trial-us10.hanacloud.ondemand.com',
            port: '443'
        });
    }, [form]);

    const handleConnect = async (values) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${akkiourl}/hana_connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(values)
            });

            if (!response.ok) {
                throw new Error('Connection failed');
            }

            const data = await response.json();
            setIsConnected(true);
            message.success('Connected to SAP HANA successfully');

            // Parseand set tables data
            if (data.tables) {
                const parsedTables = JSON.parse(data.tables);
                const tableNames = parsedTables.DATA_NAME;
                setTables(Object.values(tableNames));
                setShowTableSelect(true);
            }
        } catch (error) {
            message.error(`Failed to connect: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        setIsConnected(false);
        message.success('Disconnected from SAP HANA');
        form.resetFields();
    };

    const handleTableSelect = async () => {
        if (!selectedTable) {
            message.error('Please select a table');
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`${akkiourl}/hana_dataread`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    tablename: selectedTable
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch table data');
            }

            const data = await response.json();
            if (response.status === 200) {
                localStorage.setItem("filename", selectedTable)
                localStorage.setItem('prepData', JSON.stringify(data));
                await showContent({
                    filename: selectedTable, headers: Object.keys(data), data: transformData(data)
                })
                navigate("/discover")
                handleUpload(null, true, data, selectedTable);
            }
            setSapOpen(false);
        } catch (error) {
            message.error(`Failed to fetch table data: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const onFinish = (values) => {
        handleConnect(values);
    };

    return (
        <div className="sap-config-backdrop">
            <div className="sap-config">
                <h2>SAP HANA Configuration</h2>
                {!showTableSelect ? (
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            label="Username"
                            name="username"
                            rules={[{ required: true, message: 'Please enter username' }]}
                        >
                            <Input placeholder="DBADMIN" />
                        </Form.Item>
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: 'Please enter password' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            label="Host"
                            name="host"
                            rules={[{ required: true, message: 'Please enter host' }]}
                        >
                            <Input placeholder="hostname" />
                        </Form.Item>
                        <Form.Item
                            label="Port"
                            name="port"
                            rules={[{ required: true, message: 'Please enter port' }]}
                        >
                            <Input placeholder="443" />
                        </Form.Item>
                        <Form.Item>
                            {isConnected ? (
                                <Button
                                    type="primary"
                                    danger
                                    onClick={handleDisconnect}
                                >
                                    Disconnect
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={isLoading}
                                >
                                    Connect
                                </Button>
                            )}
                            <Button
                                onClick={() => setSapOpen(false)}
                                style={{ marginLeft: '10px' }}
                            >
                                Close
                            </Button>
                        </Form.Item>
                        {isConnected && (
                            <div className="connection-status">
                                <span style={{ color: 'green' }}>● Connected</span>
                            </div>
                        )}
                    </Form>
                ) : (
                    <Form layout="vertical">
                        <Form.Item
                            label="Select Table"
                            rules={[{ required: true, message: 'Please select a table' }]}
                        >
                            <Select
                                placeholder="Select a table"
                                onChange={setSelectedTable}
                                value={selectedTable}
                            >
                                {tables.map((table, index) => (
                                    <Select.Option key={index} value={table}>
                                        {table}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                onClick={handleTableSelect}
                                loading={isLoading}
                            >
                                Continue
                            </Button>
                            <Button
                                onClick={() => setSapOpen(false)}
                                style={{ marginLeft: '10px' }}
                            >
                                Close
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </div>
        </div>
    );
};

export default SapConfig;
