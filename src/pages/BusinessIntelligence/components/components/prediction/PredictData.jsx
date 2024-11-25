import React, { useEffect, useState } from 'react'
import BarGraph from '../BarGraph'
import Navbar from '../Navbar'
import { useDataAPI } from '../../contexts/GetDataApi'
import '../../styles/predictData.scss'
import regression from '../../../../../assets/svg/regression.svg'
import topFactors from '../../../../../assets/svg/topFactor.svg'
import sampleRows from '../../../../../assets/svg/sampleRows.svg'
import axios from 'axios'
import { transformData } from '../../datasets'
import { newSamplerowsCols } from '../../../../../utils'
import { akkiourl } from '../../../../../utils/const'
const PredictData = () => {

    const [data, setData] = useState([])
    const [headers, setHeaders] = useState([])
    const [loading, setLoading] = useState(false)
    const [filename, setFilename] = useState("")
    const [totData, setTotData] = useState({
        accuracy: 0,
        sampleRows: {},
        finSamplerows: [{}],
        topFields: {
            Features: [],
            Importances: []
        }
    })

    const name = localStorage.getItem("filename")
    const [selectedField, setSelectedField] = useState()
    let db = (name)

    const datann = [
        { id: '25% ', name: 'sampledata.csv', freq: '40%', freq2: '45%' },
        { id: '36% ', name: ' OKRDATA1707843206710.xlsx ', freq: '60%', freq2: '75%' },
        { id: '42%', name: 'Name.csv', freq: '35%', freq2: '46%' },
        { id: '53%', name: 'Dataset.xsxl', freq: '40%', freq2: '45%' },
        { id: '66%', name: 'finalmodel.cscv', freq: '60%', freq2: '75%' },
    ]

    const sampleRowsData = [
        { id1: 'Other ', id2: 'AUD', id4: '3', id5: 'Week Day', id6: 'Sunday' },
        { id1: 'Other ', id2: ' AUD ', id4: '8', id5: 'Week Day', id6: 'Sunday' },
        { id1: 'CA', id2: 'AUD', id4: 'id20', id5: 'Week Day', id6: 'Monday' },
        { id1: 'UAS', id2: 'CAD', id4: 'id5', id5: 'Week Day', id6: 'Monday' },
        { id1: 'Other', id2: 'CAD', id4: 'id5', id5: 'Week Day', id6: 'Tuesday' },
    ]

    const segmentsdata = [
        { key: 'Fraudulent is 1', sim: '10.5x' },
        { key: 'First Purchase is 1', sim: '4.5x' },
        { key: 'Card Issuer is Amex', sim: '5.4x' },
        { key: 'Online Purchase is 1', sim: '1.5x' },
        { key: 'Avg value of Transaction Time is 13.49', sim: '+10.5%' }
    ]

    const handleSelect = (item) => {
        setSelectedField(item)
    }
    const handleGetData = async () => {
        try {
            const response = await axios.get(`http://${akkiourl}/predict/${db}`);
            if (response.status === 200) {
                const data = response.data?.columns;
                setHeaders(data);
                setSelectedField(data[0]);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handleGetDataFinalData = async (id) => {
        try {
            const response = await axios.get(`${akkiourl}/predict/${db}/${id.replace(' ', '_')}`);
            if (response.status === 200) {
                const data = response?.data?.data;
                const finSampleData = transformData(JSON.parse(data?.sample_rows)).slice(0, 15);
                setTotData({
                    accuracy: data.accuracy,
                    topFields: JSON.parse(data['Top Fields']),
                    sampleRows: JSON.parse(data.sample_rows),
                    finSamplerows: finSampleData,
                    plot: data.Plot,
                    headers: Object.keys(data.sample_rows),
                    metrics: data?.metrics
                });
            }
        } catch (error) {
            console.error('Error fetching final data:', error);
        }
    };


    useEffect(() => {
        handleGetData()
    }, [])
    useEffect(() => {
        if (selectedField) {
            handleGetDataFinalData(selectedField)
        }
    }, [selectedField])
    const {
        displayContent,
    } = useDataAPI()


    useEffect(() => {
        setLoading(true)
        setHeaders(displayContent.headers)
        setData(displayContent.data)
        setFilename(localStorage.getItem("filename"))
        setTimeout(() => {
            setLoading(false)
        }, 2000)

    }, [displayContent])
    return (
        <div style={{ minHeight: '90vh', overflow: 'hidden' }}>
            <Navbar />
            <div className="professional-table ms-2">
                <div className="file-details" style={{ borderBottom: '1px solid #e0eaf0' }}>
                    <p>{filename}</p>
                    <p>{data.length} rows</p>
                    <p>{headers.length} columns</p>
                </div>
            </div>
            <div className='row'>
                <div className='col-md-3'>
                    <div className='predictLeftCont'>
                        <h1 className='predictHeader'>Predict</h1>
                        <h2 className='predictSecondHeader'>Predict Fields</h2>
                        <p className='paragraphText'>
                            Select which numerical or categorical fields to predict and optionally ignore.
                        </p>
                        <div className='predictFieldsContainer'>
                            <div style={{ alignItems: 'center' }}>
                                <div className='px-2'>
                                    <input data-v-27b19115="" placeholder="Search fields..." class="prediction-multiselect-searchbox" />
                                </div>
                                <div style={{ maxHeight: 'calc(100vh - 380px)', overflow: 'auto', scrollbarWidth: 'thin', }} className='p-3 scrollHeight'>
                                    {headers.map((item, index) => {
                                        return (
                                            <div className='d-flex p-2' style={{ cursor: 'pointer' }} onClick={() => handleSelect(item)}>
                                                <div className={selectedField === item ? 'checkboxContainer checkboxTick' : 'checkboxContainer'}></div>
                                                <h2 className='fieldText'>{item}</h2>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='col-md-9 rightContainer'>
                    <div className='rightttconttt'>
                        <div className='rightHeaderText'><img src={regression} alt='imag' /> Regression Summary</div>
                        <h2 className='rightDesctext'>Below is a breakdown of how well the model predicted your prediction column.</h2>
                        <div className='d-flex' style={{ gap: '10px', marginRight: '50px' }}>
                            <div className='regressioncard'>
                                <div className='regressionCardInnerContainer'>
                                    <p className='cardFirstLineText'>{totData?.metrics || 'metrics'} is usually within</p>
                                    <p className='cardLargeNumberText'> ±{(totData?.accuracy).toFixed(1)}% </p>
                                    <p className='cardFirstLineText'> Predicted values were off by </p>
                                </div>
                            </div>
                            <div className='regressioncard'>
                                <div className='row justify-content-center align-items-center'>
                                    <div className='col-7' >
                                        <BarGraph data={[{ value: 0, count: 100 }, { value: 1, count: 150 }]} strokeColor={'rgba(0, 163, 255, 1)'} width={100} className="graph" cursor={'pointer'} />
                                    </div >
                                    <div className='regressionCardInnerContainer col-5' >
                                        <p className='secondcardFirstLineText'>Average Transaction Successfull</p>
                                        <p className='secondcardLargeNumberText'> 65% </p>
                                        <p className='secondcardFirstLineText'> Average Transaction Failed </p>
                                        <p className='secondcardLargeNumberText'>  35%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className='rightHeaderText'><img src={topFactors} alt='imag' /> Top Fields</div>
                            <h2 className='rightDesctext'> Individual factors ranked by their contribution to the prediction results </h2>
                            <div className='regressioncard' style={{ width: '100%' }}>
                                <div className='regressionCardInnerContainer'>
                                    <table className='datasetTable'>
                                        <thead className='datasetHeader'>
                                            <tr>{Object.values(totData?.topFields['Features'])?.map((item, index) => {
                                                return <th>{item}</th>
                                            })}
                                            </tr>
                                        </thead>
                                        <tbody className='datasetBody'>
                                            <tr>{Object.values(totData?.topFields['Importances'])?.map((item, index) => {
                                                return <td>{item}</td>
                                            })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className='rightHeaderText'><img src={sampleRows} alt='imag' /> Sample Rows</div>
                            <h2 className='rightDesctext'>  Sample rows of your data sorted by predicted value of the outcome of interest. Drag the slider to inspect rows at different values.  </h2>
                            <div className='regressioncard' style={{ width: '100%' }}>
                                <div className='regressionCardInnerContainer'>
                                    <table className='datasetTable'>
                                        <thead className='datasetHeader'>
                                            <tr>{Object.keys(totData?.finSamplerows[0])?.map((item) => {
                                                return <th>{item}</th>
                                            })}
                                            </tr>
                                        </thead>
                                        <tbody className='datasetBody'>
                                            {totData?.finSamplerows?.map((row, index) => {
                                                if (row[Object.keys(totData?.finSamplerows[0])[0]] !== undefined || row[Object.keys(totData?.finSamplerows[0])[1]] !== undefined) {
                                                    return (
                                                        <tr>
                                                            {newSamplerowsCols(Object.keys(totData?.finSamplerows[0]))?.map((col, key) => {
                                                                return (
                                                                    <td
                                                                        key={key}
                                                                        sx={{
                                                                            minWidth: col?.minWidth,
                                                                        }}
                                                                    >
                                                                        {col.render(
                                                                            row,
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                }
                                            })}
                                        </tbody>

                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PredictData