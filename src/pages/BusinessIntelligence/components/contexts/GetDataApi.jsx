import React, { createContext, useContext, useEffect, useReducer, useState } from 'react'
import Papa from 'papaparse';
import { app } from '../firebaseConfig';
import { DataReducer as reducer } from '../reducers/DataReducer'
import { Spin } from 'antd';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { read, utils } from 'xlsx'; // Import xlsx for Excel file parsing

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

  const [uploadedData, setUploadedData] = useState([])
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

  const db = getFirestore(app);

  const handleUpload = async (file, database = false, data = [],tableName='') => {
    setLoading(true)
    dispatch({ type: "ADD_FILE_DETAILS", payload: file })
    if (database) {
      const finalData=transformData(data)
      const value = JSON.stringify({
        filename: tableName,
        data: finalData,
      });

      setUploadedData([value]);
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

            setUploadedData([value]);
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
          console.log(value)
          setUploadedData([value]);
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

          setUploadedData([value]);
        }
        setLoading(false);
        getData();
      };
      reader.readAsText(file);
    } else {
      // Unsupported file type
      console.error("Unsupported file type");
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
    console.log(popupData)
    dispatch({ type: "DISPLAY_POPUP", payload: popupData })
  }

  const showContent = (content) => {
    dispatch({ type: "SHOW_CONTENT", payload: content })
  }

  const changePopup = () => {
    dispatch({ type: "CHANGE_POPUP" })
  }

  const handleCleanData = () => {
    const clean = window.confirm("Rows containing zero will be removed")
    if (clean) {
      dispatch({ type: 'Clean_Data' })
    }
  }

  const handlePrepareData = (inputData) => {
    dispatch({ type: "Prepare_Data", inputData: inputData })
  }

  return (
    <GetDataContext.Provider value={{ ...state, handleUpload, loadingFun, removeData, displayPopupFun, showContent, changePopup, handleCleanData, handlePrepareData, key: "key" }}>
      {children}
    </GetDataContext.Provider>
  )
}

const useDataAPI = () => {
  return useContext(GetDataContext)
}

export { GetDataApi, useDataAPI }