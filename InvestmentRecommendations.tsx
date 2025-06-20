import React from 'react';
import { TrendingUp, TrendingDown, Minus, Star, Target, AlertCircle } from 'lucide-react';
import { InvestmentRecommendation } from '../types/stock';

interface InvestmentRecommendationsProps {
  recommendations: InvestmentRecommendation[];
}

const InvestmentRecommendations: React.FC<InvestmentRecommendationsProps> = ({ recommendations }) => {
  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'SELL':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SELL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <Star className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">AI Investment Recommendations</h2>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={rec.symbol} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getRecommendationIcon(rec.recommendation)}
                <div>
                  <h3 className="font-bold text-gray-800">{rec.symbol}</h3>
                  <p className="text-sm text-gray-600">{rec.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(rec.recommendation)}`}>
                  {rec.recommendation}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <AlertCircle className={`w-3 h-3 ${getConfidenceColor(rec.confidence)}`} />
                  <span className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                    {(rec.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Target Price:</span>
              </div>
              <span className="font-bold text-blue-600">₹{rec.targetPrice.toFixed(2)}</span>
            </div>

            <div className="text-sm text-gray-700 bg-gray-50 rounded p-3">
              <strong>Analysis:</strong> {rec.reason}
            </div>

            {index === 0 && rec.recommendation === 'BUY' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Top Pick</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Highest confidence recommendation based on technical analysis
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800">Disclaimer</span>
        </div>
        <p className="text-xs text-blue-700">
          These recommendations are based on technical analysis and should not be considered as financial advice. 
          Always do your own research and consider consulting with a financial advisor before making investment decisions.
        </p>
      </div>
    </div>
  );
};

export default InvestmentRecommendations;