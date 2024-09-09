export const PivotView = ({ headers, data, removeDuplicates }) => {
    const pivotHeaders = ['Column Number', 'Column Name', 'Data Type', 'Empty Rows', 'Unique Values']
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    const getDataType = (header, type) => {
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
        console.log(uniqueArr)
        if (type == 'dp') {
            if (!isNaN(data[0][header])) {
                return 'Number'
            }
            else if (!isNaN(Date.parse(data[0][header]))) {
                return 'Date'
            }
            else if (timePattern.test(data[0][header])) {
                return 'Time'
            }
            else if (uniqueArr.length < 10 && isNaN(data[0][header])) {
                return 'Category'
            }
            else if (isNaN(data[0][header])) {
                return 'Text'
            }
        }
        if (type == 'er') {
            return uniqueArr.filter(element => element === undefined || element =='').length || 0;
        }
        if(type=='uv'){
            return uniqueArr.length
        }
    }
    const finData = Object.keys(data[0]).map((item, index) => {
        return {
            'Column Number': index + 1,
            'Column Name': item,
            'Data Type': getDataType(item, 'dp'),
            'Empty Rows': getDataType(item, 'er'),
            'Unique Values':getDataType(item,'uv')
        }
    })
    console.log(finData)
    return (
        <div>
            <table style={{ border: 'none' }}>
                <thead>
                    <tr style={{ zIndex: 9999999 }}>
                        {
                            pivotHeaders.map((header, index) => {
                                return <th key={index}>{header}</th>
                            })
                        }
                    </tr>

                </thead>

                <tbody>
                    {finData.map((row, index) => {
                        return <tr
                            key={index}
                        >
                            {
                                pivotHeaders.map((head, index) => {
                                    return <td key={index} >{row[head]}</td>
                                })
                            }

                            {/* Add more data columns as needed */}
                        </tr>
                    })}
                </tbody>
            </table>
        </div>
    )
}