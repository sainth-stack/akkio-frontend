import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useDataAPI } from '../contexts/GetDataApi'
import '../styles/deployment.scss'
import { LuUpload } from "react-icons/lu";
import axios from 'axios';
import { useNavigate } from 'react-router-dom'
import { akkiourl } from '../../../../utils/const';
const DeploymentData = () => {
    const selData = [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }

    ]

    const name = localStorage.getItem("filename").replace(/\.[^/.]+$/, '')
    let db = (name)
    let db1 = (name)
    let db2 = (name)

    const [data, setData] = useState([])
    const [headers, setHeaders] = useState([])
    const [leftData, setLeftData] = useState([])
    const [loading, setLoading] = useState(false)
    const [filename, setFilename] = useState("")
    const [deployed, setDeployed] = useState(false)
    const [prediction, setNoPrediction] = useState(false)
    const navigate = useNavigate()
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

    const handleSelect = (child) => {
        // const isSelected = selectedField.filter((chi) => chi === item).length > 0
        // if (isSelected) {
        //     const data = selectedField.filter((chin) => chin !== item)
        //     setSelectedField(data)
        // } else {
        //     setSelectedField([ item])
        // }

        setHeaders(displayContent.headers.filter((item, index) => item !== child))
        setSelectedField([child])
    }


    const handleGetData = async () => {

    }

    const handleGetDataFinalData = async () => {

    }

    useEffect(() => {
        handleGetData()
        handleGetDataFinalData()
    }, [])

    const {
        displayContent,
    } = useDataAPI()

    const getLeftData = async () => {
        try {
            let db = name; // Assuming `name` is defined elsewhere
            const response = await axios.post(`${akkiourl}/predict/${db}`, {});

            if (response.status === 200) {
                setLeftData(response?.data?.columns);
                setSelectedField([response?.data?.columns[0]]);
            }
        } catch (error) {
            setNoPrediction(true)
            console.error('Error fetching left data:', error);
        }
    };



    useEffect(() => {
        getLeftData()
    }, [])

    useEffect(() => {
        setLoading(true)
        setData(displayContent.data)
        setHeaders(displayContent?.headers.filter((item, index) => index !== 0))
        setFilename(localStorage.getItem("filename"))
        setTimeout(() => {
            setLoading(false)
        }, 2000)

    }, [displayContent])


    const CommonName = ({ header, description, inputField, value = '' }) => {
        return (
            <div style={{ paddingTop: '5px' }}>
                <h2 style={{ font: '500 14px/20px "Inter", sans-serif', color: 'hsl(240, 46.3%, 8%)' }}>{header}</h2>
                <h2 style={{ font: '400 12px/16px "Inter", sans-serif', color: 'hsl(240, 10.3%, 38%)' }}>{description}</h2>
                {inputField == 'input' && <input data-v-27b19115="" placeholder="" className="inputStyles" value={value} />
                }
                {inputField === 'textarea' && <textarea data-v-27b19115="" placeholder="" className="inputStyles" style={{ height: '80px' }} value={value} />}
                {inputField === 'select' && <select id="connection-name" name='tableName' className="inputStyles">
                    {selData.map(option => (
                        <option key={option.label} style={{
                            padding: '8px',
                            fontSize: '16px',
                            fontFamily: 'Arial, sans-serif',
                            backgroundColor: '#fff',
                            color: '#333'
                        }} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>}
                {inputField === 'selectHeader' && <div className='predictFieldsContainer' >
                    <div style={{ alignItems: 'center' }}>
                        <div style={{ overflow: 'auto', scrollbarWidth: 'thin', }} className='p-3 scrollHeight'>
                            {leftData.map((item, index) => {
                                return (
                                    <div className='d-flex p-2' style={{ cursor: 'pointer' }} onClick={() => handleSelect(item)}>
                                        <div className={selectedField.includes(item) ? 'checkboxContainer checkboxTick' : 'checkboxContainer'}></div>
                                        <h2 className='fieldText'>{item}</h2>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                </div>}
            </div>
        )
    }

    const CommonField = ({ name }) => {
        return (
            <div className='fieldContainerDepl'>
                <p style={{ fontSize: '12px' }}>{name}</p>
                <input className='deployScreenInput' placeholder={name} />
            </div>
        )
    }

    const handleDeploy = async () => {
        const response = await axios.post(`${akkiourl}/generatedeployment/${db}/${[selectedField[0]]}`, {});
        if (response.status === 200) {
            setDeployed(true)
            localStorage.setItem('predictItem', selectedField[0])
            localStorage.setItem('url', response?.data?.deployment_url)
        }
    }

    return (
       <>
       {!prediction?  <div style={{ minHeight: '90vh', overflow: 'hidden' }}>
            <Navbar />
            <div className="professional-table">
                <div className="file-details ms-2" style={{ borderBottom: '1px solid #e0eaf0', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <p>{filename}</p>
                        <p>{data.length} rows</p>
                        <p>{headers.length} columns</p>
                    </div>
                    {!deployed ? <button className='btn btn-primary mb-2' style={{}} onClick={() => handleDeploy()}>Deploy</button> :
                        <button className='btn btn-primary mb-2' style={{}} onClick={() => navigate('/new-deployment')}>Show Deploy</button>}

                </div>
            </div>
            <div className='row'>
                <div className='col-md-3'>
                    <div className='predictLeftCont' style={{ overflow: 'auto', scrollbarWidth: 'thin' }} >
                        <CommonName {...{ header: 'Title', description: 'User-facing title for your web app.', inputField: 'input', value: totData.title }} />
                        <CommonName {...{ header: 'Description', description: 'User-facing description for your web app.', inputField: 'textarea', value: totData.description }} />
                        <CommonName {...{ header: 'Select Fields', description: 'Select which fields to include.', inputField: 'selectHeader' }} />
                        <CommonName {...{ header: 'Make Public', description: 'Allow anyone to access this app without requiring authentication.', inputField: 'select' }} />
                        <CommonName {...{ header: 'Allow Bulk Upload', description: 'Allow users to make bulk predictions by uploading datasets in CSV format.', inputField: 'select' }} />
                        <CommonName {...{ header: 'Show Probability', description: 'Show probabilities of categorical predictions in addition to the prediction itself.', inputField: 'select' }} />
                        <CommonName {...{ header: 'Apply Data Prep', description: 'Applies Data Prep to the data before making predictions.', inputField: 'select' }} />
                    </div>
                </div>
                <div className='col-md-8 rightContainer'>
                    <div className='rightttContainerDeploy' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <h2 style={{ font: '500 36px "Inter", sans-serif', color: 'hsl(240, 46.3%, 8%)' }}>{totData.title}</h2>
                        <h2 style={{ font: '400 14px "Inter", sans-serif', color: 'hsl(240, 10.3%, 38%)' }}>{totData.description}</h2>
                        <div className='deployScreenContainer row' style={{ width: '100%', gap: '0px', margin: '0px' }}>
                            {headers?.map((item) => {
                                return <div className='col-6' style={{ padding: '0px', margin: '0px' }}>
                                    <CommonField {...{ name: item }} />
                                </div>
                            })}
                        </div>
                        <button className='deployPredictButton'>Predict</button>
                        <div className='exportButtonDeploy'><LuUpload />  Upload CSV, XLSX or XLS</div>
                    </div>
                </div>
            </div>
        </div> : <div style={{fontSize:'18px',display:'flex',justifyContent:'center'}}>No Prediction Found!</div>}
       </>
    )
}

export default DeploymentData