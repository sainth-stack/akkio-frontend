import './index.css'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
const ADAPTERS_BASE_URL = process.env.REACT_APP_BASE_URL;

export const Page1 = () => {
    const navigate = useNavigate();
    const [apidata, setApiData] = useState([])

    const handleReport = (name) => {
        const data = apidata.filter((item) => item.name === name)[0]
        navigate('/review-report', { state: { data: data } });
    }

    const fetchData = async () => {
        try {
            await axios.get(`${ADAPTERS_BASE_URL}/productivity/getData`).then((response) => {
                //    const data = JSON.parse(response?.data?.replace(/\bNaN\b/g, "null"));
                const data = response?.data
                // console.log(JSON.parse(data))
                setApiData(data.result);
            });
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="container">
            <div className="mt-4 mb-5">
                <div>
                    <h1 className="head-1 mt-3 mb-3" style={{ fontSize: '28px', fontFamily: "Poppins" }}>Productivity Reports</h1>
                </div>
                <div className="container mt-3">
                    <div className="row ">
                        <table className="table table-hovered">
                            <tr>
                                <td>01</td>
                                <td className='nametd' >Productivity - Throughout</td>
                                <td><button className="btn btn-primary" onClick={() => handleReport("kpThroughput.csv")}>Report</button></td>
                            </tr>
                            <tr>
                                <td>02</td>
                                <td className='nametd'>Productivity - OpEx</td>
                                <td><button className="btn btn-primary">Report</button></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            <div className="mt-5 mb-4">
                <div>
                    <h1 className="head-1 mt-3 mb-3" style={{ fontSize: '28px', fontFamily: "Poppins" }}>Sustainability Reports</h1>
                </div>
                <div className="container mt-3">
                    <div className="row ">
                        <table className="table table-hovered">
                            <tr>
                                <td>01</td>
                                <td className='nametd'>Energy (KWH)</td>
                                <td><button className="btn btn-primary" onClick={() => handleReport()}>Report</button></td>
                            </tr>
                            <tr>
                                <td>02</td>
                                <td className='nametd'>Waste (Tons)</td>
                                <td><button className="btn btn-primary">Report</button></td>
                            </tr>
                            <tr>
                                <td>03</td>
                                <td className='nametd'>Water (Kilolitres) </td>
                                <td><button className="btn btn-primary">Report</button></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    )
}