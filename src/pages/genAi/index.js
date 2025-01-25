// MiddleContent.js

import { CircularProgress, Grid } from "@mui/material";
import TextField from "@mui/material/TextField";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Main.css";
import ColumnDescriptions from "./components/columnDesc";
import SampleDataTable from "./components/sampleData";
import Accordion from "./components/accordian";
import SampleQuestion from "./components/questions";
import AnswersAccordion from "./components/answers";
import { Tabs, Tab, InputAdornment } from "@mui/material";
import { IoMdRefresh, IoMdSend } from "react-icons/io";
import { akkiourl } from "../../utils/const";
import { useDataAPI } from "../BusinessIntelligence/components/contexts/GetDataApi";
const GenAi = () => {
  const { sap } = useDataAPI();
  const [search, setSearch] = useState("");
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState([
    "What is the minimum gross_income of the data?",
    "What is the mean quantity of the data?",
    "What is the 50th percentile of unit price of the data?",
    "What is the 25th percentile of gross_income of the data?",
    "What is the 25th percentile of tax_5_percentage of the data?",
  ]);
  const [answers, setAnswers] = useState([]);

  const [columnDescriptions, setColumnDesc] =
    useState(`a description of the columns in the provided data:
  
  1. Store ID: This column contains numerical values representing the unique identification number of the store where the sales data was recorded. Each row corresponds to a different store.
  2. Employee Number: This column includes numerical values that represent the unique identification number of the employee associated with the sales data recorded in each row.
  3. Date: This column likely includes date values indicating when the sales data was recorded.
  4. Net Sales: This column contains numerical values representing the total sales amount after deducting any returns or discounts. It may include sales from both in-store and online transactions.
  5. Taxes: This column likely includes numerical values representing the amount of taxes applied to the sales recorded in each row.
  6. Taxable Sales: This column contains numerical values representing the portion of sales that are subject to taxation.
  7. Home Sales: This column includes numerical values representing the sales amount specifically related to home products or categories.
  8. Clothes Sales: This column contains numerical values representing the sales amount specifically related to clothing products or categories.
  
  These descriptions provide an overview of the data columns and the type of information they contain`);

  const [sampleData, setSampleData] = useState(`{}`);
  const [startChart, setStartChart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [imageSrc, setImageSrc] = useState(null);
  const [allQuestions, setAllQuestions] = useState({
    textQuestions: [],
    graphQuestions: [],
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const arrayToCSV = (data) => {
    const headers = Object.keys(data);
    const rowCount = Object.keys(data[headers[0]]).length;
    const csvRows = [headers.join(",")];
    for (let i = 0; i < rowCount; i++) {
      const row = headers.map((header) => {
        const value = data[header][i.toString()];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      });
      csvRows.push(row.join(","));
    }

    return csvRows.join("\n");
  };

  const handleUpload = useCallback(async (data, fileC) => {
    var formData = new FormData();
    if (data) {
      let csvData = null;
      csvData = arrayToCSV(data);
      console.log(csvData);
      const file = new Blob([csvData], { type: "text/csv" });
      formData.append("file", file, "data.csv");
      formData.append("mail", JSON.parse(localStorage.getItem("user"))?.email);
    } else {
      formData.append("file", fileC);
    }
    setLoading(true);
    setStartChart(true);

    try {
      const response = await axios.post(`${akkiourl}/upload`, formData);
      const sanitizedData = JSON.stringify(response.data).replace(
        /NaN/g,
        "null"
      );
      const parsedData = sap
        ? JSON.parse(JSON.parse(sanitizedData))
        : JSON.parse(sanitizedData);
      setLoading(false);
      setColumnDesc(parsedData?.column_description || "");
      setSampleData(parsedData?.first_10_rows || "{}");

      let textQuestions = Object.values(parsedData?.text_questions || {}) || [];

      const graphQuestions =
        Object.values(parsedData?.plotting_questions || {}) || [];
      setAllQuestions({
        textQuestions,
        graphQuestions,
      });
      setQuestions(textQuestions);
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  }, []);

  useEffect(() => {
    if (isInitialLoad) {
      const storedData = localStorage.getItem("prepData");
      const name = localStorage.getItem("filename");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setFileName(name);
        handleUpload(parsedData);
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, handleUpload]);

  const regenerateQuestions = () => {
    if (currentTab == 0) {
      regenerateTextQuestions();
    } else {
      regenerateGraphQuestions();
    }
  };
  const regenerateTextQuestions = async () => {
    try {
      var formData = new FormData();
      formData.append("tablename", fileName);
      await axios
        .post(`${akkiourl}/regenerate_txt_questions`, formData)
        .then((response) => {
          const questions =
            Object.values(response?.data?.questions || {}) || [];

          setAllQuestions({
            ...allQuestions,
            textQuestions: questions,
          });
          setQuestions(questions);
        });
    } catch (err) {
      console.log(err);
    }
  };

  const regenerateGraphQuestions = async () => {
    try {
      var formData = new FormData();
      formData.append("tablename", fileName);
      await axios
        .post(`${akkiourl}/regenerate_graph_questions`, formData)
        .then((response) => {
          const graphQuestions =
            Object.values(response?.data?.questions || {}) || [];

          setAllQuestions({
            ...allQuestions,
            graphQuestions: graphQuestions,
          });
          setQuestions(graphQuestions);
        });
    } catch (err) {
      console.log(err);
    }
  };

  const handleGetAnswer = async (question, data) => {
    var formData = new FormData();
    formData.append("query", question);
    formData.append("tablename", fileName);

    try {
      const res = await axios.post(
        `${akkiourl}/${
          currentTab === 1 ? "gen_graph_response" : "gen_txt_response"
        }`,
        formData
      );
      let res2 = "";
      if (currentTab === 1) {
        const res1 = await axios.post(`${akkiourl}/get_description`);
        res2 = res1?.data?.description;
      }
      const imageUrl = currentTab === 1 ? res.data : "";
      const ans = data.map((item) => {
        if (item.question == question) {
          return {
            ...item,
            view: currentTab === 1 ? "Graph" : "Text",
            answer: currentTab === 1 ? imageUrl : res?.data?.answer,
            loading: false,
            desc: res2,
          };
        } else return item;
      });
      setAnswers(ans);
    } catch (err) {
      const ans = data.map((item) => {
        if (item.question == question) {
          return {
            ...item,
            answer: "No Data found",
            loading: false,
          };
        } else return item;
      });
      setAnswers(ans);
    }
  };

  const handleQuestionClick = async (question) => {
    const data = [...answers, { question, answer: "", loading: true }];
    setAnswers(data);
    handleGetAnswer(question, data);
  };

  const handleTabChange = (event, newValue) => {
    setQuestions(
      newValue == 0 ? allQuestions?.textQuestions : allQuestions?.graphQuestions
    );
    setCurrentTab(newValue);
  };

  return (
    <Grid display={"flex"}>
      <Grid
        item
        md={10}
        padding={"10px"}
        sx={{
          width: "100%",
        }}
      >
        <Grid
          sx={{
            background: "#FFF",
            width: "100%",
          }}
        >
          {imageSrc && (
            <img
              src={imageSrc}
              alt="Generated Image"
              style={{ width: "100%", height: "auto" }}
            />
          )}

          <Grid
            sx={{
              padding: "20px 10px 10px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "30px",
              // height: 'calc(100vh - 150px)',
              overflow: "auto",
              width: "100%",
            }}
          >
            <div>
              {/* <FileUpload handleFileChange={handleFileChange} handleUpload={handleFileUpload} fileName={fileName} /> */}
              {/* {!startChart && <p style={{ fontSize: '14px', fontStyle: 'italic', margin: '0px' }}>To get insights from your own data, please upload your csv file.</p>
                            } */}
            </div>
            {startChart && (
              <div>
                {!loading ? (
                  <div>
                    <h2 style={{ fontSize: "30px" }}>Data Explanation</h2>
                    <p>
                      The topic below gives the general feel of the
                      dataset,click on expander ro see more.
                    </p>

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
                        marginTop: "20px",
                        marginBottom: "20px",
                        "& .MuiTabs-flexContainer": {
                          display: "flex",
                          flexDirection: "row",
                        },
                        "& .MuiTab-root": {
                          textTransform: "none",
                          fontSize: "16px",
                          fontWeight: "400",
                          lineHeight: "24px",
                          fontFamily: "Poppins",
                          // borderRadius: '24px',
                          background: "#E6EDF5",
                          color: "#242424",
                          margin: "4px",
                          padding: "4px 10px",
                          ":hover": {
                            background: "#E6EDF5",
                          },
                        },
                        "& .Mui-selected": {
                          backgroundColor: "#3F8CFF !important",
                          color: "#fff !important",
                          fontWeight: 700,
                        },
                        svg: {
                          width: 16,
                          height: 16,
                        },
                      }}
                    >
                      <Tab label="Insights" />
                      <Tab label="Visualisation" />
                    </Tabs>
                    <div className="explorationSection2">
                      <h2 style={{ fontSize: "30px" }}>Exploration</h2>
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
                      <button
                        style={{
                          background: "#f8f9fa",
                          padding: "8px 12px",
                          border: "none",
                          marginTop: "18px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "16px",
                          // fontWeight: 'bold',
                          transition: "background 0.3s ease",
                          marginBottom: "20px",
                          color: "black",
                        }}
                        onClick={regenerateQuestions}
                      >
                        <IoMdRefresh color="blue" /> Re-generate sample
                        questions
                      </button>
                      <div
                        className="sampleQuestions"
                        style={{ marginBottom: "20px" }}
                      >
                        {questions?.map((question, index) => (
                          <div className="question-item">
                            <SampleQuestion
                              key={index}
                              question={`${question}`}
                              onClick={handleQuestionClick}
                            />
                          </div>
                        ))}
                      </div>
                      <div
                        className="answersSection"
                        style={{ marginTop: "20px" }}
                      >
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
                          <AnswersAccordion
                            key={index}
                            desc={item.desc}
                            question={item.question}
                            answer={item.answer}
                            loading={item?.loading}
                            type={item.view}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress />
                  </div>
                )}
              </div>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default GenAi;
