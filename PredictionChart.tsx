import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PredictionData } from '../types/stock';

interface PredictionChartProps {
  data: PredictionData[];
  title: string;
}

const PredictionChart: React.FC<PredictionChartProps> = ({ data, title }) => {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    actual: item.actual,
    predicted: item.predicted,
    confidence: item.confidence
  }));

  const accuracy = data.length > 0 
    ? (data.reduce((sum, item) => {
        const error = Math.abs(item.actual - item.predicted) / item.actual;
        return sum + (1 - error);
      }, 0) / data.length * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
          Accuracy: {accuracy.toFixed(1)}%
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => {
                const formattedValue = `₹${value.toFixed(2)}`;
                if (name === 'actual') return [formattedValue, 'Actual Price'];
                if (name === 'predicted') return [formattedValue, 'Predicted Price'];
                return [formattedValue, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
              // formatter={(value: number, name: string) => {
              //   const roundedValue = `₹${Math.round(value)}`;
              //   if (name === 'actual') return [roundedValue, 'Actual Price'];
              //   if (name === 'predicted') return [roundedValue, 'Predicted Price'];
              //   return [roundedValue, name];
              // }}
              // labelFormatter={(label) => `Date: ${label}`}
              // formatter={(value: number, name: string) => [
              //   `₹${value.toFixed(2)}`, 
              //   name === 'actual' ? 'Actual Price' : 'Predicted Price'
              // ]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
              name="Actual"
            />
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="#F59E0B" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
              name="Predicted"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PredictionChart;