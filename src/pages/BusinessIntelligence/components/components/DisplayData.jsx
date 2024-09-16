import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import BarGraph from './BarGraph'
import { useDataAPI } from '../contexts/GetDataApi'
import EndPopup from './EndPopup'
import { Button } from '@mui/material'
import { Spin, Modal, Input, Progress } from 'antd'
import { AiOutlineClear } from "react-icons/ai"
import { BsStars } from 'react-icons/bs'
import { PivotView } from './popups/pivotVIew'
import ChatDataPrep from './popups/chatdataprep'
import { getFinalData } from '../../../../utils/const'
import '../styles/discover.scss'
const DisplayData = () => {
  const [data, setData] = useState([])
  const [headers, setHeaders] = useState([])
  const [hoveredRowIndex, setHoveredRowIndex] = useState(-1);
  const [displaypopup, setDisplaypopup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState(displaypopup)
  const [prepData, setPrepData] = useState("")
  const [filename, setFilename] = useState("")
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [view, setView] = useState(false)
  const [showModel, setShowModel] = useState(false)
  const navigate = useNavigate()
  const {
    displayPopupFun,
    displayContent,
    handleCleanData,
    handlePrepareData,
    files
  } = useDataAPI()

  function removeDuplicates(arr) {
    return [...new Set(arr)];
  }

  function count(arr, value) {
    if (isNaN(value) && typeof (value) == 'number') {
      return arr.filter(value => isNaN(value) && typeof (value) == 'number').length;
    } else {
      return arr.reduce((count, currtElm) => {
        if (value === currtElm) {
          count++
        }
        return count
      }, 0)
    }
  }

  const handleChatprepData = () => {
    localStorage.setItem('prepData', JSON.stringify(data));
    setShowModel(true);
  }
  const handleOk = async () => {
    // setModalText('The modal will be closed after two seconds');
    // setPrepData(e.)
    setConfirmLoading(true)
    await handlePrepareData(prepData)
    setTimeout(() => {
      setConfirmLoading(false)
    }, 2000)
    setOpen(false)
  };

  const handleRowHover = (index) => {
    setHoveredRowIndex(index);
  };

  const convertToCSV = (data, headers) => {
    const csvContent = [];
    const header = Object.keys(data[0]);
    csvContent.push(headers.join(','));

    data.forEach((item) => {
      const row = header.map((key) => item[key]);
      csvContent.push(row.join(','));
    });

    return csvContent.join('\n');
  };

  const downloadCSV = () => {
    const filteredData = data.map((field) => {
      return headers.map((header) => {
        return field[header]
      })
    })

    const csvData = convertToCSV(filteredData, headers);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'data.csv';

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  useEffect(() => {
    setLoading(true)
    setHeaders(displayContent.headers)
    setData(displayContent.data)
    setFilename(localStorage.getItem("filename"))

    setTimeout(() => {
      setLoading(false)
    }, 2000)

  }, [displayContent])

  useEffect(() => {
    setPopup(displaypopup)
  }, [displaypopup])

  const handleClearedData = async () => {
    const data = await handleCleanData()
    setData(data?.displayContent?.data)
    const rowsRemoved = data?.displayContent?.rowsRemoved || 0;
    alert(`Rows removed: ${rowsRemoved}`);
  }


  return (
    <div style={{ minHeight: '90vh',overflow:'auto'}}>
      <Navbar />
      <div className="professional-table">
        <div className="file-details ms-2">
          {/* <img src="/keyPulse.png" onClick={() => {
            navigate("/")
          }} style={{ cursor: "pointer" }} alt="KeyPulse" width={150} height={65} /> */}
          <p>{filename}</p>
          <p>{data.length} rows</p>
          <p>{headers.length} columns</p>

        </div>
        <div className="filterData ms-2">
          <Button variant="outlined" onClick={() => {
            handleChatprepData()
          }}>Chat Data Prep</Button>
          <div className="clean-section" onClick={() => {
            handleClearedData()
          }} >
            <AiOutlineClear size={25} />
            <span>Clean</span>
          </div>

          <button className='btn btn-success' onClick={downloadCSV}>Download CSV</button>
          <button className='btn btn-transparent' style={{ border: '1px solid grey' }} onClick={() => setView(!view)}>{!view ? 'General View' : 'Data View'}</button>
        </div>

        {loading ? <Spin className='spinner' size={'large'} /> :
          <div className=''>
            {!view ? <table style={{ border: 'none' }} className='discover-table'>
              <thead>
                <tr style={{ zIndex: 9999999 }}>
                  {
                    headers.map((header, index) => {
                      return <th key={index}>{header}</th>
                    })
                  }
                </tr>
                <tr>
                  {
                    headers.map((header, index) => {
                      const timePattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
                      const updatedArray = data.map((value) => {
                        const timePattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
                        if (!isNaN(value[header])) {
                          return parseInt(value[header])
                        }
                        else if (!isNaN(Date.parse(value[header]))) {
                          const date = new Date(value[header])
                          return date.getDate()
                        }
                        else if (timePattern.test(value[header])) {
                          return parseInt(value[header].slice(0, 3))
                        }
                        else {
                          return value[header]
                        }
                      })

                      let uniqueArr = removeDuplicates(updatedArray)

                      if (!isNaN(data[0][header])) {
                        return <td key={index}><span className="badge rounded-pill" style={{ background: '#27ae60' }}>Number</span> </td>
                      }
                      else if (!isNaN(Date.parse(data[0][header]))) {
                        return <td key={index}><span className="badge rounded-pill bg-secondary">Date</span></td>
                      }
                      else if (timePattern.test(data[0][header])) {
                        return <td key={index}><span className="badge rounded-pill bg-danger">Time</span></td>
                      }
                      else if (uniqueArr.length < 10 && isNaN(data[0][header])) {
                        return <td key={index}><span className="badge rounded-pill" style={{ background: 'hsl(10.1, 87.6%, 58.8%)' }}>Category</span> </td>
                      }
                      else if (isNaN(data[0][header])) {
                        return <td key={index}><span className="badge rounded-pill bg-primary">Text</span></td>
                      }

                    })
                  }

                </tr>
                <tr>
                  {
                    headers.map((header, id) => {
                      console.log(data)
                      const updatedArray = data.map((value) => {
                        const timePattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
                        if (!isNaN(value[header])) {
                          return parseFloat(value[header])
                        }
                        else if (!isNaN(Date.parse(value[header]))) {
                          const date = new Date(value[header])
                          return date
                        }
                        else if (timePattern.test(value[header])) {
                          return parseFloat(value[header].slice(0, 3))
                        }
                        else {
                          return value[header]
                        }
                      })
                      // console.log(updatedArray)

                      let uniqueArr = removeDuplicates(updatedArray)
                      if (!isNaN(Date.parse(data[0][header])) || !isNaN(data[0][header])) {
                        const isDate = isNaN(data[0][header]);
                        const updatedData = uniqueArr.map((uniVal) => {
                          return {
                            value: uniVal,
                            count: count(updatedArray, uniVal)
                          }
                        })
                        if(isDate){
                          // console.log(updatedData)
                        }
                        const finalData=getFinalData(updatedArray,isDate,6)
                        return (
                          <td className='firstRow' style={{ overflowX: "hidden", cursor: "pointer" }} key={id}
                            onClick={() => {
                              displayPopupFun({
                                rows: data.length,
                                uniqueValues: uniqueArr.length,
                                uniqueArr: uniqueArr,
                                updatedData: updatedData,
                                updatedArray:updatedArray,
                                title: header,
                                progress: false,
                                totData: data,
                                category: false,
                                isDate:isDate
                              })
                              setPopup(displaypopup)
                              setDisplaypopup(true)
                            }}
                          >
                            {/* <p>{uniqueArr.length} Unique Values</p> */}
                            <BarGraph data={finalData} strokeColor={'rgba(0, 163, 255, 1)'} width={180} className="graph" cursor={'pointer'} header={header} />
                          </td>)
                      }
                      else {
                        const filteredArr = uniqueArr.filter((uniqueVal) => {
                          return uniqueVal !== undefined && uniqueVal !== "";
                        });
                        const arr = filteredArr.map((uniqueVal, index) => {
                          let value = count(updatedArray, uniqueVal)
                          let percent = parseFloat((value / (updatedArray.length)) * 100).toFixed(1)
                          return percent
                        })
                        if (arr.includes("0.00")) {
                          const index = arr.indexOf("0.00")
                          arr.splice(index, 1)
                        }
                        return <td className='firstRow' style={{ overflowX: "auto", cursor: "pointer" }} key={id}
                          onClick={() => {
                            displayPopupFun({
                              rows: data.length,
                              uniqueValues: uniqueArr.length,
                              uniqueArr: uniqueArr,
                              updatedData: arr,
                              title: header,
                              progress: true,
                              totData: data,
                              correlations: uniqueArr.length < 10,
                            })
                            setPopup(displaypopup)
                            setDisplaypopup(true)
                          }}
                        >
                          <div className="first-container">
                            {/* <span>{arr.length} Unique Values</span> */}
                            {arr.map((percentValue, index) => {
                              if (index < 2) {
                                let name = (typeof uniqueArr[index] === 'number' && isNaN(uniqueArr[index])) ? 'blank' : uniqueArr[index];
                                return (
                                  <div className="progress-container" key={index}>
                                    <div style={{ width: '220px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                      <p title={name} style={{ width: '130px', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'start' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {name}
                                        </span>
                                      </p>
                                      <p>{percentValue}%</p>
                                    </div>
                                    <Progress style={{ width: "220px" }} strokeColor={'#00a3f'} size="small" showInfo={false} percent={percentValue} status="active" />
                                  </div>
                                );
                              } else if (index === 2) {
                                // Calculate the total of the remaining values in arr
                                let totalPercent = 100 - arr.slice(0, 2).reduce((acc, curr) => acc + parseFloat(curr), 0);
                                return (
                                  <div className="progress-container" key={index}>
                                    <div style={{ width: '220px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                      <p style={{ width: '130px', display: 'flex', justifyContent: 'start' }}>others</p>
                                      <p>{totalPercent.toFixed(1)}%</p>
                                    </div>
                                    <Progress style={{ width: "220px" }} strokeColor={'#00a3f'} size="small" showInfo={false} percent={totalPercent} status="active" />
                                  </div>
                                );
                              }
                            })}

                          </div>
                        </td>
                      }

                    })

                  }
                </tr>
              </thead>

              <tbody>
                {data.map((row, index) => {
                  return <tr
                    key={index}
                    className={index === hoveredRowIndex ? 'hovered' : ''}
                    onMouseEnter={() => handleRowHover(index)}
                    onMouseLeave={() => handleRowHover(-1)}
                  >
                    {
                      headers.map((head, index) => {
                        return <td key={index} >{row[head]}</td>
                      })
                    }

                    {/* Add more data columns as needed */}
                  </tr>
                })}
              </tbody>
            </table> : <div>
              <PivotView {...{ headers, data, removeDuplicates }} />
            </div>}
          </div>
        }
      </div>
      {
        displaypopup ? <EndPopup setDisplaypopup={setDisplaypopup} popup={popup} /> : <></>
      }



      <Modal
        title=""
        open={open}
        style={{ top: '40%', zIndex: 99999 }}
        onCancel={() => setOpen(false)}
        footer={[
          <button
            key="link"
            href="https://google.com"
            type="primary"
            loading={loading}
            onClick={handleOk}
            style={{ width: '100%' }}
            className='btn btn-primary'
          >
            Upgrade Plan
          </button>,
        ]}
      >
        {/* <Input size='large' onChange={(e) => handleEvent(e)} value={prepData} type="text" placeholder="e.g. Filter out all columns except the first 2" /> */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <BsStars size={24} color='blue' style={{ marginTop: '20px', marginBottom: '10px' }} />
          <p style={{ fontSize: '18px', fontWeight: '500' }}>This feature is not available for the view only plan.</p>
          <p style={{ fontSize: '14px', fontWeight: '400' }}>Please Upgrade your plan to use this feature</p>
        </div>
      </Modal>
      <>
      </>
      <ChatDataPrep {...{ showModel, setShowModel }} />
    </div>
  )
}

export default DisplayData