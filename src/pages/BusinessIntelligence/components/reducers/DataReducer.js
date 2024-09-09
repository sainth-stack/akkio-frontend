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
        const cleanedData = state.displayContent.data.filter((field, index) => {
            return !Object.values(field).includes('0')
        })

        return {
            ...state,
            displayContent: {
                filename: state.displayContent.filename,
                headers: state.displayContent.headers,
                data: cleanedData
            }
        }
    }

    if (action.type === "Prepare_Data") {
        const value = action.inputData.toLowerCase()
        const filteredHeaders = state.displayContent.headers.filter((header, index) => {
            return value.includes(header.toLowerCase())
        })
        console.log({
            filename: state.displayContent.filename,
            headers: filteredHeaders,
            data: state.displayContent.data
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
