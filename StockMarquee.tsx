import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { StockData } from '../types/stock';
import { fetchStockData, POPULAR_STOCKS } from '../services/stockApi';

const StockMarquee: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [dataQuality, setDataQuality] = useState<'live' | 'simulated'>('simulated');

  useEffect(() => {
    const fetchMarqueeData = async () => {
      try {
        setIsConnected(true);
        const stockPromises = POPULAR_STOCKS.slice(0, 15).map(stock => 
          fetchStockData(stock.symbol).catch(error => {
            console.error(`Failed to fetch ${stock.symbol}:`, error);
            return null;
          })
        );
        
        const stockResults = await Promise.all(stockPromises);
        const validStocks = stockResults.filter(stock => 
          stock !== null && 
          !isNaN(stock.price) && 
          stock.price > 0 &&
          isFinite(stock.price)
        ) as StockData[];
        
        if (validStocks.length > 0) {
          setStocks(validStocks);
          setLastUpdate(new Date());
          
          // Determine data quality based on price variations
          const hasRealisticVariation = validStocks.some(stock => 
            Math.abs(stock.changePercent || 0) > 0.1 && Math.abs(stock.changePercent || 0) < 10
          );
          setDataQuality(hasRealisticVariation ? 'live' : 'simulated');
        }
      } catch (error) {
        console.error('Error fetching marquee data:', error);
        setIsConnected(false);
        setDataQuality('simulated');
      }
    };

    // Initial fetch
    fetchMarqueeData();
    
    // Update every 60 seconds to avoid rate limiting
    const interval = setInterval(fetchMarqueeData, 60000);

    return () => clearInterval(interval);
  }, []);

  // Enhanced formatting functions with validation
  const formatPrice = (price: number) => {
    if (isNaN(price) || price === null || price === undefined || !isFinite(price)) return '₹0.00';
    return `₹${Math.max(price, 0).toFixed(2)}`;
  };

  const formatPercentage = (percent: number) => {
    if (isNaN(percent) || percent === null || percent === undefined || !isFinite(percent)) return '0.00%';
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (isNaN(volume) || volume === null || volume === undefined || !isFinite(volume)) return '0';
    if (volume >= 1e7) return `${(volume / 1e7).toFixed(1)}Cr`;
    if (volume >= 1e5) return `${(volume / 1e5).toFixed(1)}L`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
    return Math.floor(Math.max(volume, 0)).toString();
  };

  if (stocks.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white py-3 overflow-hidden shadow-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Loading market data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white py-3 overflow-hidden shadow-lg relative">
      {/* Connection Status */}
      <div className="absolute top-1 right-4 flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1">
          {dataQuality === 'live' ? (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">Live</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-orange-400">Simulated</span>
            </>
          )}
        </div>
        {isConnected ? (
          <Wifi className="w-3 h-3 text-green-400" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-400" />
        )}
        <span className="text-gray-400">
          {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      {/* Scrolling Stock Data */}
      <div className="flex animate-marquee space-x-12">
        {[...stocks, ...stocks].map((stock, index) => (
          <div key={`${stock.symbol}-${index}`} className="flex items-center space-x-3 min-w-max">
            <span className="font-semibold text-blue-200">
              {stock.symbol.replace('.NS', '')}
            </span>
            <span className="font-bold text-lg">{formatPrice(stock.price)}</span>
            <div className={`flex items-center space-x-1 ${
              (stock.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(stock.change || 0) >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {formatPercentage(stock.changePercent || 0)}
              </span>
            </div>
            <div className="text-xs text-gray-300">
              Vol: {formatVolume(stock.volume || 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Market Status Indicator */}
      <div className="absolute bottom-1 left-4 text-xs text-gray-400">
        <span className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${dataQuality === 'live' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
          <span>NSE Market Data</span>
          {!isConnected && (
            <>
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="text-red-400">Connection Issues</span>
            </>
          )}
        </span>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 150s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default StockMarquee;