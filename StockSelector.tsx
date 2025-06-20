import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, X, Clock } from 'lucide-react';
import { POPULAR_STOCKS, searchStocks, getStockSuggestions, validateNSESymbol } from '../services/stockApi';

interface StockSelectorProps {
  selectedStock: string;
  onStockChange: (symbol: string) => void;
}

const StockSelector: React.FC<StockSelectorProps> = ({ selectedStock, onStockChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentStockSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults(POPULAR_STOCKS.slice(0, 10));
      setShowDropdown(true);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        // First show local suggestions immediately
        const localSuggestions = getStockSuggestions(query);
        setSearchResults(localSuggestions);
        setShowDropdown(true);

        // Then fetch from API for more comprehensive results
        if (query.length >= 2) {
          const apiResults = await searchStocks(query);
          if (apiResults.length > 0) {
            // Combine and deduplicate results
            const combined = [...apiResults, ...localSuggestions];
            const unique = combined.filter((stock, index, self) => 
              index === self.findIndex(s => s.symbol === stock.symbol)
            );
            setSearchResults(unique.slice(0, 15));
          }
        }
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to local suggestions
        setSearchResults(getStockSuggestions(query));
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleStockSelect = (symbol: string) => {
    const validatedSymbol = validateNSESymbol(symbol);
    onStockChange(validatedSymbol);
    setSearchQuery('');
    setShowDropdown(false);
    
    // Add to recent searches
    const newRecent = [validatedSymbol, ...recentSearches.filter(s => s !== validatedSymbol)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentStockSearches', JSON.stringify(newRecent));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(POPULAR_STOCKS.slice(0, 10));
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    if (!searchQuery.trim()) {
      setSearchResults(POPULAR_STOCKS.slice(0, 10));
    }
    setShowDropdown(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Select Stock</h2>
      </div>
      
      <div className="relative mb-4" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search NSE stocks (e.g., RELIANCE, TCS)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={handleInputFocus}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {/* Recent Searches */}
            {!searchQuery && recentSearches.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Recent Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleStockSelect(symbol)}
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      {symbol.replace('.NS', '')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleStockSelect(stock.symbol)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-l-4 ${
                      selectedStock === stock.symbol
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">
                      {stock.symbol.replace('.NS', '')}
                      {selectedStock === stock.symbol && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 truncate">{stock.name}</div>
                  </button>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No stocks found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching with NSE stock symbols</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Popular Stocks Grid */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">Popular Stocks</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {POPULAR_STOCKS.slice(0, 12).map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleStockSelect(stock.symbol)}
              className={`p-3 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                selectedStock === stock.symbol
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-gray-800">
                {stock.symbol.replace('.NS', '')}
              </div>
              <div className="text-sm text-gray-600 truncate">{stock.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Selection */}
      {selectedStock && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-green-800">
                Currently Selected: {selectedStock.replace('.NS', '')}
              </div>
              <div className="text-sm text-green-600">
                {POPULAR_STOCKS.find(s => s.symbol === selectedStock)?.name || 'NSE Listed Stock'}
              </div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSelector;