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
import AnswersChat2 from "./answers";
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
            top: "69%",
            right: "1rem",
            transform: "translateY(-50%)",
            width: "550px",
            height: "60vh",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            zIndex: 1300,
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Header */}
          <Box sx={{
            padding: "16px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span style={{ fontWeight: 600 }}>Chat Data Prep</span>
            </Box>
            <IconButton
              onClick={() => setShowModel(false)}
              sx={{ color: "#666" }}
            >
              <IoMdClose size={20} />
            </IconButton>
          </Box>

          {/* Chat Messages Area */}
          <Box sx={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            {answers?.map((item, index) => (
              <div key={index} style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                {/* User Message */}
                <Box sx={{
                  alignSelf: "flex-end",
                  maxWidth: "80%",
                  backgroundColor: "#f0f0f0",
                  padding: "12px",
                  borderRadius: "12px 12px 0 12px",
                }}>
                  {item.question}
                </Box>

                {/* AI Response */}
                <Box sx={{
                  alignSelf: "flex-start",
                  maxWidth: "80%",
                  backgroundColor: "#fff",
                  padding: "12px",
                  borderRadius: "12px 12px 12px 0",
                  // border: "1px solid #e0e0e0",
                }}>
                  <AnswersChat2
                    question={item.question}
                    answer={item.answer}
                    loading={item?.loading}
                    type={item.view}
                    name={"genbi"}
                  />
                </Box>
              </div>
            ))}
          </Box>

          {/* Input Area */}
          <Box sx={{
            padding: "16px",
            borderTop: "1px solid #e0e0e0",
            backgroundColor: "#fff"
          }}>
            <TextField
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type your message here..."
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "24px",
                  backgroundColor: "#f5f5f5",
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => {
                        if (search.trim()) {
                          handleQuestionClick(search);
                          setSearch("");
                        }
                      }}
                      sx={{
                        color: search ? "primary.main" : "#bbb"
                      }}
                    >
                      <IoMdSend />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      )
    );
}

export default ChatDataPrep;
