import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Card, Button, TextField, Grid, InputAdornment } from '@mui/material';
import { IoMdRefresh, IoMdSend } from 'react-icons/io';
import './index.css'; // You'll need to create this file for styling
import { akkiourl } from '../../../../../utils/const';
import SampleQuestion from '../../../../genAi/components/questions';
import AnswersAccordion from '../../../../genAi/components/answers';

const ForecastData = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userPrompt, setUserPrompt] = useState('');
    const [responses, setResponses] = useState([]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${akkiourl}/regenerate_forecast_questions`);
            const questionsText = response.data.questions;
            const questionsList = questionsText.split('\n').slice(2); // Skip the first two lines
            setQuestions(questionsList.filter(question => !!question).slice(0, 5)); // Limit to 5 questions
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!userPrompt.trim()) return;
        
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('user_prompt', userPrompt);

            setResponses(prev => [...prev, {
                question: userPrompt,
                loading: true
            }]);

            const response = await axios.post(`${akkiourl}/forecasts`, formData);
            
            setResponses(prev => prev.map((item, index) => {
                if (index === prev.length - 1) {
                    return {
                        question: userPrompt,
                        content: response.data.content,
                        image: response.data.image_base64 ? `data:image/png;base64,${response.data.image_base64}` : null,
                        loading: false
                    };
                }
                return item;
            }));
            
            setUserPrompt('');
        } catch (error) {
            console.error('Error submitting forecast:', error);
            setResponses(prev => prev.map((item, index) => {
                if (index === prev.length - 1) {
                    return {
                        question: userPrompt,
                        content: 'Error occurred while fetching response.',
                        loading: false
                    };
                }
                return item;
            }));
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
            <div className="answersSection" style={{ marginTop: "20px" }}>
                {responses.map((response, index) => (
                    <AnswersAccordion
                        key={index}
                        question={response.question}
                        answer={response.image || response.content}
                        loading={response.loading}
                        type={response.image ? 'image' : 'Text'}
                        desc={response.content}
                        isHtml={true}
                    />
                ))}
            </div>
        </div>
    );
};

export default ForecastData;