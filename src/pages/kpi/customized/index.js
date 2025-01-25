// src/pages/kpi/customized/index.js
import { useState } from "react";
import {
  Card,
  Input,
  Button,
  Row,
  Col,
  message,
  Spin,
  Typography,
  Collapse,
} from "antd";
import { akkiourl } from "../../../utils/const";
import { LoadingOutlined } from "@ant-design/icons";
import "./index.css";
import Plot from "react-plotly.js";
const { Title, Text } = Typography;

const CustomizedKPIs = () => {
  const [prompt, setPrompt] = useState("");
  const [kpis, setKpis] = useState([]);
  const [selectedKpiImage, setSelectedKpiImage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [selectedKpiNames, setSelectedKpiNames] = useState([]);

  const generateKPIImage = async (kpiName) => {
    try {
      console.log(selectedKpiNames);
      console.log(selectedKpiImage);
      setLoadingImage(true);
      setSelectedKpiNames((prev) => [...prev, kpiName]);
      let data1 = [
        ...selectedKpiImage,
        { name: kpiName, image: "", code: "", loading: true },
      ];
      setSelectedKpiImage(data1);
      const response = await fetch(`${akkiourl}/generate_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `kpi_names=${encodeURIComponent(kpiName)}`,
      });

      const data = await response.json();

      if (data.status === "success") {
        if (data?.charts_data?.length > 0) {
          const finalData = data1.map((item) => {
            if (item.name == kpiName) {
              return {
                ...item,
                loading: false,
                name: kpiName,
                image: data.charts_data[0],
                code: data.code,
              };
            } else {
              return item;
            }
          });
          setSelectedKpiImage(finalData);
        } else if (data?.charts_data?.length === 0) {
          const finalData = data1.map((item) => {
            if (item.name == kpiName) {
              return {
                ...item,
                loading: false,
                name: kpiName,
                image: null,
                code: data.code,
              };
            } else {
              return item;
            }
          });
          setSelectedKpiImage(finalData);
        } else {
          message.error("No visualization data received");
        }
      } else {
        message.error("Failed to generate KPI visualization");
      }
    } catch (error) {
      console.error("Error generating KPI visualization:", error);
      message.error("Error generating visualization");
    } finally {
      setLoadingImage(false);
    }
  };
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      message.warning("Please enter a KPI query");
      return;
    }
    setLoading(true);
    setSelectedKpiImage([]); // Clear previous image
    setSelectedKpiNames([]); // Clear selected KPI names
    try {
      const response = await fetch(`${akkiourl}/kpi_process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `prompt=${encodeURIComponent(prompt)}`,
      });

      const data = await response.json();

      if (data.status === "success") {
        setKpis(Object.values(data.kpis));
      } else {
        message.error("Failed to fetch KPIs");
      }
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      message.error("Error fetching KPIs");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (kpiName) => {
    if (selectedKpiNames.includes(kpiName)) {
      setSelectedKpiNames(selectedKpiNames.filter((name) => name !== kpiName));
    } else {
      setSelectedKpiNames([...selectedKpiNames, kpiName]);
      generateKPIImage(kpiName);
    }
  };
  console.log(selectedKpiImage);
  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1400px",
        margin: "0 auto",
        background: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <Title
        level={2}
        style={{
          marginBottom: "32px",
          color: "#2f54eb",
          textAlign: "center",
          fontWeight: "600",
          textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        Customized KPI Generator
      </Title>

      <Card
        style={{
          marginBottom: "32px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          border: "none",
        }}
      >
        <Input.Group
          compact
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Input
            style={{
              width: "calc(100% - 150px)",
              height: "48px",
              borderRadius: "6px 0 0 6px",
              fontSize: "16px",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            }}
            placeholder="Enter your KPI query"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPressEnter={handleSubmit}
          />
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            style={{
              height: "48px",
              width: "150px",
              borderRadius: "0 6px 6px 0",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Generate KPIs
          </Button>
        </Input.Group>
      </Card>

      <Row gutter={[24, 24]}>
        {kpis.map((kpi, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              hoverable
              onClick={() => handleCardClick(kpi["KPI Name"])}
              style={{
                borderRadius: "8px",
                height: "100%",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.3s ease",
                backgroundColor: selectedKpiNames.includes(kpi["KPI Name"])
                  ? "#f0f7ff"
                  : "white",
                border: selectedKpiNames.includes(kpi["KPI Name"])
                  ? "1px solid #1890ff"
                  : "1px solid #f0f0f0",
                cursor: "pointer",
              }}
              bodyStyle={{
                padding: "20px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Title
                level={4}
                style={{
                  marginBottom: "16px",
                  color: "#1f1f1f",
                  fontWeight: "600",
                  fontSize: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  paddingBottom: "12px",
                }}
              >
                KPI Name:{" "}
                {kpi["KPI Name"].charAt(0).toUpperCase() +
                  kpi["KPI Name"].slice(1)}
              </Title>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: "14px",
                      color: "#595959",
                      minWidth: "70px",
                    }}
                  >
                    Column:
                  </Text>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#262626",
                      flex: 1,
                    }}
                  >
                    {kpi.Column}
                  </Text>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: "14px",
                      color: "#595959",
                      minWidth: "70px",
                    }}
                  >
                    Logic:
                  </Text>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#262626",
                      flex: 1,
                    }}
                  >
                    {kpi.Logic}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedKpiImage.length > 0 && (
        <Collapse style={{ marginTop: "20px" }}>
          {selectedKpiImage.map((item, index) => (
            <Collapse.Panel
              header={item.name.charAt(0).toUpperCase() + item?.name.slice(1)}
              key={index}
            >
              {item.loading ? (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Spin
                    indicator={
                      <LoadingOutlined
                        style={{ fontSize: 32, color: "#2f54eb" }}
                        spin
                      />
                    }
                  />
                </div>
              ) : (
                <>
                  {" "}
                  {item?.image && (
                    <Plot
                      data={item?.image?.data}
                      layout={item?.image?.layout}
                      config={{ responsive: true }}
                      style={{
                        width: "100%",
                        height: "60vh",
                        padding: "15px",
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                      }}
                      className="plot-container"
                    />
                  )}
                  <div
                    dangerouslySetInnerHTML={{ __html: item.code }}
                    style={{
                      width: "100%",
                      padding: "20px",
                      backgroundColor: "#1e1e1e",
                      borderRadius: "8px",
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                      color: "#ffffff",
                    }}
                  />
                </>
              )}
            </Collapse.Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
};

export default CustomizedKPIs;
