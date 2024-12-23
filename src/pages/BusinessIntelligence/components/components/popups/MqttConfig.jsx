import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import './MqttConfig.css';
import { transformData } from '../../../../../utils/const';
import { useDataAPI } from '../../contexts/GetDataApi';
import { useNavigate } from 'react-router-dom';

const MqttConfig = ({ setMqttOpen, onDataReceived }) => {
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);
    const { uploadedData, handleUpload, showContent } = useDataAPI()
    const navigate = useNavigate()

    useEffect(() => {
        // Set default form values
        form.setFieldsValue({
            flespi_URL: 'https://flespi.io/gw/devices/5439260/messages',
            flespi_token: 'axLBthbazeJkKKkpr2sVK9rAeXfFJGmH1V9k18iqaSyKqHYHzetadIyitBL15WyU'
        });
    }, [form]);

    const handleFetchData = async () => {
        try {
            setIsLoading(true);
            const formValues = await form.validateFields();
            
            const response = await fetch('http://54.255.151.153:3001/api/download_flespi_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    flespi_URL: formValues.flespi_URL,
                    flespi_token: formValues.flespi_token
                })
            });

            const rawData = await response.json();

            // Transform the data
            const transformedData = rawData?.data.map(item => {
                const transformed = { ...item };

                // Transform specific fields with units
                const unitsMap = {
                    'Current': { unit: 'A' },
                    'Humidity': { unit: '%' },
                    'Power': { unit: 'W' },
                    'Temperature': { unit: 'C' },
                    'Voltage': { unit: 'V' }
                };

                Object.keys(unitsMap).forEach(key => {
                    if (key in transformed) {
                        transformed[key] = transformed[key]?.value
                    }
                });

                return transformed;
            });

            localStorage.setItem("filename", "MQTT_HistoryData")
            localStorage.setItem('prepData', JSON.stringify(transformedData));
            localStorage.setItem('selectedTable', "MQTT_HistoryData")
            await showContent({
                filename: "MQTT_HistoryData", 
                headers: Object.keys(transformedData[0]), 
                data: transformData(transformedData)
            })
            navigate("/discover")
            handleUpload(null, true, transformedData, "MQTT_HistoryData");
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error(`Failed to fetch data: ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="mqtt-config-backdrop">
            <div className="mqtt-config">
                <h2>IOT Data Configuration</h2>
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="IOT URL"
                        name="flespi_URL"
                        rules={[{ required: true, message: 'Please input the Flespi URL!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="IOT Token"
                        name="flespi_token"
                        rules={[{ required: true, message: 'Please input the Flespi token!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            onClick={handleFetchData}
                            loading={isLoading}
                        >
                            Connect
                        </Button>
                        <Button
                            onClick={() => setMqttOpen(false)}
                            style={{ marginLeft: '10px' }}
                        >
                            Close
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default MqttConfig;