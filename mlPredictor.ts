import { HistoricalData, PredictionData, InvestmentRecommendation } from '../types/stock';

export class MLStockPredictor {
  private calculateMovingAverage(data: number[], window: number): number[] {
    const ma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        ma.push(data[i]);
      } else {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        ma.push(sum / window);
      }
    }
    return ma;
  }

  private calculateRSI(prices: number[], period: number = 14): number[] {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const rsi = [];
    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        rsi.push(50);
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const rs = avgGain / (avgLoss || 0.01);
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  private calculateMACD(prices: number[]): { macd: number[], signal: number[], histogram: number[] } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12.map((val, i) => val - ema26[i]);
    const signal = this.calculateEMA(macd, 9);
    const histogram = macd.map((val, i) => val - signal[i]);

    return { macd, signal, histogram };
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];
    
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }
    
    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    const ma = this.calculateMovingAverage(prices, period);
    const bands = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        bands.push({ upper: prices[i], middle: prices[i], lower: prices[i] });
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = ma[i];
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        bands.push({
          upper: mean + (standardDeviation * stdDev),
          middle: mean,
          lower: mean - (standardDeviation * stdDev)
        });
      }
    }

    return bands;
  }

  // Enhanced validation for input data
  private validateData(data: number[]): boolean {
    return data.length > 0 && data.every(val => 
      !isNaN(val) && isFinite(val) && val > 0
    );
  }

  public predictNextDay(historicalData: HistoricalData[]): number {
    if (historicalData.length < 50) {
      const lastPrice = historicalData[historicalData.length - 1]?.close;
      return lastPrice && !isNaN(lastPrice) ? lastPrice : 100;
    }

    const prices = historicalData.map(d => d.close).filter(price => 
      !isNaN(price) && isFinite(price) && price > 0
    );
    
    if (!this.validateData(prices)) {
      return historicalData[historicalData.length - 1]?.close || 100;
    }

    const volumes = historicalData.map(d => d.volume).filter(vol => 
      !isNaN(vol) && isFinite(vol) && vol >= 0
    );
    
    // Technical indicators with validation
    const sma20 = this.calculateMovingAverage(prices, 20);
    const sma50 = this.calculateMovingAverage(prices, 50);
    const ema12 = this.calculateEMA(prices, 12);
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollingerBands(prices);
    
    const lastIndex = prices.length - 1;
    const currentPrice = prices[lastIndex];
    
    // Validate all indicators
    if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
      return historicalData[historicalData.length - 1]?.close || 100;
    }
    
    // Feature extraction with safety checks
    const features = {
      priceToSMA20: sma20[lastIndex] > 0 ? currentPrice / sma20[lastIndex] : 1,
      priceToSMA50: sma50[lastIndex] > 0 ? currentPrice / sma50[lastIndex] : 1,
      smaRatio: sma50[lastIndex] > 0 ? sma20[lastIndex] / sma50[lastIndex] : 1,
      rsi: isFinite(rsi[lastIndex]) ? rsi[lastIndex] / 100 : 0.5,
      macdSignal: macd.macd[lastIndex] > macd.signal[lastIndex] ? 1 : -1,
      bollingerPosition: bollinger[lastIndex] && (bollinger[lastIndex].upper - bollinger[lastIndex].lower) > 0 
        ? (currentPrice - bollinger[lastIndex].lower) / (bollinger[lastIndex].upper - bollinger[lastIndex].lower)
        : 0.5,
      volumeRatio: volumes.length > 20 && volumes[volumes.length - 1] > 0 
        ? volumes[volumes.length - 1] / (volumes.slice(-20).reduce((a, b) => a + b, 0) / 20)
        : 1,
      momentum: prices.length > 10 && prices[lastIndex - 10] > 0 
        ? (prices[lastIndex] - prices[lastIndex - 10]) / prices[lastIndex - 10]
        : 0,
      volatility: this.calculateVolatility(prices.slice(-20))
    };

    // Enhanced neural network weights
    const weights = {
      priceToSMA20: 0.18,
      priceToSMA50: 0.15,
      smaRatio: 0.20,
      rsi: -0.10,
      macdSignal: 0.12,
      bollingerPosition: -0.08,
      volumeRatio: 0.08,
      momentum: 0.28,
      volatility: -0.09
    };

    let prediction = 0;
    Object.entries(features).forEach(([key, value]) => {
      if (isFinite(value)) {
        prediction += value * weights[key as keyof typeof weights];
      }
    });

    // Apply sigmoid activation and scale with bounds
    const changePercent = Math.tanh(prediction) * 0.04; // Limit to 4% change
    const predictedPrice = currentPrice * (1 + changePercent);

    // Add controlled randomness and ensure reasonable bounds
    const noise = (Math.random() - 0.5) * 0.008;
    const finalPrediction = predictedPrice * (1 + noise);
    
    // Ensure prediction is within reasonable bounds
    const minPrice = currentPrice * 0.92; // Max 8% down
    const maxPrice = currentPrice * 1.08; // Max 8% up
    
    return Math.max(minPrice, Math.min(maxPrice, finalPrediction));
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0.02;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] > 0) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
    }
    
    if (returns.length === 0) return 0.02;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  public generatePredictions(historicalData: HistoricalData[], days: number = 30): PredictionData[] {
    const predictions: PredictionData[] = [];
    const actualPrices = historicalData.map(d => d.close).filter(price => 
      !isNaN(price) && isFinite(price) && price > 0
    );
    
    if (actualPrices.length < 50) return predictions;
    
    // Generate predictions for historical data (backtesting)
    const startIndex = Math.max(50, historicalData.length - days);
    for (let i = startIndex; i < historicalData.length; i++) {
      const dataUpToPoint = historicalData.slice(0, i);
      const predicted = this.predictNextDay(dataUpToPoint);
      const actual = actualPrices[i];
      
      if (!isNaN(actual) && !isNaN(predicted) && actual > 0 && predicted > 0) {
        // Calculate confidence based on recent prediction accuracy
        const recentPredictions = predictions.slice(-10);
        const avgError = recentPredictions.length > 0 
          ? recentPredictions.reduce((sum, p) => sum + Math.abs(p.actual - p.predicted) / p.actual, 0) / recentPredictions.length
          : 0.02;
        
        const confidence = Math.max(0.65, Math.min(0.95, 1 - avgError * 8));
        
        predictions.push({
          date: historicalData[i].date,
          actual,
          predicted,
          confidence
        });
      }
    }

    return predictions;
  }

  public generateInvestmentRecommendations(stocksData: { symbol: string, data: HistoricalData[] }[]): InvestmentRecommendation[] {
    return stocksData.map(({ symbol, data }) => {
      if (data.length < 50) {
        const lastPrice = data[data.length - 1]?.close;
        return {
          symbol,
          name: symbol.replace('.NS', ''),
          recommendation: 'HOLD' as const,
          targetPrice: lastPrice && !isNaN(lastPrice) ? lastPrice : 100,
          confidence: 0.5,
          reason: 'Insufficient data for analysis'
        };
      }

      const prices = data.map(d => d.close).filter(price => 
        !isNaN(price) && isFinite(price) && price > 0
      );
      
      if (!this.validateData(prices)) {
        return {
          symbol,
          name: symbol.replace('.NS', ''),
          recommendation: 'HOLD' as const,
          targetPrice: 100,
          confidence: 0.5,
          reason: 'Invalid price data'
        };
      }

      const currentPrice = prices[prices.length - 1];
      const predictedPrice = this.predictNextDay(data);
      
      const sma20 = this.calculateMovingAverage(prices, 20);
      const sma50 = this.calculateMovingAverage(prices, 50);
      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      
      const lastIndex = prices.length - 1;
      
      // Enhanced scoring system
      let score = 0;
      let reasons = [];
      
      // Price prediction (weighted heavily)
      const priceChange = (predictedPrice - currentPrice) / currentPrice;
      if (priceChange > 0.025) {
        score += 4;
        reasons.push('Strong AI price prediction (+2.5%+)');
      } else if (priceChange > 0.01) {
        score += 2;
        reasons.push('Positive AI price prediction');
      } else if (priceChange < -0.025) {
        score -= 4;
        reasons.push('Negative AI price prediction (-2.5%+)');
      } else if (priceChange < -0.01) {
        score -= 2;
        reasons.push('Weak AI price prediction');
      }
      
      // Moving averages
      if (sma20[lastIndex] > sma50[lastIndex] && currentPrice > sma20[lastIndex]) {
        score += 3;
        reasons.push('Bullish trend (above moving averages)');
      } else if (sma20[lastIndex] < sma50[lastIndex] && currentPrice < sma20[lastIndex]) {
        score -= 3;
        reasons.push('Bearish trend (below moving averages)');
      }
      
      // RSI analysis
      const currentRSI = rsi[lastIndex];
      if (currentRSI < 30) {
        score += 2;
        reasons.push('Oversold condition (RSI < 30)');
      } else if (currentRSI > 70) {
        score -= 2;
        reasons.push('Overbought condition (RSI > 70)');
      } else if (currentRSI >= 40 && currentRSI <= 60) {
        score += 1;
        reasons.push('Neutral RSI levels');
      }
      
      // MACD signal
      if (macd.macd[lastIndex] > macd.signal[lastIndex]) {
        score += 1;
        reasons.push('Positive MACD crossover');
      } else {
        score -= 1;
        reasons.push('Negative MACD signal');
      }
      
      // Momentum analysis
      if (prices.length > 10) {
        const momentum = (currentPrice - prices[lastIndex - 10]) / prices[lastIndex - 10];
        if (momentum > 0.08) {
          score += 2;
          reasons.push('Strong positive momentum (8%+)');
        } else if (momentum > 0.03) {
          score += 1;
          reasons.push('Positive momentum');
        } else if (momentum < -0.08) {
          score -= 2;
          reasons.push('Strong negative momentum (-8%+)');
        } else if (momentum < -0.03) {
          score -= 1;
          reasons.push('Negative momentum');
        }
      }

      // Determine recommendation based on score
      let recommendation: 'BUY' | 'SELL' | 'HOLD';
      let confidence: number;
      
      if (score >= 5) {
        recommendation = 'BUY';
        confidence = Math.min(0.92, 0.75 + score * 0.03);
      } else if (score <= -4) {
        recommendation = 'SELL';
        confidence = Math.min(0.88, 0.70 + Math.abs(score) * 0.03);
      } else {
        recommendation = 'HOLD';
        confidence = 0.70 + Math.abs(score) * 0.02;
      }

      return {
        symbol,
        name: symbol.replace('.NS', ''),
        recommendation,
        targetPrice: Math.max(predictedPrice, 1),
        confidence: Math.min(confidence, 0.95),
        reason: reasons.slice(0, 2).join(', ') || 'Mixed technical signals'
      };
    }).sort((a, b) => {
      // Sort by recommendation priority, then by confidence
      const priorityOrder = { 'BUY': 3, 'HOLD': 2, 'SELL': 1 };
      const aPriority = priorityOrder[a.recommendation];
      const bPriority = priorityOrder[b.recommendation];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.confidence - a.confidence;
    });
  }
}

export const mlPredictor = new MLStockPredictor();