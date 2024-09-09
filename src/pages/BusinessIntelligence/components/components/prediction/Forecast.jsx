import React, { useEffect, useState } from 'react'
import Navbar from '../Navbar'
import { useDataAPI } from '../../contexts/GetDataApi'
import '../../styles/predictData.scss'
import topFactors from '../../../../../assets/svg/topFactor.svg'
import axios from 'axios'
import { DetailedLineGraph } from './lineGraph'
import moment from 'moment'
import { akkiourl } from '../../../../../utils/const'
const ForecastData = () => {

    const [data, setData] = useState([])
    const [headers, setHeaders] = useState(['Sales','Electronics Sales', 'Home Sales', 'Clothes Sales'])
    const [loading, setLoading] = useState(false)
    const [filename, setFilename] = useState("")
    const [totData, setTotData] = useState({
        accuracy: 0,
        predictData: {},
        lables: [],
        data3: [],
        data4: []
    })
    // const [file, setFile] = useState(null)
    const [selectedField, setSelectedField] = useState("Sales")

    const handleSelect = (item) => {
        setSelectedField(item)
    }

    const handleGetDataFinalData = async (id) => {
        const response = await axios.post(`${akkiourl}/forecast/${selectedField}`);
        if (response.status === 200) {
            const data = response?.data?.result
            const finActualData = data?.Actual
            const finPredictData = data?.prediction
            const labels = []
            const data3 = []
            const data4 = []

            // Object.values(finActualData?.ds)?.map((item) => {
            //     const dateObj = new Date(item);
            //     const formattedDate = moment(dateObj).format('MMM YYYY');
            //     labels.push(formattedDate)
            // })

            const date = finActualData.date;
            const length = date.length
            const lastFiveKeys = date.slice(length - 12, length);

            lastFiveKeys.map((item, index) => {
                const dateObj = new Date(item);
                const formattedDate = moment(dateObj).format('MMM YYYY');
                labels.push(formattedDate)
            })

            finPredictData?.date?.map((item, index) => {
                if (index < 7) {
                    const dateObj = new Date(item);
                    const formattedDate = moment(dateObj).format('MMM YYYY');
                    labels.push(formattedDate)
                }
            })

            const values2 = finActualData.values;
            const length2 = values2.length
            const lastFiveKeys2 = values2.slice(length2 - 12, length2);

            lastFiveKeys2.map((item, index) => {
                data3.push(item)
            })


            finPredictData?.values?.map((item, index) => {
                if (index < 7) {
                    data4.push(item)
                }
            })

            setTotData({
                // accuracy: parseFloat(data.Accuraacy).toFixed(2),
                predictData: finPredictData,
                lables: labels,
                data3: data3,
                data4: data4
            })
        }
    }

    useEffect(() => {
        handleGetDataFinalData(selectedField)
    }, [selectedField])
    const {
        displayContent,
    } = useDataAPI()


    useEffect(() => {
        setLoading(true)
        // console.log(displayContent)
        // setHeaders(displayContent.headers)
        setData(displayContent.data)
        setFilename(localStorage.getItem("filename"))
        setTimeout(() => {
            setLoading(false)
        }, 2000)

    }, [displayContent])
    console.log(headers,'hj')
    return (
        <div style={{ height: '85vh', overflow: 'hidden' }}>
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
                        <h1 className='predictHeader'>Forecast</h1>
                        <h2 className='predictSecondHeader'>Forecast Fields</h2>
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
                        {/* <div className='rightHeaderText'><img src={regression} alt='imag' /> Forecast Summary</div>
                        <h2 className='rightDesctext'>Below is the forecast chart and metrics on how well the model perfomed at predicting the future outcome.</h2>
                        <div className='d-flex' style={{ gap: '10px', marginRight: '50px' }}>
                            <div className='regressioncard'>
                                <div className='regressionCardInnerContainer'>
                                    <p className='cardFirstLineText'>Accuracy is usually within</p>
                                    <p className='cardLargeNumberText'> ±{(totData?.accuracy)}% </p>
                                    <p className='cardFirstLineText'> Forecasted values were on average off by ±370,100.4 compared to actual values in the most recent 20% of the dataset.</p>
                                </div>
                            </div>
                        </div> */}
                        <div>
                            <div className='rightHeaderText'><img src={topFactors} alt='imag' /> Forecast</div>
                            <h2 className='rightDesctext'> The predictions of the model, compared to the historical data and extrapolated forward.                            </h2>
                            <div className='regressioncard' style={{ width: '96%' }}>
                                <div className='regressionCardInnerContainer' style={{ minHeight: '400px',width:'100%' }}>
                                    <DetailedLineGraph {...{ labelsNew: totData.lables, data: totData.data3, data2: totData.data4 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForecastData;