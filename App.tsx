import React, { useState, useEffect } from 'react';
import { Brain, BarChart3, TrendingUp, Loader2, AlertCircle, RefreshCw, Target, TrendingDown, Minus } from 'lucide-react';
import StockMarquee from './components/StockMarquee';
import StockSelector from './components/StockSelector';
import StockInfo from './components/StockInfo';
import StockChart from './components/StockChart';
import PredictionChart from './components/PredictionChart';
import InvestmentRecommendations from './components/InvestmentRecommendations';
import { fetchStockData, fetchHistoricalData, POPULAR_STOCKS, validateNSESymbol } from './services/stockApi';
import { mlPredictor } from './services/mlPredictor';
import { StockData, HistoricalData, PredictionData, InvestmentRecommendation } from './types/stock';

function App() {
  const [selectedStock, setSelectedStock] = useState(POPULAR_STOCKS[0].symbol);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [nextDayPrediction, setNextDayPrediction] = useState<number | null>(null);
  const [currentStockRecommendation, setCurrentStockRecommendation] = useState<InvestmentRecommendation | null>(null);
  const [recommendations, setRecommendations] = useState<InvestmentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadStockData();
  }, [selectedStock]);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const loadStockData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const validatedSymbol = validateNSESymbol(selectedStock);
      
      const [stock, historical] = await Promise.all([
        fetchStockData(validatedSymbol),
        fetchHistoricalData(validatedSymbol)
      ]);

      setStockData(stock);
      setHistoricalData(historical);
      setLastUpdate(new Date());
      
      // Generate predictions
      const predictionData = mlPredictor.generatePredictions(historical);
      setPredictions(predictionData);
      
      // Get next day prediction
      const nextDay = mlPredictor.predictNextDay(historical);
      setNextDayPrediction(nextDay);

      // Generate recommendation for current stock
      if (historical.length > 0) {
        const stockRecommendations = mlPredictor.generateInvestmentRecommendations([
          { symbol: validatedSymbol, data: historical }
        ]);
        setCurrentStockRecommendation(stockRecommendations[0] || null);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      const stocksToAnalyze = POPULAR_STOCKS.slice(0, 8);
      const stocksData = await Promise.all(
        stocksToAnalyze.map(async (stock) => {
          try {
            const data = await fetchHistoricalData(stock.symbol);
            return { symbol: stock.symbol, data };
          } catch (error) {
            console.error(`Error fetching data for ${stock.symbol}:`, error);
            return { symbol: stock.symbol, data: [] };
          }
        })
      );

      const validStocksData = stocksData.filter(item => item.data.length > 0);
      
      if (validStocksData.length > 0) {
        const recs = mlPredictor.generateInvestmentRecommendations(validStocksData);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  const handleStockChange = (symbol: string) => {
    const validatedSymbol = validateNSESymbol(symbol);
    setSelectedStock(validatedSymbol);
  };

  const handleRefresh = () => {
    loadStockData();
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stock Marquee */}
      <StockMarquee />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">AI Stock Guru</h1>
                <p className="text-gray-600">Advanced Stock Prediction Platform - NSE Real-time Data</p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
          
          {lastUpdate && (
            <div className="mt-2 text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Error loading data</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <StockSelector 
              selectedStock={selectedStock}
              onStockChange={handleStockChange}
            />
            
            {recommendations.length > 0 && (
              <InvestmentRecommendations recommendations={recommendations} />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading real-time stock data...</span>
              </div>
            ) : (
              <>
                {/* Stock Info */}
                {stockData && (
                  <StockInfo 
                    stock={stockData} 
                    prediction={nextDayPrediction}
                  />
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Historical Chart */}
                  {historicalData.length > 0 && (
                    <StockChart 
                      data={historicalData}
                      title="Price History (1 Year)"
                    />
                  )}

                  {/* Prediction Chart */}
                  {predictions.length > 0 && (
                    <PredictionChart 
                      data={predictions}
                      title="Actual vs Predicted Prices"
                    />
                  )}
                </div>

                {/* Performance Metrics */}
                {predictions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span>AI Model Performance</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {((predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Confidence</div>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {predictions.length}
                        </div>
                        <div className="text-sm text-gray-600">Predictions</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {nextDayPrediction ? `₹${nextDayPrediction.toFixed(2)}` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Next Day Target</div>
                      </div>
                      
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          <TrendingUp className="w-6 h-6 mx-auto" />
                        </div>
                        <div className="text-sm text-gray-600">Technical Analysis</div>
                      </div>
                    </div>

                    {/* AI Investment Recommendation for Current Stock */}
                    {currentStockRecommendation && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Target className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-lg font-bold text-gray-800">AI Recommendation for {selectedStock.replace('.NS', '')}</h4>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(currentStockRecommendation.recommendation)}`}>
                              {getRecommendationIcon(currentStockRecommendation.recommendation)}
                              <span className="ml-1">{currentStockRecommendation.recommendation}</span>
                            </div>
                            <div className="text-sm font-medium text-indigo-600">
                              {(currentStockRecommendation.confidence * 100).toFixed(0)}% Confidence
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Current Price:</span>
                            <span className="font-bold text-gray-800">₹{stockData?.price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Target Price:</span>
                            <span className="font-bold text-indigo-600">₹{currentStockRecommendation.targetPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-700 bg-white rounded p-3 border border-indigo-100">
                          <strong>AI Analysis:</strong> {currentStockRecommendation.reason}
                        </div>

                        {stockData && (
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Potential Return:</span>
                            <span className={`font-bold ${
                              currentStockRecommendation.targetPrice > stockData.price ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {((currentStockRecommendation.targetPrice - stockData.price) / stockData.price * 100).toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Data Source Info */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-800">
                          Real-time data from Yahoo Finance NSE
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Predictions based on advanced technical analysis including RSI, MACD, Bollinger Bands, and moving averages
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold">AI Stock Guru</span>
          </div>
          <p className="text-gray-400">
            Advanced machine learning powered stock prediction platform for NSE Indian markets
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Real-time data from Yahoo Finance • Technical Analysis • ML Predictions
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Disclaimer: This is for educational purposes only. Not financial advice. Please consult with financial advisors before making investment decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;