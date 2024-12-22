// src/pages/kpi/customized/index.js
import { useEffect, useState } from 'react';
import { Card, Input, Button, Row, Col, message, Spin, Typography, Collapse } from 'antd';
import { akkiourl } from '../../../utils/const';
import { LoadingOutlined } from '@ant-design/icons';
import '../index.css';
const { Title, Text } = Typography;

const DefaultKPIs = () => {
    const [prompt, setPrompt] = useState('');
    const [kpis, setKpis] = useState([]);
    const [processOptions, setProcessOptions] = useState([]);
    const [selectedKpiImage, setSelectedKpiImage] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);
    const [selectedKpiNames, setSelectedKpiNames] = useState([]);
    const [formData, setFormData] = useState({ type: '', classification: '' });
    const [classificationOptions, setClassification] = useState([])
    const typeOptions = processOptions;
console.log(selectedKpiNames)
    useEffect(() => {
        const fetchProcessTypes = async () => {
            try {
                const response = await fetch(`${akkiourl}/detect_type`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setProcessOptions([{ value: data.type.toLowerCase(), label: data.type }]);
                    const categories = data.categories.map((item) => {
                        return {
                            label: item.name,
                            value: item.name,
                            ...item
                        }
                    })
                    setClassification(categories)
                }
            } catch (error) {
                console.error('Error fetching process types:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProcessTypes();
    }, []);

    const handleChange = async (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (e.target.name === 'classification') {
            const kpi = classificationOptions.filter((item) => item.name === e.target.value);
            if (kpi.length > 0) {
                const kpiData = Object.values(kpi[0]['kpis']).map(item => ({
                    name: item.kpi_name,
                    description: item.description
                }));
                setKpis(kpiData);
            } else {
                setKpis([]);
            }
        }
    };

    const generateKPIImage = async (kpi) => {
        try {
            let kpiName=kpi?.name || ''
            setLoadingImage(true);
            setSelectedKpiNames(prev => [...prev, kpiName]);
            let data1 = [...selectedKpiImage, { name: kpiName, image: '', code: '', loading: true }]
            setSelectedKpiImage(data1);
            const response = await fetch(`${akkiourl}/generate_code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `kpi_names=${encodeURIComponent(kpiName)}`,
            });

            const data = await response.json();

            if (data.status === 'success') {
                if (Array.isArray(data.base64_images) && data.base64_images.length > 0) {
                    const finalData = data1.map((item) => {
                        if (item.name == kpiName) {
                            return ({
                                ...item,
                                loading: false,
                                name: kpiName,
                                image: data.base64_images[0],
                                code: data.code
                            })
                        } else {
                            return item;
                        }
                    })
                    setSelectedKpiImage(finalData);
                } else if (typeof data.base64_images === 'object') {
                    const finalData = data1.map((item) => {
                        if (item.name == kpiName) {
                            return ({
                                ...item,
                                loading: false,
                                name: kpiName,
                                image: data.base64_images[0],
                                code: data.code
                            })
                        } else {
                            return item;
                        }
                    })
                    setSelectedKpiImage(finalData);
                } else {
                    message.error('No visualization data received');
                }
            } else {
                message.error('Failed to generate KPI visualization');
            }
        } catch (error) {
            console.error('Error generating KPI visualization:', error);
            message.error('Error generating visualization');
        } finally {
            setLoadingImage(false);
        }
    };

    const handleCardClick = (kpi) => {
        let kpiName=kpi.name
        if (selectedKpiNames.includes(kpiName)) {
            setSelectedKpiNames(selectedKpiNames.filter(name => name !== kpiName));
        } else {
            setSelectedKpiNames([...selectedKpiNames, kpiName]);
            generateKPIImage(kpi);
        }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', background: '#f0f2f5', minHeight: '100vh' }}>
            <Title level={2} style={{
                marginBottom: '32px',
                color: '#2f54eb',
                textAlign: 'center',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
                Predefined KPI
            </Title>

            <Card
                style={{
                    marginBottom: '32px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: 'none'
                }}
            >
                <form className="kpi-form" style={{ display: "flex", gap: '24px',justifyContent:'center' }}>
                    <div className="select-group">
                        <label>Process</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="kpi-select"
                        >
                            <option value="">Select Type</option>
                            {typeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="select-group">
                        <label>Category</label>
                        <select
                            name="classification"
                            value={formData.classification}
                            onChange={handleChange}
                            className="kpi-select"
                        >
                            <option value="">Select Classification</option>
                            {classificationOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </form>
            </Card>

            <Row gutter={[24, 24]}>
                {kpis.map((kpi, index) => (
                    <Col xs={24} sm={12} lg={8} key={index}>
                        <Card
                            hoverable
                            onClick={() => !loadingImage && handleCardClick(kpi)}
                            style={{
                                borderRadius: '8px',
                                height: '100%',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                transition: 'all 0.3s ease',
                                backgroundColor: selectedKpiNames.includes(kpi['name']) ? '#f0f7ff' : 'white',
                                border: selectedKpiNames.includes(kpi['name']) ? '1px solid #1890ff' : '1px solid #f0f0f0',
                                cursor: 'pointer',
                            }}
                            bodyStyle={{
                                padding: '20px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Title level={4} style={{
                                marginBottom: '16px',
                                color: '#1f1f1f',
                                fontWeight: '600',
                                fontSize: '18px',
                                borderBottom: '1px solid #f0f0f0',
                                paddingBottom: '12px'
                            }}>
                                {kpi['name']}
                            </Title>

                            <Text style={{
                                fontSize: '14px',
                                color: '#262626',
                                marginBottom: '8px'
                            }}>
                                {kpi.description}
                            </Text>
                        </Card>
                    </Col>
                ))}
            </Row>

            {selectedKpiImage.length > 0 && (
                <Collapse style={{ marginTop: '20px' }}>
                    {selectedKpiImage.map((item, index) => (
                        <Collapse.Panel header={item.name.charAt(0).toUpperCase() + item?.name.slice(1)} key={index}>
                            {item.loading ? <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: '#2f54eb' }} spin />} />
                            </div> : <>  <img
                                src={`data:image/png;base64,${item.image}`}
                                alt={`${item.name} visualization`}
                                style={{
                                    width: '100%',
                                    maxWidth: '800px',
                                    borderRadius: '8px',
                                    marginBottom: '20px'
                                }}
                            />
                                <div
                                    dangerouslySetInnerHTML={{ __html: item.code }}
                                    style={{
                                        width: '100%',
                                        padding: '20px',
                                        backgroundColor: '#1e1e1e',
                                        borderRadius: '8px',
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'monospace',
                                        color: '#ffffff'
                                    }}
                                />
                                </>}
                        </Collapse.Panel>
                    ))}
                </Collapse>
            )}
        </div>
    );
};

export default DefaultKPIs;