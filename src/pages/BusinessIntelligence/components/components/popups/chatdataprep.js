// MiddleContent.js

import { CircularProgress, Grid } from "@mui/material"
import TextField from '@mui/material/TextField';
import { useEffect, useState } from "react";
import axios from "axios";
import '../../../../genAi/Main.css'
import AnswersAccordion from "../../../../genAi/components/answers";
import { Tabs, Tab, InputAdornment } from '@mui/material';
import { IoMdRefresh, IoMdSend } from 'react-icons/io';
import { Modal } from "antd";
import { akkiourl } from "../../../../../utils/const";
const ChatDataPrep = ({ showModel, setShowModel }) => {
    const fileName = localStorage.getItem('filename')?.replace(/\.[^/.]+$/, '');
    const [search, setSearch] = useState('')
    const [answers, setAnswers] = useState([]);

    const handleGetAnswer = async (question, data) => {
        var formData = new FormData();
        formData.append('query', question);
        formData.append('tablename', fileName);

        try {
            const res = await axios.post(
                `${akkiourl}/gen_txt_response`,
                formData
            );
            const ans = data.map((item) => {
                if (item.question == question) {
                    return {
                        ...item,
                        view: "Text",
                        answer: res?.data?.answer,
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

    return (
        <Modal
            title=""
            open={showModel}
            style={{ top: '0%', zIndex: 99999, width: '80vh', height: '100vh', overflow: 'auto' }}
            onCancel={() => setShowModel(false)}
            width={'110vh'}
            footer={null}
        >
            <Grid item md={10} padding={"10px"} sx={{ width: "100%" }}>
                <Grid sx={{ background: '#FFF', width: "100%" }}>
                    <Grid sx={{
                        padding: '20px 10px 10px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px',
                        overflow: 'auto',
                        width: "100%"
                    }}>
                        <div>
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
                                    <AnswersAccordion key={index} question={item.question} answer={item.answer} loading={item?.loading} type={item.view} name={"genbi"} />
                                ))}
                            </div>
                        </div>
                    </Grid>
                </Grid>
            </Grid>
        </Modal>
    )
}

export default ChatDataPrep;
