import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const BarChartComponent = ({ data, header,height=180,width=220 }) => {
  return (
    <BarChart style={{ margin: "auto" }} cursor={'pointer'} width={width} height={height} data={data}
    // margin={{
    //   top: 5,
    //   right: 30,
    //   left: 20,
    //   bottom: 5,
    // }}
    >
      {/* <CartesianGrid strokeDasharray="3 3" /> */}
      <XAxis dataKey={'value'} />
      {/* <YAxis/> */}
      <Tooltip />
      {/* <Legend /> */}
      <Bar
        cursor={'pointer'}
        dataKey={"count"}
        fill='rgba(0, 163, 255, 1)' // RGBA color with full opacity (alpha = 1)
        barSize={20}
        cornerRadius={{ top: 5 }} // Apply top border radius
      />
    </BarChart>
  );
};

// fill="rgb(252, 128, 3)"

export default BarChartComponent;
