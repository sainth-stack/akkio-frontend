import '../styles/datasource.scss'
import tableSvg from '../../../../assets/svg/table.svg'
import googleSheet from '../../../../assets/svg/googlesheet.svg'
import { useNavigate } from 'react-router-dom'
import { SiMysql } from "react-icons/si";
import { MdSettingsApplications } from "react-icons/md";
import { BiLogoPostgresql } from "react-icons/bi";
import { SiMongodb } from "react-icons/si";
import { SiMqtt } from "react-icons/si";
import PostgreSql from './popups/postgresql';
import { useEffect, useState } from 'react';
import { useDataAPI } from '../contexts/GetDataApi';
import { Modal } from 'antd';
import { adminUrl, akkiourl } from '../../../../utils/const';
import MqttConfig from './popups/MqttConfig';
import SapConfig from './popups/sap';

export const DataSource = () => {
    const navigate = useNavigate()
    const [postgresOpen, setPostgresOpen] = useState(false);
    const [connection, setConnection] = useState(false)
    const [open, setOpen] = useState(false)
    const [confirmLoading, setConfirmLoading] = useState(false);
    const { uploadedData, handleUpload, showContent } = useDataAPI()
    const [file, setFile] = useState(null);
    const [fetchedData, setFetchedData] = useState([])
    const [mqttOpen, setMqttOpen] = useState(false);
    const [sapOpen, setSapOpen] = useState(false);

    const handleCancel = () => {
        setOpen(false);
    };


    const handleOk = async () => {
        try {
            setConfirmLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mail', JSON.parse(localStorage.getItem('user'))?.email);
            localStorage.setItem("file", file)

            const response = await fetch(`${akkiourl}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('File upload failed');
            }

            await handleUpload(file);
            setOpen(false);
        } catch (error) {
            console.error('Error uploading file:', error);
            // You might want to show an error message to the user here
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
    };

    const handleNavigate = async (finalValue) => {
        await showContent({
            filename: finalValue.filename, headers: Object.keys(finalValue.data
            [0]), data: finalValue.data
        })

        localStorage.setItem("filename", finalValue.filename)
        localStorage.setItem('prepData', JSON.stringify(finalValue.data));
        navigate("/discover")
    }

    const handleMqttData = async (mqttData) => {
        await showContent({
            filename: mqttData.filename,
            headers: Object.keys(mqttData.data[0]),
            data: mqttData.data
        });

        localStorage.setItem("filename", mqttData.filename);
        localStorage.setItem('prepData', JSON.stringify(mqttData.data));
        navigate("/discover");
    };

    useEffect(() => {
        if (uploadedData.length > 0 && !open && file) {
            handleNavigate(JSON.parse(uploadedData[0]))
        }
    }, [uploadedData, open, file])


    return <>
        {!postgresOpen && <div className="mt-1">
            <h2 className='headerText'>  Pick a data source to start
            </h2>
            <div className='mainConatiner'>
                <div className='outerContainer' onClick={() => setOpen(true)}>
                    <div className='cardContainer' style={{ display: 'flex' }}>
                        <div className="stepContainer">
                            <img style={{ width: 24, height: 24, marginTop: '2px' }} src={tableSvg} class="step-tile-icon" />
                            <div data-v-fa6956f7="" class="step-tile-text-container">
                                <div data-v-fa6956f7="" class="textHeader">CSV</div>
                                <div data-v-fa6956f7="" class="textDesc"> Upload and configure datasets </div>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> CSV</span>
                            {/* <span className='footerText'> EXCEL</span>
                            <span className='footerText'> JSON</span> */}
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' onClick={() => setSapOpen(true)}>
                        <div className="stepCommonContainer">
                            <MdSettingsApplications color='blue' width={30} height={30} style={{ width: 30, height: 30, marginTop: '2px' }} src={googleSheet} class="step-tile-icon" />
                            <span class="textHeader">SAP</span>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' >
                        <div className="stepCommonContainer">
                            <SiMysql size={50} />
                            <div>
                                <span class="textHeader">MySQL</span>
                                <span data-v-fa6956f7="" class="textDesc"> Import </span>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' >
                        <div className="stepCommonContainer">
                            <SiMongodb size={40} />
                            <div>
                                <span class="textHeader">MongoDB</span>
                                <span data-v-fa6956f7="" class="textDesc"> Import </span>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' onClick={() => setPostgresOpen(true)}>
                        <div className="stepCommonContainer">
                            <BiLogoPostgresql size={40} />
                            <div>
                                <span class="textHeader">PostgreSQL</span>
                                <span data-v-fa6956f7="" class="textDesc"> Import </span>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' onClick={() => setMqttOpen(true)}>
                        <div className="stepCommonContainer">
                            <SiMqtt size={40} />
                            <div>
                                <span class="textHeader">Mqtt</span>
                                <span data-v-fa6956f7="" class="textDesc"> Import </span>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>}
        {postgresOpen && <PostgreSql setPostgresOpen={setPostgresOpen} setConnection={setConnection} />}
        {open && <Modal
            title=""
            open={open}
            onOk={handleOk}
            confirmLoading={confirmLoading}
            onCancel={handleCancel}
            okText="upload"
        >
            <input type='file' onChange={handleFileChange} />
        </Modal>}
        {mqttOpen && <MqttConfig setMqttOpen={setMqttOpen} onDataReceived={handleMqttData} />}
        {sapOpen && <SapConfig setSapOpen={setSapOpen} onDataReceived={handleNavigate} />}
    </>
}