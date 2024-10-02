import React, { createContext, useContext, useEffect, useReducer, useState } from 'react'
import Papa from 'papaparse';
import { app } from '../firebaseConfig';
import { DataReducer as reducer } from '../reducers/DataReducer'
import { Spin } from 'antd';
import { read, utils } from 'xlsx'; // Import xlsx for Excel file parsing
import { finalData } from './data';
import moment from 'moment';

const GetDataContext = createContext()

const initalState = {
  uploadedData: [],
  files: [],
  displayContent: localStorage.getItem("displayContent") ? JSON.parse(localStorage.getItem("displayContent")) : {
    filename: "",
    headers: [],
    data: []
  },
  displayPopup: {
    rows: 0,
    uniqueValues: 0,
    updatedData: [],
    uniqueArr: [],
    title: ""
  },
  popup: false
}


const GetDataApi = ({ children }) => {

  const [uploadedData, setUploadedData] = useState(finalData)
  const [state, dispatch] = useReducer(reducer, initalState)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem("displayContent", JSON.stringify(state.displayContent))
  }, [state.displayContent])

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {
    localStorage.setItem("files", JSON.stringify(state.files))
  }, [state.files])

  useEffect(() => {
    dispatch({ type: "UPLOADED_DATA", payload: uploadedData })
  }, [state.displayPopup, uploadedData])

  const removeData = (removeItem) => {
    dispatch({ type: "REMOVE_ITEM", payload: removeItem })
  }

  const loadingFun = () => {
    return <Spin size='large' />
  }

  const transformData = (data) => {
    const transformedData = [];

    // Get the keys (categories)
    const keys = Object.keys(data);

    // Assuming all categories have the same number of items
    for (let i = 0; i < Object.values(data[keys[0]]).length; i++) {
      const item = {};

      // Iterate through each category
      keys.forEach((key) => {
        // Get the value for the current index in each category
        const value = data[key][i];

        // Add the key-value pair to the item object
        item[key] = value;
      });

      // Push the item object to the transformed data array
      transformedData.push(item);
    }

    return transformedData;
  };


  const handleLogout2 = () => {
    dispatch({ type: "LOGOUT" });
  }


  const handleUpload = async (file, database = false, data = [], tableName = '') => {
    setLoading(true)
    dispatch({ type: "ADD_FILE_DETAILS", payload: file })
    if (database) {
      const finalData = transformData(data)
      console.log(finalData)
      const value = JSON.stringify({
        filename: tableName,
        data: finalData,
      });
      setUploadedData([value, ...uploadedData]);
      getData();
    }
    else if (file?.type === "text/csv") {
      // Parse CSV files
      Papa.parse(file, {
        complete: async (result) => {
          const csvData = result.data;
          const flattenedData = csvData.slice(1).map((row) => {
            const rowData = {};
            csvData[0].forEach((header, index) => {
              rowData[header] = row[index];
            });
            return rowData;
          });

          if (flattenedData !== undefined) {
            const value = JSON.stringify({
              filename: file.name,
              data: flattenedData,
            });

            setUploadedData([value, ...uploadedData]);
          }
          setLoading(false);
          getData();
        }
      });
    } else if (file?.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      // Parse Excel files
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const excelData = utils.sheet_to_json(sheet, { header: 1 });

        if (excelData.length > 0) {
          const headers = excelData[0];
          const flattenedData = excelData.slice(1).map((row) => {
            const rowData = {};
            row.forEach((cell, index) => {
              rowData[headers[index]] = cell;
            });
            return rowData;
          });

          const value = JSON.stringify({
            filename: file.name,
            data: flattenedData,
          });
          setUploadedData([value, ...uploadedData]);
        }
        setLoading(false);
        getData();
      };
      reader.readAsArrayBuffer(file);
    } else if (file?.type === "application/json") {
      // Handle JSON files
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonData = JSON.parse(e.target.result);

        if (jsonData) {
          const value = JSON.stringify({
            filename: file.name,
            data: jsonData,
          });

          setUploadedData([value, ...uploadedData]);
        }
        setLoading(false);
        getData();
      };
      reader.readAsText(file);
    } else {
      // Unsupported file type
      setLoading(false);
    }

  };

  const getData = () => {
    // onSnapshot(collection(db, "uploadedFiles"), (res) => {
    //   setUploadedData(res.docs.map((doc) => {
    //     // console.log(doc.data())
    //     return {
    //       ...doc.data(), id: doc.id
    //     }
    //   }))
    //   // setCsvData(tempData)
    // })

  }

  const displayPopupFun = (popupData) => {
    dispatch({ type: "DISPLAY_POPUP", payload: popupData })
  }

  const showContent = (content) => {
    dispatch({ type: "SHOW_CONTENT", payload: content })
  }

  const changePopup = () => {
    dispatch({ type: "CHANGE_POPUP" })
  }

  // const handleCleanData = () => {
  //   const originalDataLength = state.displayContent.data.length;

  //   const cleanedData = state.displayContent.data.filter((field) => {
  //     // Filter rows where no value is empty, undefined, null, '0', or 0
  //     return !Object.values(field).some(value =>
  //       value === '' || value === null || value === undefined
  //     );
  //   });

  //   const rowsRemoved = originalDataLength - cleanedData.length;

  //   return {
  //     ...state,
  //     displayContent: {
  //       ...state.displayContent, // Preserve other properties of displayContent
  //       data: cleanedData,
  //       rowsRemoved
  //     }
  //   };
  // }

  const handleCleanData = (options) => {
    let data = [...state.displayContent.data];
    let removedRows = [];  // To store removed rows

    // 1. Standardize Date Columns
    if (options.standardizeDateColumns) {
      data = data.map(row => ({
        ...row,
        // Assuming date columns have 'Date' in their name (adjust logic as needed)
        Date: isValidDate(row.Date)
          ? moment(row.Date).format('DD-MM-YYYY')  // Use moment to format date as DD-MM-YYYY
          : row.Date
      }));
    }


    // 2. Remove Unexpected Nulls
    if (options.removeNulls) {
      const removed = data.filter((row) => {
        return Object.values(row).some(value =>
          value === '' || value === null || value === undefined
        );
      });
      removedRows.push(...removed);  // Track removed rows
      data = data.filter((row) => {
        return !Object.values(row).some(value =>
          value === '' || value === null || value === undefined
        );
      });
    }

    // Alert the removed data
    if (removedRows.length > 0) {
      alert(JSON.stringify(removedRows, null, 2));  // You can customize this to show in a better way
    } else {
      alert("No rows were removed during cleaning.");
    }

    // Dispatch action to update the state
    dispatch({
      type: 'Clean_Data',
      payload: {
        data,  // The cleaned data
        rowsRemoved: removedRows.length,  // Number of rows removed (optional)
      }
    });
  };

  // Helper function to check if a date is valid
  const isValidDate = (date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  };


  // Helper function to check if a date is valid



  const handlePrepareData = (inputData) => {
    dispatch({ type: "Prepare_Data", inputData: inputData })
  }

  return (
    <GetDataContext.Provider value={{ ...state, handleUpload, loadingFun, removeData, displayPopupFun, showContent, changePopup, handleCleanData, handlePrepareData, handleLogout2, key: "key" }}>
      {children}
    </GetDataContext.Provider>
  )
}

const useDataAPI = () => {
  return useContext(GetDataContext)
}

export { GetDataApi, useDataAPI }