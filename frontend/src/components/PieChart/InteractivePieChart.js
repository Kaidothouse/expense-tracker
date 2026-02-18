import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

// Custom colors per category
const CATEGORY_COLORS = {
  'Food & Dining': '#8B5CF6',
  'Shopping': '#EC4899',
  'Entertainment': '#F59E0B',
  'Transportation': '#10B981',
  'Bills & Utilities': '#3B82F6',
  'Healthcare': '#EF4444',
  'Education': '#6366F1',
  'Travel': '#14B8A6',
  'Personal Care': '#F97316',
  'Other': '#9CA3AF',
  // Income categories
  'Salary': '#059669',
  'Freelance': '#0891B2',
  'Investments': '#7C3AED',
  'Other Income': '#84CC16',
};

const DEFAULT_COLOR = '#6B7280';

const InteractivePieChart = ({
  data = [],
  onSliceClick,
  height = 400,
  showLegend = true,
  interactive = true,
  animationDelay = 500
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Animation on load
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  // Prepare data with percentages and colors
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const preparedData = data.map((item, index) => ({
    ...item,
    color: CATEGORY_COLORS[item.name] || DEFAULT_COLOR,
    index,
    percentage: totalValue ? ((item.value / totalValue) * 100).toFixed(1) : '0.0',
  }));

  // Custom active shape for clicked slice
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff" className="font-bold text-lg">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 16}
          outerRadius={outerRadius + 20}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#E5E7EB"
          className="text-sm"
        >
          {formatCurrency(value)}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#9CA3AF"
          className="text-xs"
        >
          ({(percent * 100).toFixed(1)}%)
        </text>
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-navy-800 border border-navy-700 rounded-lg p-3 shadow-lg animate-fade-in">
          <p className="text-sm font-medium text-white flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
            {data.name}
          </p>
          <p className="text-lg font-bold text-purple-400 mt-1">
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-navy-400">
            {data.payload.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <li
            key={`item-${index}`}
            className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => interactive && handleSliceClick(entry.payload, entry.payload?.index)}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-navy-300">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const handleSliceClick = (data, index) => {
    if (!interactive) return;

    if (typeof index === 'number') {
      setActiveIndex(index);
    }
    if (onSliceClick) {
      // Find category by name to get the ID
      onSliceClick(data);
    }
  };

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-navy-400">
        <svg
          className="w-16 h-16 mb-4 opacity-50"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <p className="text-lg font-medium mb-1">No Data Available</p>
        <p className="text-sm">Add some expenses to see the breakdown</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={preparedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={isAnimating ? 800 : 0}
            onClick={handleSliceClick}
            activeIndex={activeIndex}
            activeShape={interactive ? renderActiveShape : null}
          >
            {preparedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={renderLegend} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InteractivePieChart;
