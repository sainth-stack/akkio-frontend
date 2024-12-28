import { useEffect, useState } from "react"
import { Card } from "react-bootstrap"
import { akkiourl } from "../../../../../utils/const";
import axios from 'axios';
import { LoadingOutlined } from '@ant-design/icons';
import './index.css'
import { Spin } from "antd";
export const PredictionAndForecast = () => {
    const [model, setModel] = useState("");
    const [targetColumn, setTargetColumn] = useState("");
    const [targetOptions, setTargetOptions] = useState([])
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState('')

    const [formData, setFormData] = useState({});

    const [show, setShow] = useState(false)
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setLoading(true)
        setShow(true)
        try {
            const formData = new FormData();
            formData.append('model', model); // Append model to form data
            formData.append('col', targetColumn); // Append target column to form data
            const response = await axios.post(`${akkiourl}/models`, formData);
            setLoading(false)
            if (model == "K-Means") {
                const sanitizedData = JSON.stringify(response?.data?.clustered_data).replace(/NaN/g, 'null');
                const parsedData = JSON.parse(JSON.parse(sanitizedData));
                setData(parsedData)
            }
            else if (model == 'OutlierDetection') {
                setData(response?.data?.processed_data)
            } else if (model == "Arima") {
                setData(response?.data?.status)
            } else {
                setData(response?.data?.rf_cols)
            }

        } catch (error) {
            setLoading(false)
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        const storedData = localStorage.getItem('prepData');
        const name = localStorage.getItem('filename');

        if (storedData) {
            const parsedData = JSON.parse(storedData);
            console.log(parsedData)
            const data = Object.keys(parsedData)?.map((item) => {
                return {
                    label: item,
                    value: item
                }
            })
            setTargetOptions(data)
        }
    }, [])

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleRandomForestSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('form_name', 'rf');
            formDataToSend.append('col_predict', targetColumn);
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });

            const response = await axios.post(`http://54.255.151.153:3001/model_predict`, formDataToSend);
            setLoading(false);
            // Handle the response as needed
            console.log(response.data);
        } catch (error) {
            setLoading(false);
            console.error("Error:", error);
        }
    }

    return (
        <Card
            style={{
                marginBottom: '32px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: 'none',
                padding: '12px 0px',
                margin: '12px 12px'
            }}
        >
            <form className="kpi-form" style={{ display: "flex", gap: '24px', justifyContent: 'center', alignItems: 'center' }} onSubmit={handleSubmit}>
                <div className="select-group">
                    <label>Model</label>
                    <select value={model} onChange={(e) => { setModel(e.target.value); setData(''); setShow(false) }} className="kpi-select">
                        <option value="">Select Model</option>
                        {/* <option value="K-Means">K-Means</option> */}
                        <option value="Arima">Arima</option>
                        <option value="OutlierDetection">Outlier Detection</option>
                        <option value="RandomForest">Random Forest</option>
                    </select>
                </div>

                <div className="select-group">
                    <label>Target Column</label>
                    <select value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)} className="kpi-select">
                        <option value="">Select Target Column</option>
                        {targetOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <button type="submit" style={{ height: '40px', marginTop: '22px' }} className="btn btn-primary">Submit</button>
            </form>

            {show &&
                <>
                    {loading ? <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', marginTop: '40px' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#1890ff' }} spin />} />
                    </div> : <div>
                        {model === "K-Means" && <div>
                            {/* Updated dynamic table to display data with new styles */}
                            {data && data.length > 0 && (
                                <table className="modern-table" style={{ marginTop: '20px', height: '540px', borderCollapse: 'collapse', width: '100%' }}>
                                    <thead style={{ background: '#f0f0f0' }}>
                                        <tr style={{ background: '#f0f0f0' }}>
                                            {Object.keys(data[0]).map((key) => (
                                                <th key={key} style={{ padding: '10px', border: '1px solid #ddd' }}>{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                                                {Object.values(item).map((value, idx) => (
                                                    <td key={idx} style={{ padding: '10px', border: '1px solid #ddd' }}>{value}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>}

                        {model === "OutlierDetection" && <div style={{ marginTop: '20px', padding: '20px', fontSize: '16px' }}>
                            <div
                                dangerouslySetInnerHTML={{ __html: data }}
                                style={{
                                    width: '100%',
                                    padding: '20px',
                                    backgroundColor: '#1e1e1e',
                                    borderRadius: '8px',
                                    // fontFamily: 'poppins',
                                    color: '#ffffff'
                                }}
                            />
                        </div>}

                        {model == "Arima" && <div style={{ marginTop: '30px' }}>
                            <img
                                src={`data:image/png;base64,${data}`}
                                alt={`visualization`}
                                style={{
                                    width: '100%',
                                    maxWidth: '800px',
                                    borderRadius: '8px',
                                    marginBottom: '20px'
                                }}
                            />
                        </div>}

                        {model === "RandomForest" && (
                            <div style={{ marginTop: '20px', padding: '20px', fontSize: '16px' }}>
                                <form onSubmit={handleRandomForestSubmit}>
                                    <div style={{display:'grid',gridTemplateColumns:'auto auto'}}>
                                        {data?.map((field) => (
                                            <div key={field}>
                                                <label>{field}</label>
                                                <input
                                                    type={field === "Date" ? "date" : "text"}
                                                    name={field}
                                                    value={formData[field]}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Submit</button>
                                </form>
                            </div>
                        )}
                    </div>}
                </>
            }
        </Card>
    )
}