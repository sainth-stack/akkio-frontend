// MiddleContent.js

import { CircularProgress, Grid } from "@mui/material"
import TextField from '@mui/material/TextField';
import { useState } from "react";
import axios from "axios";
import './Main.css'
import ColumnDescriptions from "./components/columnDesc";
import SampleDataTable from "./components/sampleData";
import Accordion from "./components/accordian";
import FileUpload from "./components/browseFiles";
import SampleQuestion from "./components/questions";
import AnswersAccordion from "./components/answers";
import { Tabs, Tab, InputAdornment } from '@mui/material';
import { IoMdRefresh, IoMdSend } from 'react-icons/io';
import { akkiourl } from "../../utils/const";
const GenAi = () => {

    const [search, setSearch] = useState('')
    const [question, setQuestion] = useState([
    ])
    const [response, setResponse] = useState()
    const handleSend = () => {
        const updatedata = [...question, {
            question: search,
            answer: true,
        }]
        setQuestion(updatedata)
        handleGetAnswer(updatedata)
        setSearch('')
    }


    const [questions, setQuestions] = useState([
        "What is the minimum gross_income of the data?",
        "What is the mean quantity of the data?",
        "What is the 50th percentile of unit price of the data?",
        "What is the 25th percentile of gross_income of the data?",
        "What is the 25th percentile of tax_5_percentage of the data?"
    ]);
    const [answers, setAnswers] = useState([]);

    const [columnDescriptions, setColumnDesc] = useState(`a description of the columns in the provided data:
  
  1. Store ID: This column contains numerical values representing the unique identification number of the store where the sales data was recorded. Each row corresponds to a different store.
  2. Employee Number: This column includes numerical values that represent the unique identification number of the employee associated with the sales data recorded in each row.
  3. Date: This column likely includes date values indicating when the sales data was recorded.
  4. Net Sales: This column contains numerical values representing the total sales amount after deducting any returns or discounts. It may include sales from both in-store and online transactions.
  5. Taxes: This column likely includes numerical values representing the amount of taxes applied to the sales recorded in each row.
  6. Taxable Sales: This column contains numerical values representing the portion of sales that are subject to taxation.
  7. Home Sales: This column includes numerical values representing the sales amount specifically related to home products or categories.
  8. Clothes Sales: This column contains numerical values representing the sales amount specifically related to clothing products or categories.
  
  These descriptions provide an overview of the data columns and the type of information they contain`);

    const [sampleData, setSampleData] = useState(`{"Store ID":{"0":1,"1":1,"2":1,"3":1,"4":1,"5":1,"6":1,"7":1,"8":1,"9":1},"Employee Number":{"0":54,"1":57,"2":50,"3":56,"4":50,"5":56,"6":52,"7":56,"8":55,"9":58},"Area":{"0":"Asia","1":"Asia","2":"Asia","3":"Asia","4":"Asia","5":"Asia","6":"Asia","7":"Asia","8":"Asia","9":"Asia"},"Date":{"0":"2018-01-31","1":"2018-02-28","2":"2018-03-31","3":"2018-04-30","4":"2018-05-31","5":"2018-06-30","6":"2018-07-31","7":"2018-08-31","8":"2018-09-30","9":"2018-10-31"},"Sales":{"0":86586.23,"1":131181.61,"2":185833.69,"3":150538.66,"4":183421.04,"5":292656.36,"6":214964.98,"7":189526.91,"8":222308.26,"9":213762.78},"Marketing Spend":{"0":16022.68,"1":6562.93,"2":1106.61,"3":16586.79,"4":2708.69,"5":10459.98,"6":26320.18,"7":26479.09,"8":4848.86,"9":13452.72},"Electronics Sales":{"0":23312.79,"1":38738.19,"2":53601.54,"3":42062.01,"4":42276.04,"5":69192.41,"6":48065.41,"7":47851.76,"8":64556.77,"9":43525.38},"Home Sales":{"0":10991.36,"1":17000.27,"2":26926.41,"3":25817.93,"4":26700.62,"5":45898.82,"6":24049.25,"7":27550.8,"8":38468.88,"9":21181.46},"Clothes Sales":{"0":28089.66,"1":52073.81,"2":58401.37,"3":50028.65,"4":63996.07,"5":95964.42,"6":94098.8,"7":74569.68,"8":71728.8,"9":78333.69}}`);



    const [file, setFile] = useState(null)
    const [startChart, setStartChart] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currentTab, setCurrentTab] = useState(0);
    const [quesLoading, setQuesLoading] = useState(false)
    const [imageSrc, setImageSrc] = useState(null)
    const [allQuestions, setAllQuestions] = useState({
        textQuestions: [],
        graphQuestions: []
    })
    // const [img, setImage] = useState(null)
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
    };

    const handleUpload = async (data) => {
        var formData = new FormData();
        formData.append('file', file);
        setLoading(true)
        setStartChart(true)
        try {
            await axios.post(`${akkiourl}/upload`, formData)
                .then((response) => {
                    setLoading(false)
                    setResponse(response)
                    // const columnDescriptions = response?.data?.col_desc;
                    // const sampleData = response?.data["sample data"]
                    setColumnDesc(response?.data?.column_description)
                    setSampleData(response?.data?.first_10_rows)
                    const textQuestions = response?.data?.text_questions
                        .split('\n')
                        .filter(desc => desc.trim() !== '')
                    // Remove the first item

                    const graphQuestions = response?.data?.plotting_questions
                        .split('\n')
                        .filter(desc => desc.trim() !== '')
                    // Remove the first item
                    setAllQuestions({
                        textQuestions,
                        graphQuestions
                    })
                    setQuestions(textQuestions)
                });
        } catch (err) {
            setLoading(false)
            console.log(err)
        }
    }
    const regenerateQuestions = () => {
        if (currentTab == 0) {
            regenerateTextQuestions()
        } else {
            regenerateGraphQuestions()
        }
    }
    const regenerateTextQuestions = async () => {
        try {
            var formData = new FormData();
            formData.append('tablename', 'retail sales data');
            await axios.post(`${akkiourl}/regenerate`,formData)
                .then((response) => {
                    const questions = response?.data?.questions.split('\n')
                        .filter(desc => desc.trim() !== '')
                        ;
                    setAllQuestions({
                        ...allQuestions,
                        textQuestions: questions,
                    })
                    setQuestions(questions)
                });
        } catch (err) {
            console.log(err)
        }
    }

    const regenerateGraphQuestions = async () => {
        try {
            var formData = new FormData();
            formData.append('tablename', 'retail sales data');
            await axios.post(`${akkiourl}/regenerate_chart`,formData)
                .then((response) => {
                    const questions = response?.data?.questions.split('\n')
                        .filter(desc => desc.trim() !== '')
                        .slice(1);;
                    setAllQuestions({
                        ...allQuestions,
                        graphQuestions: questions
                    })
                    setQuestions(questions)
                });
        } catch (err) {
            console.log(err)
        }
    }

    const handleGetAnswer = async (question, data) => {
        var formData = new FormData();
        formData.append('query', question);
        formData.append('tablename', 'retail sales data');

        try {
            const res = await axios.post(
                `${akkiourl}/${currentTab === 1 ? 'getResult' : 'genresponse'}`,
                formData,
                { responseType:currentTab === 1 ? 'blob':'' }
            );
            const imageUrl =currentTab === 1 ? URL.createObjectURL(res.data) :'';
            const ans = data.map((item) => {
                if (item.question == question) {
                    return {
                        ...item,
                        view: currentTab === 1 ? "Graph" : "Text",
                        answer: currentTab === 1 ? imageUrl : res?.data?.answer,
                        loading: false
                    }
                } else return item;
            })
            setAnswers(ans)
        } catch (err) {
            const ans = data.map((item) => {
                if (item.question == question) {
                    return {
                        ...item,
                        answer: "No Data found",
                        loading: false
                    }
                } else return item;
            })
            setAnswers(ans)
        }
    }

    // const columnDescriptions = response?.data?.col_desc;
    // const sampleData = response?.data["sample data"]

    const handleQuestionClick = async (question) => {
        const data = [...answers, { question, answer: "", loading: true }]
        setAnswers(data);
        handleGetAnswer(question, data)
    };

    const handleTabChange = (event, newValue) => {
        setQuestions(newValue == 0 ? allQuestions?.textQuestions : allQuestions?.graphQuestions)
        setCurrentTab(newValue);
    };

    return (
        <Grid display={"flex"}>
            <Grid item md={10} padding={"10px"} sx={{
                width: "100%"
            }}>
                <Grid sx={{
                    background: '#FFF',
                    width: "100%"
                }}>
                    {imageSrc && <img src={imageSrc} alt="Generated Image" style={{ width: '100%', height: 'auto' }} />}

                    <Grid sx={{
                        padding: '20px 10px 10px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px',
                        // height: 'calc(100vh - 150px)',
                        overflow: 'auto',
                        width: "100%"
                    }}>
                        <div>
                            <FileUpload handleFileChange={handleFileChange} handleUpload={handleUpload} />
                            {/* {!startChart && <p style={{ fontSize: '14px', fontStyle: 'italic', margin: '0px' }}>To get insights from your own data, please upload your csv file.</p>
                            } */}
                        </div>
                        {startChart && <div>
                            {!loading ? <div>
                                <h2 style={{ fontSize: '30px' }}>Data Explanation</h2>
                                <p>The topic below gives the general feel of the dataset,click on expander ro see more.</p>

                                <Accordion title="See Data Explanation">
                                    <ColumnDescriptions descriptions={columnDescriptions} />
                                </Accordion>
                                <Accordion title="See Raw Data">
                                    <SampleDataTable data={sampleData} />
                                </Accordion>
                                <Tabs
                                    value={currentTab}
                                    onChange={handleTabChange}
                                    sx={{
                                        marginTop: '20px',
                                        marginBottom: '20px',
                                        '& .MuiTabs-flexContainer': {
                                            display: 'flex',
                                            flexDirection: 'row',
                                        },
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            fontSize: '16px',
                                            fontWeight: '400',
                                            lineHeight: '24px',
                                            fontFamily: 'Poppins',
                                            // borderRadius: '24px',
                                            background: '#E6EDF5',
                                            color: '#242424',
                                            margin: '4px',
                                            padding: '4px 10px',
                                            ':hover': {
                                                background: '#E6EDF5'
                                            }
                                        },
                                        '& .Mui-selected': {
                                            backgroundColor: '#3F8CFF !important',
                                            color: '#fff !important',
                                            fontWeight: 700,
                                        },
                                        svg: {
                                            width: 16,
                                            height: 16,
                                        },
                                    }}
                                >
                                    <Tab label="Text View" />
                                    <Tab label="Graphical View" />
                                </Tabs>
                                <div className="explorationSection">
                                    <h2 style={{ fontSize: '30px' }}>Exploration</h2>
                                    <p>Below are the sample questions</p>
                                    <div className="sampleQuestions" style={{ display: 'flex', marginBottom: '20px', flexWrap: 'wrap' }}>
                                        {questions?.map((question, index) => (
                                            <SampleQuestion key={index} question={`${question}`} onClick={handleQuestionClick} />
                                        ))}
                                    </div>
                                    <button
                                        style={{
                                            background: '#f8f9fa',
                                            padding: '8px 12px',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            // fontWeight: 'bold',
                                            transition: 'background 0.3s ease',
                                            marginBottom: '20px',
                                            color: 'black'
                                        }}
                                        onClick={regenerateQuestions}
                                    >
                                        <IoMdRefresh color="blue" />  Re-generate sample questions
                                    </button>
                                    <p>Type In your question below:</p>
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0px' }}>
                                        <TextField
                                            onChange={(e) => setSearch(e.target.value)}
                                            variant="outlined"
                                            value={search}
                                            sx={{
                                                width: '500px',
                                                '& .MuiOutlinedInput-root:hover fieldset': {
                                                    borderColor: 'rgb(69, 69, 69)',
                                                },
                                                '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                                                    outline: 'none',
                                                    boxShadow: 'none',
                                                    border: search ? '1px solid rgb(48, 36, 139)' : '1px solid rgb(69, 69, 69)',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    paddingRight: '10px',
                                                    height: "45px"
                                                },
                                            }}
                                            placeholder="Type here to ask Gen AI............."
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IoMdSend size={24} style={{ color: search ? "rgb(91, 71, 245)" : 'rgb(142, 139, 157)', cursor: 'pointer' }} onClick={() => { handleQuestionClick(search); setSearch("") }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </div>
                                    <div className="answersSection" style={{ marginTop: "20px" }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <h2 style={{ fontSize: '30px' }}>Answers</h2>
                                            <button className="btn btn-primary" onClick={() => setAnswers([])}>Reset</button>
                                        </div>
                                        {answers?.map((item, index) => (
                                            <AnswersAccordion key={index} question={item.question} answer={item.answer} loading={item?.loading} type={item.view} />
                                        ))}
                                    </div>
                                </div>
                            </div> : <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                                <CircularProgress />
                            </div>}
                        </div>}
                    </Grid>

                </Grid>
            </Grid>
        </Grid >
    )
}

export default GenAi;
