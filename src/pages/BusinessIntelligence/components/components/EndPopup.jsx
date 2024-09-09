import React, { useEffect, useState } from 'react'
import { useDataAPI } from '../contexts/GetDataApi'
import BarGraph from './BarGraph'
import { AiOutlineClose } from "react-icons/ai"
import { Progress } from 'antd'
const EndPopup = ({ setDisplaypopup, popup }) => {
  const {
    displayPopup
  } = useDataAPI()
  const [state, setState] = useState({})
  console.log(state)
  useEffect(() => {
    setState(displayPopup)
  }, [displayPopup, popup])
  const calculateCorrelationCoefficient = (data, header1, header2) => {
    let arrf1 = []
    let arrf2 = []
    const arr1 = data.map(obj => {
      if (obj[header1]) {
        arrf1.push(obj[header1])
      }
    });
    const arr2 = data.map(obj => {
      if (obj[header2]) {
        arrf2.push(obj[header2])
      }
    });;

    const correper = calculateCorrelation(arrf1, arrf2)
    console.log(correper)
    return correper;
  };
  const calculateCorrelation = (arr1,arr2) => {
    // Create contingency table
    const contingencyTable = {};
    for (let i = 0; i < arr1.length; i++) {
      if (!contingencyTable[arr1[i]]) {
        contingencyTable[arr1[i]] = {};
      }
      if (!contingencyTable[arr1[i]][arr2[i]]) {
        contingencyTable[arr1[i]][arr2[i]] = 0;
      }
      contingencyTable[arr1[i]][arr2[i]]++;
    }

    // Calculate chi-square
    let chiSquare = 0;
    const totalObservations = arr1.length;
    const totalGenders = Object.keys(contingencyTable).length;
    const totalJobs = Object.keys(contingencyTable[arr1[0]]).length;

    for (const gender in contingencyTable) {
      for (const job in contingencyTable[gender]) {
        const observed = contingencyTable[gender][job];
        const expected = (arr1.filter(g => g === gender).length * arr2.filter(j => j === job).length) / totalObservations;
        chiSquare += Math.pow((observed - expected), 2) / expected;
      }
    }

    // Degrees of freedom
    const degreesOfFreedom = (totalGenders - 1) * (totalJobs - 1);

    // Look up chi-square critical value for given degrees of freedom and confidence level (e.g., 0.05)
    const chiSquareCriticalValue = getChiSquareCriticalValue(degreesOfFreedom);

    // Calculate correlation percentage
    const correlationPercentage = 1 - getChiSquareProbability(chiSquare, degreesOfFreedom);

   return correlationPercentage.toFixed(2) * 100
  };

  const getChiSquareCriticalValue = (degreesOfFreedom) => {
    // Lookup table for critical values (alpha = 0.05)
    const criticalValues = {
      1: 3.841,
      2: 5.991,
      3: 7.815,
      4: 9.488,
      5: 11.070,
      // Add more degrees of freedom and their corresponding critical values as needed
    };
  
    return criticalValues[degreesOfFreedom] || null; // Return null if degrees of freedom not found
  };
  
  const getChiSquareProbability = (chiSquare, degreesOfFreedom) => {
    // Implement approximation function or use lookup table for chi-square probability
    // For simplicity, we will use a built-in JavaScript function to get the probability.
    // This approach may not be accurate for all cases and might require more complex calculations.
    const probability = 1 - Math.round(Math.pow(Math.E, -chiSquare / 2) * 100) / 100;
  
    return probability;
  };




  const headers = Object.keys(state.totData?.length > 0 ? state?.totData[0] : []);

  function removeDuplicates(arr) {
    return [...new Set(arr)];
  }
  const finalHeaders = headers.map((header) => {
    const updatedArray = state.totData.map((value) => {
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
    let uniqueArrf = removeDuplicates(updatedArray)
    let uniqueArr = uniqueArrf.filter((item) => item !== undefined)
    return {
      correlation: uniqueArr.length < 10 && uniqueArr.length > 1,
      name: header,
      integer: uniqueArr.length < 10 && !isNaN(state.totData[0][header])
    }
  })
  let headerData = finalHeaders.filter((item) => item.name === state.title)
  let corHeadrs = []
  if (headerData[0]?.correlation) {
    finalHeaders.map((item) => {
      if (item.correlation) {
        corHeadrs.push(item.name)
      }
    })
  } else {
    finalHeaders.map((item) => {
      if (item.integer) {
        corHeadrs.push(item.name)
      }
    })
  }

  return (
    <>
      <div className={popup ? 'popup-container open-popup' : 'popup-container close-popup'} >
        <div className="title">
          {state.title}
          <AiOutlineClose cursor={"pointer"} className='close-btn' size={25} onClick={() => {
            setDisplaypopup(false)
          }} />
        </div>
        <div className='new-fin'>
          <div className="data">
            <div className="rows">
              <span style={{ fontSize: '15px' }}>Rows</span> <span style={{ fontSize: '20px' }}>{state.rows}</span>
            </div>
            <div className="rows">
              <span style={{ fontSize: '15px' }}>Empty Rows</span> <span style={{ fontSize: '20px' }}>{state.updatedData?.find(obj => isNaN(obj.value))?.count || 0}</span>
            </div>
            <div className="unique-values">
              <span style={{ fontSize: '15px', marginLeft: '5px' }}>Unique Values</span> <span style={{ fontSize: '20px', marginLeft: '5px' }}>{state.uniqueValues}</span>
            </div>
          </div>
          <div style={{ padding: '10px 0px', borderBottom: '1px solid black', marginBottom: '10px' }}>
            <span style={{ padding: '0px 20px', fontSize: '18px', fontWeight: 500 }}>Distributions</span>
            {
              state.progress ? state.updatedData.map((value, index) => {
                let name = (typeof state.uniqueArr[index] === 'number' && isNaN(state.uniqueArr[index])) ? 'blank' : state.uniqueArr[index];
                return (
                  <>
                    <div className="progress-container" style={{ padding: '0px 20px' }} key={index}>
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', height: '20px' }}>
                        <p title={name} style={{ width: '130px', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'start' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {name}
                          </span>
                        </p>
                        <p>{value}%</p>
                      </div>
                      <Progress style={{ width: "100%" }} strokeColor={'#00a3f'} size="small" showInfo={false} percent={value} status="active" />
                    </div>
                  </>
                );
              }) :
                <div>
                  <BarGraph data={state.updatedData} cursor={'pointer'} header={state.title} />
                </div>
            }
          </div>
          <div style={{ marginBottom: '30px' }}>
            <span style={{ padding: '0px 20px', fontSize: '18px', fontWeight: 500 }}>Correlations</span>
            {
              headers.map((header2, index2) => {
                if (state.title !== header2 && state.correlations && corHeadrs.filter((item) => item.toString() === header2.toString()).length > 0) {
                  let correlation;
                  correlation = calculateCorrelationCoefficient(state.totData?.length > 0 ? state.totData : [], state.title, header2);
                  return (
                    <div className="progress-container" style={{ padding: '0px 20px', marginTop: '2px' }} key={`${state.title}-${header2}`}>
                      <div style={{ width: '96%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', height: '20px' }}>
                        <p title={`${state.title} vs ${header2}`} style={{}}>
                          <span style={{}}>
                            {`${header2}`}
                          </span>
                        </p>
                        <p>{correlation || 0 }%</p>
                      </div>
                      <Progress style={{ width: "100%", marginBottom: '2px' }} size={[300, 4]} strokeColor={'hsl(231.8, 35.7%, 72%)'} showInfo={false} percent={correlation} status="active" />
                    </div>
                  );
                }
                return null;
              })
            }
          </div>
        </div>
      </div>

    </>
  )
}

export default EndPopup