import { useState } from 'react'
import { ApexChart } from '../../../../components/ApexBarChart';
import { AddChartPopup } from './addChartPopup';

export const DashboardReports = () => {
    const [showModal, setShowModal] = useState(false)
    const [type, setType] = useState('')
    let name1 = 'Industry by Company Size'
    let desc1 = 'A barplot showing the number of leads by Industry and Company Size.'
    let name2 = ' Industry by Positive Lead Count'
    let desc2 = ' A barplot showing the number of positive leads by Industry. '
    const [data, setdata] = useState([
        { name: '', description: '', data: [],id:0 },
        { name: '', description: '', data: [], id: 1 },
        { name: '', description: '', data: [], id: 2 },
        { name: '', description: '', data: [], id: 3 },
        { name: '', description: '', data: [], id: 4 },
        { name: '', description: '', data: [], id: 5 }
    ])
    const [id, setId] = useState('')
    const toptions = {
        chart: {
            type: 'bar',
            height: 350
        },
        colors: ["#1b3c7a", "#427ae3", "#3dc7d1", '#faa93e'],
        fill: {
            colors: ["#1b3c7a", "#427ae3", "#3dc7d1", '#faa93e']
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        yaxis: {
            title: {
                text: 'count'
            }
        },
        xaxis: {
            title: {
                text: 'Industry'
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val
                }
            }
        }
    };

    const series1 = [{
        data: [{
            x: 'category A',
            y: 700
        }, {
            x: 'category B',
            y: 650
        }, {
            x: 'category C',
            y: 690
        },
        {
            x: 'category C',
            y: 660
        }]
    }]

    const series2 = [{
        data: [{
            x: 'category A',
            y: 200
        }, {
            x: 'category B',
            y: 180
        }, {
            x: 'category C',
            y: 190
        },
        {
            x: 'category C',
            y: 200
        }]
    }]

    const handleSave = () => {
        const finName = type == '1' ? name1 : name2;
        const finDesc = type == '1' ? desc1 : desc2;
        const newData = type == '1' ? series1 : series2
        console.log(type)
        console.log(id)
        const finData = data.map((item) => {
            if (item.id == id) {
                return {
                    name: finName,
                    description: finDesc,
                    data: newData
                }
            } else {
                return item
            }
        })
        setdata(finData)
    }

    return (
        <div style={{ padding: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h5>My New Dashboard</h5>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary">share</button>
                    <button className="btn btn-primary">save</button>
                </div>
            </div>
            {/* <div className='container'> */}
            <div className='row'>
                {data.map((item) => {
                    return (
                        <div className='col-4 p-2'>
                            <div style={{ minHeight: '450px', border: '1px solid lightgrey', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.name ? <div style={{ padding: '20px' }}>
                                    <h6>
                                        {item.name}
                                    </h6>
                                    <p style={{ width: '80%' }}>
                                        {item.description}
                                    </p>
                                    <div>
                                        <div style={{ minHeight: "300px", maxHeight: "300px", width: "100%" }}>
                                            <ApexChart series={item.data} options={{
                                                ...toptions, xaxis: {
                                                    categories: ['Finance', 'Healthcare', ['IT', 'Manufacturing'], 'Retail'],
                                                    title: {
                                                        text: 'Industry'
                                                    }
                                                },
                                                yaxis: {
                                                    title: {
                                                        text:item.name=="Industry by Positive Lead Count" ? "Positive Lead": 'count'
                                                    }
                                                },
                                            }} height={"300px"} width={"100%"} />
                                        </div>
                                    </div>
                                </div> : <div style={{ display: 'flex', alignItems: 'center', height: '100%', cursor: 'pointer' }}>
                                    <h6 onClick={() => { setShowModal(true); setId(item.id) }}> + Add Chart</h6>
                                </div>}
                            </div>
                            {showModal && <AddChartPopup {...{ showModal, setShowModal, type, setType, handleSave }} />}
                        </div>
                    )
                })}
                {/* </div> */}
            </div>
        </div>
    )
}