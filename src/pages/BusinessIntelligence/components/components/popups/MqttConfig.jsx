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
            topic: 'flespi/message/gw/devices/5439260',
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
                reconnectPeriod: 5000,
                connectTimeout: 30000,
                clean: true,
                protocolVersion: 4,
                keepalive: 60
            });

            mqttClient.on('connect', () => {
                console.log('MQTT Client connected');
                setIsConnected(true);
                setIsLoading(false);
                message.success('Connected to MQTT broker');
                
                mqttClient.subscribe('#', { qos: 0 }, (err) => {
                    if (err) {
                        console.error('Subscription error:', err);
                        message.error(`Failed to subscribe: ${err.message}`);
                    } else {
                        console.log('Subscription successful');
                        console.log('Topic:', '#');
                        console.log('Connection options:', mqttClient.options);
                    }
                });
            });

            mqttClient.on('message', (receivedTopic, payload) => {
                console.log('=== Message Handler Start ===');
                console.log('Message received on topic:', receivedTopic);
                console.log('Payload type:', typeof payload);

                try {
                    let messageStr;
                    if (payload instanceof Uint8Array || Buffer.isBuffer(payload)) {
                        try {
                            messageStr = new TextDecoder().decode(payload);
                        } catch (e) {
                            messageStr = Array.from(payload)
                                .map(byte => byte.toString(16).padStart(2, '0'))
                                .join('');
                            console.log('Binary data converted to hex:', messageStr);
                            message.info('Received binary data');
                            return;
                        }
                    } else {
                        messageStr = payload.toString();
                    }

                    // Continue with JSON parsing only if we have text data
                    if (messageStr.trim()) {
                        // Try to extract JSON if the message contains it
                        const jsonStartIndex = messageStr.indexOf('{');
                        const jsonEndIndex = messageStr.lastIndexOf('}');
                        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                            messageStr = messageStr.slice(jsonStartIndex, jsonEndIndex + 1);
                            console.log('Extracted JSON string:', messageStr);
                        }

                        const data = JSON.parse(messageStr);
                        console.log('Successfully parsed JSON data:', data);

                        const dataArray = Array.isArray(data) ? data : [data];
                        
                        onDataReceived({
                            filename: `mqtt_${receivedTopic.replace(/[/#+]/g, '_')}`,
                            data: dataArray,
                        });
                    }
                } catch (error) {
                    console.error('=== Message Handler Error ===');
                    console.error('Error details:', error);
                    console.error('Raw payload that caused error:', 
                        payload instanceof Uint8Array || Buffer.isBuffer(payload) ?
                        Array.from(payload).map(b => b.toString(16).padStart(2, '0')).join('') :
                        payload.toString()
                    );
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
                        <Input placeholder="wss://mqtt.flespi.io:443" />
                    </Form.Item>
                    <Form.Item
                        label="Topic"
                        name="topic"
                        rules={[{ required: true, message: 'Please enter topic' }]}
                    >
                        <Input placeholder="flespi/message/gw/devices/#" />
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