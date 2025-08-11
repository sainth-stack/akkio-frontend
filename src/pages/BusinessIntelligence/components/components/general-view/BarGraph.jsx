import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const BarChartComponent = ({ data, header, height = 180, width = 220, onClick, xAxis = true }) => {
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

  const handleChartClick = () => {
    if (onClick) {
      onClick(data, header);
    }
  };

  return (
    <div 
      onClick={handleChartClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease',
        borderRadius: '8px',
        padding: '4px'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.backgroundColor = '#f8fafc';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <BarChart 
        style={{ margin: "auto" }} 
        width={width} 
        height={height} 
        data={data}
      >
        {xAxis && (
          <XAxis
            dataKey='value'
            tickFormatter={tickFormatter}
            tick={{ fontSize: 12 }}
            tickLine={false} // Hide the tick lines if needed
          />
        )}
        <Tooltip 
          formatter={(value) => [`${value} records`, 'Count']}
          labelStyle={{ color: '#333', fontWeight: '600' }}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e0e0e0', 
            borderRadius: '6px',
            fontSize: '12px'
          }}
        />
        <Bar
          dataKey="count"
          fill='rgba(59, 130, 246, 0.8)' // Updated color with better opacity
          barSize={20}
          radius={[4, 4, 0, 0]} // Apply top border radius
        />
      </BarChart>
    </div>
  );
};

export default BarChartComponent;
