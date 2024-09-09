import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export const DetailedLineGraph = ({ labelsNew, data, data2 }) => {
    const chartRef = useRef(null);
    const myChartRef = useRef(null);

    useEffect(() => {
        if (myChartRef.current) {
            myChartRef.current.destroy(); // Destroy the previous chart instance if it exists
        }

        const ctx = chartRef.current.getContext('2d');
        myChartRef.current = new Chart(ctx, {
            type: 'line', // Assuming a line chart; adjust if necessary
            data: {
                labels: labelsNew,
                datasets: [{
                    label: 'Actual',
                    data: [...data],
                    fill: false,
                    borderColor: '#85D8DD',
                    tension: 0.1,
                    backgroundColor: ['#85D8DD'],
                    yAxisID: 'y',
                }, {
                    label: 'Prediction',
                    data: [...new Array(data.length > 0 ? data?.length - 1 : 0).fill(null), data[data.length > 0 ? data?.length - 1 : 0], ...data2],
                    fill: false,
                    borderColor: '#85D8DD',
                    tension: 0.1,
                    backgroundColor: ['#85D8DD'],
                    yAxisID: 'y',
                    borderDash: [5, 5],
                    pointBackgroundColor: "transparent"
                }],
            },
            options: {
                chart: {
                    type: 'bar',
                    height: 350
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                responsive: true,
                stacked: false,
                colors: ["#85D8DD", "#427ae3", "#3dc7d1", '#faa93e'],
                fill: {
                    colors: ["#85D8DD", "#427ae3", "#3dc7d1", '#faa93e']
                },
                dataLabels: {
                    enabled: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            usePointStyle: true,
                        },
                    },
                    datalabels: {
                        display: false,
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    },
                },
                stroke: {
                    show: true,
                    width: 2,
                    colors: ['transparent']
                },
                scales: {
                    y: {
                        min: 0,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Sales',
                            color: 'black',
                            fontWeight: 700,
                            padding: 5
                        },
                        ticks: {
                            // stepSize: 1000// <----- This prop sets the stepSize
                        }
                    },
                    x: {
                        barPercentage: 0.5,
                        categorySpacing: 0,
                        stacked: true,
                        autoSkip: false,
                        grid: {
                            display: false,
                        },
                        ticks: {
                            autoSkip: false,
                        },
                    },
                },
                maintainAspectRatio: false,
                tooltip: {
                    y: {
                        formatter: function (context) {
                            if (typeof context === 'number') {
                                return context;
                            } else {
                                return context[1] - context[0]
                            }
                        }
                    }
                },
            }
        });

        return () => {
            if (myChartRef.current) {
                myChartRef.current.destroy(); // Cleanup on component unmount
            }
        };
    }, [labelsNew, data, data2]); // Dependencies ensure the chart updates when props change

    return <canvas ref={chartRef} width={"100vh"}/>;
};

