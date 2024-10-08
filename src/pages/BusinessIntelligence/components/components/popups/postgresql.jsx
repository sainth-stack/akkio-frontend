import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'
import './styles.scss'; // Import CSS file for styling
import { useDataAPI } from '../../contexts/GetDataApi'
import { IoMdArrowRoundBack, IoMdArrowRoundForward } from 'react-icons/io'
import { akkiourl } from '../../../../../utils/const';
import { Spinner } from 'react-bootstrap';
const PostgreSql = (props) => {
    // const {details,setDetails} = props;
    const [secondScreen, setSecondScreen] = useState(false)
    const { uploadedData, handleUpload, showContent } = useDataAPI()
    const [data, setData] = useState()
    const [fetchedData, setFetchedData] = useState([])
    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const navigate = useNavigate()
    const handleChange = ({ target: { name, value } }) => {
        let updatedData = { ...details };
        updatedData[name] = value;
        setDetails(updatedData);
    };
    const [details, setDetails] = useState({
        connectionName: 'PostgreSQL',
        hostName: 'abul.db.elephantsql.com',
        databaseName: 'mabpfgiu',
        userName: 'mabpfgiu',
        password: 'vzKsrtuh2PTCsQwoExC7gympinp57ADp',
        port: '5432',
        schemaName: 'postgres',
        tableName: 'retail_sales_data'
    })
    const handleConnectionCheck = async () => {
        setLoading(true); // Start loading
        try {
            const formData = new FormData();
            formData.append('username', details.userName);
            formData.append('password', details.password);
            formData.append('database', details.databaseName);
            formData.append('host', details.hostName);
            formData.append('port', details.port);

            const response = await axios.post(`${akkiourl}/connect`, formData);
            if (response.status === 200) {
                setSecondScreen(true);
                const tables = JSON.parse(response.data.tables);
                const names = Object.values(tables?.name).map((item) => {
                    return { label: item, value: item };
                });
                setData(names);
            }
        } catch (error) {
            console.error('Connection failed', error);
        } finally {
            setLoading(false); // Stop loading
        }
    };


    const handleGetData = async () => {
        setLoading2(true); // Start second loader
        try {
            const formData = new FormData();
            formData.append('tablename', details?.tableName);
            formData.append('schemaname', 'postgres');
            const response = await axios.post(`${akkiourl}/tabledata`, formData);
            if (response.status === 200) {
                setSecondScreen(true);
                handleUpload(null, true, response.data, details.tableName);
                // navigate('/business-intelligence');
                props.setConnection(true);
                props.setPostgresOpen(false);
            }
        } catch (error) {
            console.error('Failed to get data', error);
        } finally {
            setLoading2(false); // Stop second loader
        }
    };

    useEffect(() => {
        setFetchedData(uploadedData.map((item) => {
            return item
        }))
    }, [uploadedData])


    return (
        <div className="container3">
            {/* {
                fetchedData.map((finalField, index) => {
                    const finalValue = finalField ? JSON.parse(finalField) : ""
                    return uploadedData && finalValue !== "" ? <div className="csv-files" key={index} onClick={async () => {
                        await showContent({
                            filename: finalValue.filename, headers: Object.keys(finalValue.data
                            [0]), data: finalValue.data
                        })

                        // Uploaded Data is storing the localstorage  
                        localStorage.setItem("filename", finalValue.filename)
                        navigate("/business-intelligence")
                    }}>

                        <img src="/dataThumbnail.jpeg" alt={finalValue.filename} width={300} className='data-img' />
                        <h5 className='filename'>{finalValue.filename}</h5>
                    </div> : <></>
                })
            } */}
            <div>
                {!secondScreen && <div className="cardnew">
                    <div className="card-content">
                        <h2>Connection Details</h2>
                        <h5>Step 1/2</h5>
                        <div className="input-group">
                            <label htmlFor="connection-name">Connection Name</label>
                            <input type="text" id="connection-name" name='connectionName' onChange={handleChange} value={details.connectionName} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="hostname">Hostname / IP Address</label>
                            <input type="text" id="hostname" onChange={handleChange} name='hostName' value={details.hostName} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="database-name">Database Name</label>
                            <input type="text" id="database-name" onChange={handleChange} name='databaseName' value={details.databaseName} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input type="text" id="username" onChange={handleChange} value={details.userName} name='userName' />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" onChange={handleChange} value={details.password} name='password' />
                        </div>
                        <div className="input-group">
                            <label htmlFor="port">Port</label>
                            <input type="text" id="port" onChange={handleChange} value={details.port} name='port' />
                        </div>
                        <div className='d-flex' style={{ gap: '5px' }}>
                            <button className='btn w-100'><IoMdArrowRoundBack /> Back</button>
                            <button className='btn btn-primary w-100' onClick={handleConnectionCheck} disabled={loading}>
                                {loading ? (
                                    <Spinner animation="border" size="sm" role="status" aria-hidden="true" />  // Loader
                                ) : (
                                    <>
                                        Next <IoMdArrowRoundForward />
                                    </>
                                )}
                            </button>                        </div>
                    </div>
                </div>}
                {secondScreen && <div className="cardnew">
                    <div className="card-content">
                        <h2>Connection Details</h2>
                        <h5>Step 2/2</h5>
                        <div className="input-group">
                            <label htmlFor="connection-name">Table Name</label>
                            <select id="connection-name" onChange={handleChange} name='tableName' value={details.tableName} >
                                {data?.map(option => (
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
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="hostname">Schema Name</label>
                            <input type="text" id="hostname" onChange={handleChange} name='schemaName' value={details.schemaName} />
                        </div>
                        <div className='d-flex' style={{ gap: '5px' }}>
                            <button className='btn w-100' onClick={() => setSecondScreen(false)}><IoMdArrowRoundBack /> Back</button>
                            <button className='btn btn-primary w-100 mt-3' onClick={handleGetData} disabled={loading2}>
                                {loading2 ? (
                                    <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                                ) : (
                                    <>
                                        Continue <IoMdArrowRoundForward />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>}
            </div>
        </div>
    );
}

export default PostgreSql;
