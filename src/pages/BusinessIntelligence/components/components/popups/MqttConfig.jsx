import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import mqtt from 'mqtt';
import './MqttConfig.css';

const MqttConfig = ({ setMqttOpen, onDataReceived }) => {
    const [form] = Form.useForm();
    const [client, setClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        return () => {
            if (client) {
                client.end();
            }
        };
    }, [client]);

    const handleDisconnect = () => {
        if (client) {
            client.end();
            setClient(null);
            setIsConnected(false);
            message.success('Disconnected from MQTT broker');
            form.resetFields();
        }
    };

    const handleConnect = async (values) => {
        try {
            setIsLoading(true);
            const { broker, topic, username, password } = values;

            if (!broker.startsWith('ws://') && !broker.startsWith('wss://')) {
                throw new Error('Broker URL must start with ws:// or wss://');
            }

            const mqttClient = mqtt.connect(broker, {
                username,
                password,
                reconnectPeriod: 5000,
                connectTimeout: 30000,
                clean: true,
            });

            mqttClient.on('connect', () => {
                setIsConnected(true);
                setIsLoading(false);
                message.success('Connected to MQTT broker');

                const topics = [
                    topic,
                    `${topic}/response`
                ];

                topics.forEach(t => {
                    mqttClient.subscribe(t, { qos: 1 }, (err) => {
                        if (err) {
                            message.error(`Failed to subscribe to topic: ${err.message}`);
                            return;
                        }
                        message.success(`Subscribed to topic: ${t}`);
                    });
                });

                mqttClient.publish(`${topic}/request`, JSON.stringify({
                    type: 'history',
                    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    endTime: new Date().toISOString()
                }));
            });

            mqttClient.on('message', (receivedTopic, payload) => {
                try {
                    console.log('Received topic:', receivedTopic);
                    console.log('Raw payload:', payload);
                    let messageStr;
                    
                    if (payload instanceof Buffer || payload instanceof Uint8Array) {
                        messageStr = payload.toString('utf8');
                        
                        const jsonStartIndex = messageStr.indexOf('{');
                        if (jsonStartIndex !== -1) {
                            messageStr = messageStr.slice(jsonStartIndex);
                        }
                    } else {
                        messageStr = payload.toString();
                    }

                    console.log('Parsed message string:', messageStr);
                    const data = JSON.parse(messageStr);
                    
                    const dataArray = Array.isArray(data) ? data : [data];
                    console.log('Processed data array:', dataArray);

                    onDataReceived({
                        filename: `mqtt_${receivedTopic.replace(/[/+]/g, '_')}`,
                        data: dataArray,
                    });
                } catch (error) {
                    console.error('Error processing message:', error);
                    message.error(`Invalid data format received: ${error.message}`);
                }
            });

            mqttClient.on('error', (err) => {
                message.error(`MQTT connection error: ${err.message}`);
                setIsConnected(false);
                setIsLoading(false);
            });

            mqttClient.on('offline', () => {
                message.warning('MQTT connection lost, attempting to reconnect...');
                setIsConnected(false);
            });

            setClient(mqttClient);
        } catch (error) {
            message.error(`Failed to connect: ${error.message}`);
            setIsLoading(false);
        }
    };

    const onFinish = (values) => {
        handleConnect(values);
    };

    return (
        <div className="mqtt-config-backdrop">
            <div className="mqtt-config">
                <h2>MQTT Configuration</h2>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Broker URL"
                        name="broker"
                        rules={[{ required: true, message: 'Please enter broker URL' }]}
                    >
                        <Input placeholder="ws://broker.example.com:8083" />
                    </Form.Item>
                    <Form.Item
                        label="Topic"
                        name="topic"
                        rules={[{ required: true, message: 'Please enter topic' }]}
                    >
                        <Input placeholder="flespi/state/gw/devices/+/telemetry/+" />
                    </Form.Item>
                    <Form.Item label="Username" name="username">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Password" name="password">
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        {isConnected ? (
                            <Button
                                type="primary"
                                danger
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDisconnect();
                                }}
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
                            onClick={() => {
                                handleDisconnect();
                                setMqttOpen(false);
                            }}
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
            </div>
        </div>
    );
};

export default MqttConfig; 