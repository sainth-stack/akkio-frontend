// MiddleContent.js

import { CircularProgress, Grid } from "@mui/material"
import TextField from '@mui/material/TextField';
import { useEffect, useState } from "react";
import axios from "axios";
import '../../../../genAi/Main.css'
import SampleQuestion from "../../../../genAi/components/questions";
import AnswersAccordion from "../../../../genAi/components/answers";
import { Tabs, Tab, InputAdornment } from '@mui/material';
import { IoMdRefresh, IoMdSend } from 'react-icons/io';
import { Modal } from "antd";
import { akkiourl } from "../../../../../utils/const";
const ChatDataPrep = ({ showModel, setShowModel }) => {
    const fileName = localStorage.getItem('filename')?.replace(/\.[^/.]+$/, '');
    const [search, setSearch] = useState('')
    const [response, setResponse] = useState()
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [startChart, setStartChart] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currentTab, setCurrentTab] = useState(0);
    const [allQuestions, setAllQuestions] = useState({
        textQuestions: [],
        graphQuestions: []
    })


    const arrayToCSV = (data) => {
        const csvRows = [];

        // Get the headers (keys of the first object)
        const headers = Object.keys(data[0]);
        csvRows.push(headers.join(','));

        // Loop through the data and convert each object to a CSV row
        for (const row of data) {
            const values = headers.map(header => row[header]);
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    };

    const handleUpload = async (data, fileC) => {
        var formData = new FormData();
        setLoading(true);
        setStartChart(true);
        console.log(data)
        // Convert array to CSV blob if data exists
        if (data) {
            const csvData = arrayToCSV(data);  // Convert data to CSV
            const file = new Blob([csvData], { type: 'text/csv' });  // Create CSV Blob
            formData.append('file', file, 'data.csv');  // Append CSV file to formData
        } else {
            formData.append('file', fileC);  // Append CSV file to formData
        }

        try {
            await axios.post(`${akkiourl}/upload`, formData)
                .then((response) => {
                    setLoading(false);
                    setResponse(response);
                    const textQuestions = response?.data?.text_questions
                        .split('\n')
                        .filter(desc => desc.trim() !== '');

                    const graphQuestions = response?.data?.plotting_questions
                        .split('\n')
                        .filter(desc => desc.trim() !== '');

                    setAllQuestions({
                        textQuestions,
                        graphQuestions
                    });
                    setQuestions(textQuestions);
                });
        } catch (err) {
            setLoading(false);
            console.log(err);
        }
    };

    useEffect(() => {
        // Check for data in localStorage
        const storedData = localStorage.getItem('prepData');

        if (storedData && showModel) {
            // Parse the stored data and send it to the API
            const parsedData = JSON.parse(storedData);
            handleUpload(parsedData);
        }
    }, [showModel]);

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
            formData.append('tablename', fileName);
            await axios.post(`${akkiourl}/regenerate`, formData)
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
            formData.append('tablename', fileName);
            await axios.post(`${akkiourl}/regenerate_chart`, formData)
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
        formData.append('tablename', fileName);

        try {
            const res = await axios.post(
                `${akkiourl}/${currentTab === 1 ? 'getResult2' : 'genresponse2'}`,
                formData,
                { responseType: currentTab === 1 ? 'blob' : '' }
            );
            const imageUrl = currentTab === 1 ? URL.createObjectURL(res.data) : '';
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
        <Modal
            title=""
            open={showModel}
            style={{ top: '0%', zIndex: 99999, width: '80vh', height: '100vh', overflow: 'auto' }}
            onCancel={() => setShowModel(false)}
            width={'110vh'}
            footer={null}
        >
            <Grid item md={10} padding={"10px"} sx={{
                width: "100%"
            }}>
                <Grid sx={{
                    background: '#FFF',
                    width: "100%"
                }}>
                    <Grid sx={{
                        padding: '20px 10px 10px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px',
                        overflow: 'auto',
                        width: "100%"
                    }}>
                        {startChart && <div>
                            {!loading ? <div>
                                <h2 style={{ fontSize: '30px' }}>Data Exploration</h2>
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
                                            <AnswersAccordion key={index} question={item.question} answer={item.answer} loading={item?.loading} type={item.view} name={"genbi"}/>
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
        </Modal>
    )
}

export default ChatDataPrep;
