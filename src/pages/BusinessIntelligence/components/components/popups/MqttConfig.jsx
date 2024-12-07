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

    useEffect(() => {
        form.setFieldsValue({
            broker: 'wss://mqtt.flespi.io:443',
            topic: `flespi/storage/messages/gw/devices/5439260/response`,
            username: 'axLBthbazeJkKKkpr2sVK9rAeXfFJGmH1V9k18iqaSyKqHYHzetadIyitBL15WyU',
            password: ''
        });
    }, [form]);

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

            const mqttClient = mqtt.connect(broker, {
                username,
                password,
                clean: true
            });

            mqttClient.on('connect', () => {
                setIsConnected(true);
                setIsLoading(false);
                message.success('Connected to MQTT broker');

                const topics = [
                    `flespi/storage/messages/gw/devices/5439260/response`,
                    `flespi/storage/messages/gw/devices/5439260/get`
                ];
                
                topics.forEach(topic => {
                    mqttClient.subscribe(topic, { qos: 0 }, (err) => {
                        if (err) {
                            console.error('Subscription error:', err);
                            message.error(`Failed to subscribe to ${topic}: ${err.message}`);
                        } else {
                            console.log(`Successfully subscribed to ${topic}`);
                        }
                    });
                });

                const historyRequest = {
                    from: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000), // Past 24 hours
                    to: Math.floor(Date.now() / 1000), // Current time
                    limit: 100,
                    fields: ['timestamp', 'position.latitude', 'position.longitude', 'position.speed']
                };

                console.log('Requesting history with:', historyRequest);
                mqttClient.publish(
                    `flespi/storage/messages/gw/devices/5439260/get`,
                    JSON.stringify(historyRequest),
                    { qos: 0 }
                );
            });

            mqttClient.on('message', (receivedTopic, payload) => {
                console.log('Message received on topic:', receivedTopic);
                console.log('Raw payload:', payload.toString());
                
                try {
                    const messageStr = payload.toString();
                    const data = JSON.parse(messageStr);
                    console.log('Parsed data:', data);

                    if (!data || (Array.isArray(data) && data.length === 0)) {
                        message.warning('No historical data available for the specified time range');
                        return;
                    }

                    const dataArray = Array.isArray(data) ? data : [data];
                    onDataReceived({
                        filename: `mqtt_history_${new Date().toISOString()}`,
                        data: dataArray,
                    });
                } catch (error) {
                    console.error('Error processing message:', error);
                    message.error(`Error processing message: ${error.message}`);
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
                        <Input placeholder="wss://mqtt.flespi.io:443" />
                    </Form.Item>
                    <Form.Item
                        label="Topic"
                        name="topic"
                        rules={[{ required: true, message: 'Please enter topic' }]}
                    >
                        <Input placeholder="flespi/storage/messages/gw/devices/5439260/response" />
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