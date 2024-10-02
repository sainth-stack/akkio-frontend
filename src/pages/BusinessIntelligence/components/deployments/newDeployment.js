import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useDataAPI } from '../contexts/GetDataApi'
import '../styles/deployment.scss'
import { LuUpload } from "react-icons/lu";
import axios from 'axios';
import { akkiourl } from '../../../../utils/const';

export const CommonField = ({ name, value, setSelData, selData }) => {
    const handleChange = (name, value) => {
        setSelData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    return (
        <div className='fieldContainerDepl'>
            <p style={{ fontSize: '12px' }}>{name}</p>
            {value === null ? (
                <input
                    className='deployScreenInput'
                    name={name}
                    placeholder={name}
                    value={selData[name] || ''}
                    onChange={(e) => handleChange(name, e.target.value)}
                />
            ) : (
                <select
                    name={name}
                    value={selData[name] || ''}
                    onChange={(e) => handleChange(name, e.target.value)}
                    className='deployScreenSelectInput'
                    placeholder={name}
                >
                    <option key={0}>--Select--</option>
                    {value?.map((item, index) => (
                        <option key={index + 1}>{item}</option>
                    ))}
                </select>
            )}
        </div>
    );
};
const NewDeploymentData = () => {
    const [selData, setSelData] = useState({})
    const [result, setResult] = useState([])
    const name = localStorage.getItem("filename").replace(/\.[^/.]+$/, '')
    let db = (name)
    let db1 = (name)
    let db2 = (name)
    const predictItem = localStorage.getItem('predictItem')

    const [totData, setTotData] = useState({
        title: db1,
        description: db2,
        finSamplerows: [],
        topFields: {
            Feature: [],
            Importance: []
        }
    })
    // const [file, setFile] = useState(null)
    const [selectedField, setSelectedField] = useState([])




    const handleData = async () => {
        const url = localStorage.getItem('url')
        const response = await axios.post(`${akkiourl}/deployments/${url}`, {});
        if (response.status === 200) {
            console.log(response.data.columns)
            setSelectedField(response?.data?.columns)
        }
    }

    const handleDataPredict = async () => {
        const url = localStorage.getItem('url')
        const formData = new FormData();

        Object.entries(selData).forEach(([key, value]) => formData.append(key, value))

        const response = await axios.post(
            `${akkiourl}/deployments/${url}/predict`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );
        if (response) {
            setResult([response?.data?.result])
        }
    }
    useEffect(() => {
        handleData()
    }, [])

    return (
        <div style={{ minHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className='col-md-8 rightContainer'>
                <div className='rightttContainerDeploy' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h2 style={{ font: '500 36px "Inter", sans-serif', color: 'hsl(240, 46.3%, 8%)' }}>{totData.title}</h2>
                    <h2 style={{ font: '400 14px "Inter", sans-serif', color: 'hsl(240, 10.3%, 38%)' }}>{totData.description}</h2>
                    <div className='deployScreenContainer row' style={{ width: '100%', gap: '0px', margin: '0px',overflow:'auto' }}>
                        <div className='deployScreenContainer row' style={{ width: '100%', gap: '0px', margin: '0px',overflow:'auto' }}>
                            {Object.keys(selectedField)?.map((item) => (
                                <div className='col-6' style={{ padding: '0px', margin: '0px' }}>
                                    <CommonField key={item} name={item} value={selectedField[item]} selData={selData} setSelData={setSelData} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className='deployPredictButton' onClick={handleDataPredict}>Predict</button>
                    <div className='exportButtonDeploy'><LuUpload />  Upload CSV, XLSX or XLS</div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', width: '100%', paddingLeft: '17%' }}>
                {result.length > 0 &&
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '10px', textDecoration: 'underline' }}> Prediction:</h2>
                }
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {result.map((item, index) => {
                        return (
                            <div >
                                <h2 style={{ fontSize: '22px', fontWeight: 400, marginTop: '10px' }}>{predictItem} - {item}</h2>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default NewDeploymentData