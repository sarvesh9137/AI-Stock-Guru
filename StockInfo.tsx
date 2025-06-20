import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Target, AlertTriangle } from 'lucide-react';
import { StockData } from '../types/stock';

interface StockInfoProps {
  stock: StockData;
  prediction: number | null;
}

const StockInfo: React.FC<StockInfoProps> = ({ stock, prediction }) => {
  // Enhanced number validation and formatting
  const isValidNumber = (num: any): boolean => {
    return num !== null && num !== undefined && !isNaN(num) && isFinite(num) && num > 0;
  };

  const formatNumber = (num: number) => {
    if (!isValidNumber(num)) return '₹0.00';
    
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
    return `₹${num.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (!isValidNumber(price)) return '₹0.00';
    return `₹${price.toFixed(2)}`;
  };

  const formatPercentage = (percent: number) => {
    if (!isValidNumber(Math.abs(percent))) return '0.00%';
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (!isValidNumber(volume)) return '0';
    if (volume >= 1e7) return `${(volume / 1e7).toFixed(1)}Cr`;
    if (volume >= 1e5) return `${(volume / 1e5).toFixed(1)}L`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
    return Math.floor(volume).toString();
  };

  // Validate stock data
  const hasValidData = isValidNumber(stock.price) && isValidNumber(stock.previousClose);
  const predictionChange = prediction && isValidNumber(prediction) && hasValidData 
    ? ((prediction - stock.price) / stock.price) * 100 
    : 0;

  // Data quality indicator
  const dataQuality = hasValidData ? 'live' : 'simulated';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Data Quality Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${dataQuality === 'live' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
          <span className={`text-xs font-medium ${dataQuality === 'live' ? 'text-green-700' : 'text-orange-700'}`}>
            {dataQuality === 'live' ? 'Live Market Data' : 'Simulated Data'}
          </span>
        </div>
        {!hasValidData && (
          <div className="flex items-center space-x-1 text-orange-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Market data unavailable</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{stock.symbol}</h2>
          <p className="text-gray-600">{stock.name}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-800">{formatPrice(stock.price)}</div>
          <div className={`flex items-center justify-end space-x-1 ${
            (stock.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {(stock.change || 0) >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-semibold">
              {formatPercentage(stock.changePercent || 0)}
            </span>
          </div>
        </div>
      </div>

      {prediction && isValidNumber(prediction) && hasValidData && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">Next Day AI Prediction</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">{formatPrice(prediction)}</div>
              <div className={`text-sm font-medium ${
                predictionChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(predictionChange)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <div>
            <div className="text-xs text-gray-500">Open</div>
            <div className="font-semibold">{formatPrice(stock.open || stock.price)}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-green-600" />
          <div>
            <div className="text-xs text-gray-500">High</div>
            <div className="font-semibold text-green-600">{formatPrice(stock.dayHigh || stock.price)}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-red-600" />
          <div>
            <div className="text-xs text-gray-500">Low</div>
            <div className="font-semibold text-red-600">{formatPrice(stock.dayLow || stock.price)}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-purple-600" />
          <div>
            <div className="text-xs text-gray-500">Volume</div>
            <div className="font-semibold">{formatVolume(stock.volume || 0)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Market Cap:</span>
            <span className="ml-2 font-semibold">{formatNumber(stock.marketCap || 0)}</span>
          </div>
          <div>
            <span className="text-gray-500">52W High:</span>
            <span className="ml-2 font-semibold text-green-600">{formatPrice(stock.high52Week || stock.price * 1.3)}</span>
          </div>
          <div>
            <span className="text-gray-500">52W Low:</span>
            <span className="ml-2 font-semibold text-red-600">{formatPrice(stock.low52Week || stock.price * 0.7)}</span>
          </div>
        </div>
      </div>

      {/* Additional market info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Previous Close:</span>
            <span className="font-medium">{formatPrice(stock.previousClose || stock.price)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Change:</span>
            <span className={`font-medium ${(stock.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(Math.abs(stock.change || 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockInfo;