import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const BarChartComponent = ({ data, header, height = 180, width = 220 }) => {
  // Calculate the tick values for the first, middle, and last data points
  const ticks = data.length > 1 ? [
    data[0]?.value, // First value
    data[Math.floor(data.length / 2)]?.value, // Middle value
    data[data.length - 1]?.value // Last value
  ] : [data[0]?.value];

  // Custom tick formatter to display only the desired ticks
  const tickFormatter = (value) => {
    return ticks.includes(value) ? value : '';
  };

  return (
    <BarChart style={{ margin: "auto" }} cursor={'pointer'} width={width} height={height} data={data}>
      <XAxis
        dataKey='value'
        tickFormatter={tickFormatter}
        tick={{ fontSize: 12 }}
        tickLine={false} // Hide the tick lines if needed
      />
      <Tooltip />
      <Bar
        cursor={'pointer'}
        dataKey="count"
        fill='rgba(0, 163, 255, 1)' // RGBA color with full opacity (alpha = 1)
        barSize={20}
        cornerRadius={{ top: 5 }} // Apply top border radius
      />
    </BarChart>
  );
};

export default BarChartComponent;
