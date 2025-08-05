// MiddleContent.js

import { Box, CircularProgress, Grid, IconButton } from "@mui/material"
import TextField from '@mui/material/TextField';
import { useEffect, useState } from "react";
import axios from "axios";
import '../../../../genAi/Main.css'
import { Tabs, Tab, InputAdornment } from '@mui/material';
import { IoMdClose, IoMdRefresh, IoMdSend } from 'react-icons/io';
import { akkiourl } from "../../../../../utils/const";
import AnswersChat2 from "./answers";
import { useLocation } from "react-router-dom";
import { utils } from 'xlsx';

const ChatDataPrep = ({ showModel, setShowModel, index=0, chartData=[], isReportMode=false }) => {
    const fileName = localStorage.getItem('filename')?.replace(/\.[^/.]+$/, '');
    const [search, setSearch] = useState('')
    const [answers, setAnswers] = useState([]);
    const [isChartMode, setIsChartMode] = useState(false);
    const location = useLocation();

    // Effect to handle index changes and call summary/description API
    useEffect(() => {
        if (isReportMode && index >= 0 && showModel) {
            setIsChartMode(true);
            // Reset existing state
            setAnswers([]);
            setSearch('');
            // Call description API automatically for reports
            if (chartData && chartData.length > 0 && index < chartData.length) {
                handleReportDescription();
            }
        } else if (index > 0 && showModel) {
            setIsChartMode(true);
            // Reset existing state
            setAnswers([]);
            setSearch('');
            // Call summary API automatically if we have chart data
            if (chartData && chartData.length > 0 && index <= chartData.length) {
                handleChartSummary();
            }
        } else {
            setIsChartMode(false);
        }
    }, [index, showModel, chartData, isReportMode]);

    const handleReportDescription = async () => {
        const descriptionQuestion = "description";
        const data = [{ question: descriptionQuestion, answer: "", loading: true }];
        setAnswers(data);
        
        // Check if we have valid report data
        if (!chartData || chartData.length === 0 || index < 0 || index >= chartData.length) {
            const ans = data.map((item) => {
                if (item.question === descriptionQuestion) {
                    return {
                        ...item,
                        answer: "No report data available for description",
                        loading: false
                    }
                } else return item;
            });
            setAnswers(ans);
            return;
        }
        
        try {
            // Get user email from localStorage
            const userEmail = JSON.parse(localStorage.getItem("user")).email;
            const reportId = chartData[index].id;
            
            const formData = new FormData();
            formData.append('email', userEmail);
            formData.append('id', reportId.toString());
            
            const res = await axios.post(
                `${akkiourl}/get_report_description`,
                formData
            );
            
            const ans = data.map((item) => {
                if (item.question === descriptionQuestion) {
                    return {
                        ...item,
                        view: "Text",
                        answer: res?.data?.summary || "No description available",
                        loading: false
                    }
                } else return item;
            });
            setAnswers(ans);
        } catch (err) {
            console.error('Error fetching report description:', err);
            const ans = data.map((item) => {
                if (item.question === descriptionQuestion) {
                    return {
                        ...item,
                        answer: "Failed to get report description",
                        loading: false
                    }
                } else return item;
            });
            setAnswers(ans);
        }
    };

    const analyzeChart = async (question, isSummary = false) => {
        const data = isSummary
            ? [{ question, answer: "", loading: true }]
            : [...answers, { question, answer: "", loading: true }];
        setAnswers(data);

        try {
            const formData = new FormData();
            formData.append('chart_id', index.toString());
            formData.append('question', question);
            
            const res = await axios.post(
                `${akkiourl}/analyze_chart`,
                formData
            );

            const ans = data.map((item) => {
                if (item.question === question) {
                    return {
                        ...item,
                        view: "Text",
                        answer: res?.data?.response || "No answer available",
                        loading: false
                    };
                }
                return item;
            });
            setAnswers(ans);
        } catch (err) {
            console.error(`Error analyzing chart for question: "${question}"`, err);
            const ans = data.map((item) => {
                if (item.question === question) {
                    return {
                        ...item,
                        answer: "Failed to get answer from chart analysis",
                        loading: false
                    };
                }
                return item;
            });
            setAnswers(ans);
        }
    };

    const handleChartSummary = async () => {
        const summaryQuestion = "summary";
        if (!chartData || chartData.length === 0 || index <= 0 || index > chartData.length) {
            setAnswers([{
                question: summaryQuestion,
                answer: "No chart data available for summary",
                loading: false
            }]);
            return;
        }
        analyzeChart(summaryQuestion, true);
    };

    const handleGetAnswer = async (question, data) => {
        var formData = new FormData();

        try {
            let res;
            
            if (isReportMode) {
                // Report question API
                const reportId = chartData[index]?.id;
                if (!reportId) {
                    throw new Error('Report ID not found');
                }
                
                formData.append('report_id', reportId.toString());
                formData.append('question', question);
                res = await axios.post(
                    `${akkiourl}/get_answer_report`,
                    formData
                );
            } else if (isChartMode) {
                // This is now handled by analyzeChart, but we call it from handleQuestionClick
                // to keep the flow consistent. The actual API call will be made there.
                // We are setting the state here to show the user's question immediately.
                setAnswers(data); 
                analyzeChart(question);
                return; // Return early as analyzeChart handles the rest
            } else if (location.pathname === '/data-source') {
                // Existing data source functionality
                formData.append('prompt', question);
                formData.append('data_type', 'Excel');
                res = await axios.post(
                    `${akkiourl}/data_scout`,
                    formData
                );
            } else {
                // Existing gen_txt_response functionality
                formData.append('query', question);
                formData.append('tablename', fileName);
                res = await axios.post(
                    `${akkiourl}/gen_txt_response`,
                    formData
                );
            }
            
            const handleDownload = (data) => {
                if (typeof data === 'string') {
                    // Handle existing file path case
                    const link = document.createElement('a');
                    link.href = data;
                    link.download = data.split('/').pop();
                    link.click();
                } else if (data && typeof data === 'object') {
                    // Transform the columnar data into row-based format
                    const rowData = data[Object.keys(data)[0]].map((_, index) => {
                        const row = {};
                        Object.keys(data).forEach(key => {
                            row[key] = data[key][index];
                        });
                        return row;
                    });
                    
                    // Create worksheet using the transformed data
                    const worksheet = utils.json_to_sheet(rowData);
                    
                    // Create a download link for the Excel file
                    const excelBuffer = utils.sheet_to_csv(worksheet);
                    const blob = new Blob([excelBuffer], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'data_export.csv';
                    link.click();
                    window.URL.revokeObjectURL(url);
                }
            }
            
            // Handle download for non-chart mode and non-report mode
            if (!isChartMode && !isReportMode && res?.data.file_path?.[1]) {
                handleDownload(res?.data.file_path?.[1]);
            }
            
            console.log(res, 'API Response');
            const ans = data.map((item) => {
                if (item.question === question) {
                    let answer;
                    if (isReportMode || isChartMode) {
                        answer = res?.data?.answer || "No answer available";
                    } else {
                        answer = res?.data?.answer || (res?.data.file_path?.[1] ? "Data Downloaded Successfully" : "No Data found");
                    }
                    
                    return {
                        ...item,
                        view: "Text",
                        answer: answer,
                        data: (isReportMode || isChartMode) ? null : res.data?.file_path?.[1],
                        loading: false
                    }
                } else return item;
            });
            setAnswers(ans);
        } catch (err) {
            console.error('Error in handleGetAnswer:', err);
            const ans = data.map((item) => {
                if (item.question === question) {
                    return {
                        ...item,
                        answer: "No Data found",
                        loading: false
                    }
                } else return item;
            });
            setAnswers(ans);
        }
    }

    const handleQuestionClick = async (question) => {
        const data = [...answers, { question, answer: "", loading: true }]
        if (isChartMode) {
             analyzeChart(question);
        } else {
            setAnswers(data);
            handleGetAnswer(question, data);
        }
    };

    const handleSendMessage = () => {
        if (search.trim()) {
            handleQuestionClick(search);
            setSearch("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getHeaderTitle = () => {
        if (isReportMode && chartData && chartData.length > 0 && index >= 0 && index < chartData.length) {
            return `Report ${index + 1}`;
        } else if (chartData && chartData.length > 0 && index > 0 && chartData[index-1]) {
            return chartData[index-1].chart_data?.layout?.title?.text || `Chart ${index}`;
        } else if (isChartMode) {
            return `Chart ${index}`;
        } else {
            return 'Data Chat';
        }
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
              <span style={{ fontWeight: 600 }}>
                {getHeaderTitle()}
              </span>
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
              onKeyPress={handleKeyPress}
              placeholder={isReportMode ? "Ask a question about the report..." : isChartMode ? "Ask a question about the chart..." : "Type your message here..."}
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
                      onClick={handleSendMessage}
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
