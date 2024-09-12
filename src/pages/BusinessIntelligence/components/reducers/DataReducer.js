export const DataReducer = (state, action) => {
    if (action.type === "UPLOADED_DATA") {
        const data = action.payload
        return {
            ...state,
            uploadedData: data,
        }
    }

    if (action.type === "ADD_FILE_DETAILS") {
        const file = action.payload
        return {
            ...state,
            files: [...state.files, file]
        }
    }



    if (action.type === "DISPLAY_POPUP") {
        return {
            ...state,
            displayPopup: action.payload
        }
    }

    if (action.type === "SHOW_CONTENT") {
        const { filename, headers, data, fileDetails } = action.payload
        return {
            ...state,
            displayContent: {
                filename: filename,
                headers: headers,
                data: data,
            }
        }
    }

    if (action.type === "CHANGE_POPUP") {
        return {
            ...state,
            popup: !state.popup
        }
    }

    if (action.type === "REMOVE_ITEM") {
        const filteredData = state.uploadedData.filter((item, index) => {
            return index !== action.payload
        })
        return {
            ...state,
            uploadedData: filteredData
        }
    }


    if (action.type === "Clean_Data") {
        const originalDataLength = state.displayContent.data.length;
    
        const cleanedData = state.displayContent.data.filter((field) => {
            // Filter rows where no value is empty, undefined, null, '0', or 0
            return !Object.values(field).some(value => 
                value === '0' || value === 0 || value === '' || value === null || value === undefined
            );
        });
    
        const rowsRemoved = originalDataLength - cleanedData.length;
    
        console.log(`Rows removed: ${rowsRemoved}`);
    
        return {
            ...state,
            displayContent: {
                ...state.displayContent, // Preserve other properties of displayContent
                data: cleanedData
            }
        };
    }
    
    

    if (action.type === "Prepare_Data") {
        const value = action.inputData.toLowerCase()
        const filteredHeaders = state.displayContent.headers.filter((header, index) => {
            return value.includes(header.toLowerCase())
        })
        return {
            ...state,
            displayContent: {
                filename: state.displayContent.filename,
                headers: filteredHeaders,
                data: state.displayContent.data
            }
        }
    }


    return state
}
