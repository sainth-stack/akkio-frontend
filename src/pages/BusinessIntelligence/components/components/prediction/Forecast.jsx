import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Card, Button, TextField, Grid, InputAdornment } from '@mui/material';
import { FaFileUpload } from 'react-icons/fa';
import { IoMdRefresh, IoMdSend } from 'react-icons/io';
import './index.css'; // You'll need to create this file for styling
import { akkiourl } from '../../../../../utils/const';
import SampleQuestion from '../../../../genAi/components/questions';
import AnswersAccordion from '../../../../genAi/components/answers';

const ForecastData = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [response, setResponse] = useState(null);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${akkiourl}/regenerate_forecast_questions`);
            const questionsText = response.data.questions;
            const questionsList = questionsText.split('\n').slice(2); // Skip the first two lines
            setQuestions(questionsList.filter(question => !!question));
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            if (file) formData.append('file', file);
            formData.append('user_prompt', userPrompt);

            const response = await axios.post(`${akkiourl}/forecasts`, formData);
            setResponse({
                content: response.data.content,
                image: response.data.image_base64
            });
        } catch (error) {
            console.error('Error submitting forecast:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    return (
        <div className="explorationSection">
            <h2 style={{ fontSize: '30px' }}>Forecast</h2>

            {/* File Upload Section */}
            <div style={{ marginBottom: '20px' }}>
                <Button
                    component="label"
                    startIcon={<FaFileUpload />}
                    sx={{
                        background: '#f8f9fa',
                        padding: '8px 12px',
                        borderRadius: '5px',
                        color: 'black'
                    }}
                >
                    Upload File
                    <input
                        type="file"
                        hidden
                        onChange={(e) => setFile(e.target.files[0])}
                        accept=".csv,.xlsx,.xls"
                    />
                </Button>
                {file && <p className="file-info">Selected file: {file.name}</p>}
            </div>

            {/* Questions Section */}
            <div className="sampleQuestions" style={{ display: 'flex', marginBottom: '20px', flexWrap: 'wrap' }}>
                {questions.map((question, index) => (
                    <SampleQuestion
                        key={index}
                        question={question.replace('**', '')}
                        onClick={() => setUserPrompt(question.replace('**', ''))}
                    />
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
                    transition: 'background 0.3s ease',
                    marginBottom: '20px',
                    color: 'black'
                }}
                onClick={fetchQuestions}
            >
                <IoMdRefresh color="blue" /> Re-generate sample questions
            </button>

            {/* Input Section */}
            <p>Type in your question below:</p>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0px' }}>
                <TextField
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    variant="outlined"
                    sx={{
                        width: '500px',
                        '& .MuiOutlinedInput-root': {
                            height: "45px"
                        },
                    }}
                    placeholder="Type here to ask about forecasts............."
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IoMdSend
                                    size={24}
                                    style={{
                                        color: userPrompt ? "rgb(91, 71, 245)" : 'rgb(142, 139, 157)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={handleSubmit}
                                />
                            </InputAdornment>
                        ),
                    }}
                />
            </div>

            {/* Response Section */}
            {response && (
                <div className="answersSection" style={{ marginTop: "20px" }}>
                    <AnswersAccordion
                        question={userPrompt}
                        answer={response.image ? response.image : response.content}
                        loading={loading}
                        type={response.image ? 'image' : 'Text'}
                        desc={response.content}
                        isHtml={true}
                    />
                </div>
            )}
        </div>
    );
};

export default ForecastData;