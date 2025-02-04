// MiddleContent.js

import { Box, CircularProgress, Grid, IconButton } from "@mui/material"
import TextField from '@mui/material/TextField';
import { useEffect, useState } from "react";
import axios from "axios";
import '../../../../genAi/Main.css'
import AnswersAccordion from "../../../../genAi/components/answers";
import { Tabs, Tab, InputAdornment } from '@mui/material';
import { IoMdClose, IoMdRefresh, IoMdSend } from 'react-icons/io';
import { Modal } from "antd";
import { akkiourl } from "../../../../../utils/const";
import AnswersChat from "../../../../genAi/components/answers";
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
      showModel && (
        <Box
          title=""
          sx={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            maxWidth: "35vw",
            maxHeight: "80vh",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            overflow: "scroll",
            zIndex: 1300,
          }}
          onCancel={() => setShowModel(false)}
          width={"110vh"}
          footer={null}
        >
          <IconButton
            onClick={() => setShowModel(false)}
            sx={{
              position: "absolute",
              top: "10px",
              right: "10px",
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              borderRadius: "50%",
              padding: "5px",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              },
            }}
          >
            <IoMdClose size={24} />
          </IconButton>
          <Grid item md={10} padding={"10px"} sx={{ width: "100%" }}>
            <Grid sx={{ background: "#FFF", width: "100%" }}>
              <Grid
                sx={{
                  padding: "20px 10px 10px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "30px",
                  overflow: "auto",
                  width: "100%",
                }}
              >
                <div>
                  <p>How may Help you:</p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      marginTop: "0px",
                    }}
                  >
                    <TextField
                      onChange={(e) => setSearch(e.target.value)}
                      variant="outlined"
                      value={search}
                      sx={{
                        width: "500px",
                        "& .MuiOutlinedInput-root:hover fieldset": {
                          borderColor: "rgb(69, 69, 69)",
                        },
                        "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                          outline: "none",
                          boxShadow: "none",
                          border: search
                            ? "1px solid rgb(48, 36, 139)"
                            : "1px solid rgb(69, 69, 69)",
                        },
                        "& .MuiOutlinedInput-root": {
                          paddingRight: "10px",
                          height: "45px",
                        },
                      }}
                      placeholder="Type here to ask Gen AI............."
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IoMdSend
                              size={24}
                              style={{
                                color: search
                                  ? "rgb(91, 71, 245)"
                                  : "rgb(142, 139, 157)",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                handleQuestionClick(search);
                                setSearch("");
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </div>
                  <div className="answersSection" style={{ marginTop: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <h2 style={{ fontSize: "30px" }}>Answers</h2>
                      <button
                        className="btn btn-primary"
                        onClick={() => setAnswers([])}
                      >
                        Reset
                      </button>
                    </div>
                    {answers?.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: ".5rem",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "60%",
                            marginRight: "20px",
                            backgroundColor: "#f1f1f1",
                            borderRadius: "8px",
                            padding: ".2rem",
                          }}
                        >
                          <AnswersChat
                            question={item.question}
                            answer={item.answer}
                            loading={item?.loading}
                            type={item.view}
                            name={"genbi"}
                          />
                        </div>
                        <div
                          style={{
                            maxWidth: "30%",
                            backgroundColor: "#e6e6e6",
                            borderRadius: "8px",
                            padding: ".15rem",
                          }}
                        >
                          <div
                            style={{
                              textAlign: "right",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.3rem",
                              padding: "0.2rem",
                              backgroundColor: "#f9f9f9",
                              border: "1px solid #e0e0e0",
                              borderRadius: "12px",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            }}
                          >
                            {item.question}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      )
    );
}

export default ChatDataPrep;
