import React, { useEffect, useState } from 'react';
import './styles.css'; // Import your CSS file for styling
import { MdDeleteOutline } from 'react-icons/md'
import moment from 'moment'
import axios from 'axios'
export const transformData = (data) => {
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
export const Datasets = () => {
    // Sample dataset for demonstration
    const [datasets, setDatasets] = useState([
        { id: 'tTaZ591iDv1c4iJj85Ip ', name: 'sampledata.csv', lastUpdate: '2024-02-25', dateCreated: '2024-01-01' },
        { id: '6rVtP7IXgNiZEIakqW9G ', name: ' OKRDATA1707843206710.xlsx ', lastUpdate: '2024-02-24', dateCreated: '2024-01-15' },
        { id: 'srVtP7IXgsiZEIakqW9G', name: 'Name.csv', lastUpdate: '2024-02-23', dateCreated: '2024-02-01' },
        { id: '7HUHJJgNiZEIakqW9Gsn', name: 'Dataset.xsxl', lastUpdate: '2024-02-25', dateCreated: '2024-01-01' },
        { id: 'ueP7IXgNiZEIakqW9Gaa', name: 'finalmodel.cscv', lastUpdate: '2024-02-24', dateCreated: '2024-01-15' },
    ]);

    // State for search input
    const [searchTerm, setSearchTerm] = useState('');

    // Handle search input change
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filter datasets based on search term
    const filteredDatasets = datasets.filter(dataset =>
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Function to delete a dataset
    const handleDelete = (id) => {
        setDatasets(datasets.filter(dataset => dataset.id !== id));
    };


    
    const handleGetData = async () => {
        const response = await axios.post('http://3.132.248.171:7500/tableinfo',{});
        console.log(response)
        if (response.status === 200) {
         const data= transformData(response.data).map((item)=>{
            return({
                ...item,datecreated:moment(item.datecreated).format("YY-MMM-DD"),lastupdate:moment(item.lastupdate).format("YY-MMM-DD")
            })
         })
         console.log(data)
         setDatasets(data)
        }
    }

    useEffect(()=>{
        handleGetData()
    },[])

    return (
        <div className='w-100 datasets' style={{display:'flex',justifyContent:'center'}}>
            <div className="dataset-page mx-5" style={{ width: '80%'}}>
                <h1 style={{ fontSize: '28px',marginTop:'10px' }}>Datasets</h1>
                <input
                    type="text"
                    placeholder="Search datasets..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className='datasetinput'
                />
                <table className='datasetTable'>
                    <thead className='datasetHeader'>
                        <tr>
                            <th>Name</th>
                            <th>ID</th>
                            <th>Last Update</th>
                            <th>Date Created</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody className='datasetBody'>
                        {filteredDatasets.map(dataset => (
                            <tr key={dataset.id}>
                                <td>{dataset.name}</td>
                                <td>{dataset.id}</td>
                                <td>{dataset.lastupdate}</td>
                                <td>{dataset.datecreated}</td>
                                <td>
                                    <MdDeleteOutline color='red' size={21} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};