import React, { useEffect, useState } from "react";
import { useDataAPI } from "../contexts/GetDataApi";
//import BarGraph from './BarGraph'
import { AiOutlineClose } from "react-icons/ai";
import { Progress } from "antd";
import { getFinalData } from "../../../../utils/const";
const EndPopup = ({ setDisplaypopup, popup }) => {
  const { displayPopup } = useDataAPI();
  const [state, setState] = useState({});
  console.log(state);
  useEffect(() => {
    setState({
      ...displayPopup,
    });
  }, [displayPopup, popup]);

  const calculateCorrelationCoefficient = (data, header1, header2) => {
    console.log(data);

    // Initialize arrays for values
    let arrf1 = [];
    let arrf2 = [];

    // Extract values for header1 and header2, ensuring they are numbers
    data.forEach((obj) => {
      if (obj[header1] && obj[header2]) {
        const val1 = parseFloat(obj[header1]);
        const val2 = parseFloat(obj[header2]);

        if (!isNaN(val1) && !isNaN(val2)) {
          arrf1.push(val1);
          arrf2.push(val2);
        }
      }
    });

    // Ensure arrays have valid values before calculating correlation
    if (arrf1.length === 0 || arrf2.length === 0) {
      console.error("No valid data to calculate correlation.");
      return 0; // Return 0 if no valid data found
    }

    // Call the function to calculate Pearson correlation
    const correper = Math.abs(calculatePearsonCorrelation(arrf1, arrf2)); // Absolute value for positive correlation
    console.log(correper);

    // Return the correlation percentage
    return (correper * 100).toFixed(2);
  };

  const calculatePearsonCorrelation = (arr1, arr2) => {
    const n = arr1.length;
    const sum1 = arr1.reduce((a, b) => a + b, 0);
    const sum2 = arr2.reduce((a, b) => a + b, 0);
    const sum1Sq = arr1.reduce((a, b) => a + b * b, 0);
    const sum2Sq = arr2.reduce((a, b) => a + b * b, 0);
    const pSum = arr1
      .map((_, i) => arr1[i] * arr2[i])
      .reduce((a, b) => a + b, 0);
    const num = pSum - (sum1 * sum2) / n;
    const den = Math.sqrt(
      (sum1Sq - (sum1 * sum1) / n) * (sum2Sq - (sum2 * sum2) / n)
    );

    return den === 0 ? 0 : num / den;
  };

  const headers = Object.keys(
    state.totData?.length > 0 ? state?.totData[0] : []
  );

  function removeDuplicates(arr) {
    return [...new Set(arr)];
  }
  const finalHeaders = headers.map((header) => {
    const updatedArray = state.totData.map((value) => {
      const timePattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!isNaN(value[header])) {
        return parseInt(value[header]);
      } else if (!isNaN(Date.parse(value[header]))) {
        const date = new Date(value[header]);
        return date;
      } else if (timePattern.test(value[header])) {
        return parseInt(value[header].slice(0, 3));
      } else {
        return value[header];
      }
    });
    let uniqueArrf = removeDuplicates(updatedArray);
    let uniqueArr = uniqueArrf.filter((item) => item !== undefined);
    return {
      correlation: uniqueArr.length < 10 && uniqueArr.length > 1,
      name: header,
      integer: uniqueArr.length < 10 && !isNaN(state.totData[0][header]),
    };
  });
  let headerData = finalHeaders.filter((item) => item.name === state.title);
  let corHeadrs = [];
  if (headerData[0]?.correlation) {
    finalHeaders.map((item) => {
      if (item.correlation) {
        corHeadrs.push(item.name);
      }
    });
  } else {
    finalHeaders.map((item) => {
      if (item.integer) {
        corHeadrs.push(item.name);
      }
    });
  }

  const finalData = getFinalData(state.updatedArray, state.isDate, 12);
  return (
    <>
      <div
        className={
          popup ? "popup-container open-popup" : "popup-container close-popup"
        }
      >
        <div className="title">
          {state.title}
          <AiOutlineClose
            cursor={"pointer"}
            className="close-btn"
            size={25}
            onClick={() => {
              setDisplaypopup(false);
            }}
          />
        </div>
        <div className="new-fin">
          <div className="data">
            <div className="rows">
              <span style={{ fontSize: "15px" }}>Rows</span>{" "}
              <span style={{ fontSize: "20px" }}>{state.rows}</span>
            </div>
            <div className="rows">
              <span style={{ fontSize: "15px" }}>Empty Rows</span>{" "}
              <span style={{ fontSize: "20px" }}>
                {state.updatedData?.find((obj) => isNaN(obj.value))?.count || 0}
              </span>
            </div>
            <div className="unique-values">
              <span style={{ fontSize: "15px", marginLeft: "5px" }}>
                Unique Values
              </span>{" "}
              <span style={{ fontSize: "20px", marginLeft: "5px" }}>
                {state.uniqueValues}
              </span>
            </div>
          </div>
          <div
            style={{
              padding: "10px 0px",
              borderBottom: "1px solid black",
              marginBottom: "10px",
            }}
          >
            <span
              style={{ padding: "0px 20px", fontSize: "18px", fontWeight: 500 }}
            >
              Distributions
            </span>
            {state.progress ? (
              state.updatedData.map((value, index) => {
                let name =
                  typeof state.uniqueArr[index] === "number" &&
                  isNaN(state.uniqueArr[index])
                    ? "blank"
                    : state.uniqueArr[index];
                return (
                  <>
                    <div
                      className="progress-container"
                      style={{ padding: "0px 20px" }}
                      key={index}
                    >
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          height: "20px",
                        }}
                      >
                        <p
                          title={name}
                          style={{
                            width: "130px",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            display: "flex",
                            justifyContent: "start",
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {name}
                          </span>
                        </p>
                        <p>{value}%</p>
                      </div>
                      <Progress
                        style={{ width: "100%" }}
                        strokeColor={"#00a3f"}
                        size="small"
                        showInfo={false}
                        percent={value}
                        status="active"
                      />
                    </div>
                  </>
                );
              })
            ) : (
              <div style={{ width: "100%" }}>
                {/*  <BarGraph data={finalData} cursor={'pointer'} header={state.title} width={320} height={220}/> */}
              </div>
            )}
          </div>
          <div style={{ marginBottom: "30px" }}>
            <span
              style={{ padding: "0px 20px", fontSize: "18px", fontWeight: 500 }}
            >
              Correlations
            </span>
            {headers.map((header2, index2) => {
              if (state.title !== header2) {
                let correlation;
                correlation = calculateCorrelationCoefficient(
                  state.totData?.length > 0 ? state.totData : [],
                  state.title,
                  header2
                );
                return (
                  <div
                    className="progress-container"
                    style={{ padding: "0px 20px", marginTop: "2px" }}
                    key={`${state.title}-${header2}`}
                  >
                    <div
                      style={{
                        width: "96%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        height: "20px",
                      }}
                    >
                      <p title={`${state.title} vs ${header2}`} style={{}}>
                        <span style={{}}>{`${header2}`}</span>
                      </p>
                      <p>{correlation || 0}%</p>
                    </div>
                    <Progress
                      style={{ width: "100%", marginBottom: "2px" }}
                      size={[300, 4]}
                      strokeColor={"hsl(231.8, 35.7%, 72%)"}
                      showInfo={false}
                      percent={correlation}
                      status="active"
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default EndPopup;
