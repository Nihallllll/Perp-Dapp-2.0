import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ChartData {
  timestamp: number;
  spotPrice: number;
  perpPrice: number;
  volume: number;
}

interface TradingChartProps {
  onPriceUpdate: (spotPrice: number, perpPrice: number) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ onPriceUpdate }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState({ spot: 0, perp: 0 });
  const [priceChange, setPriceChange] = useState({ spot: 0, perp: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPriceRef = useRef({ spot: 0, perp: 0 });
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  const timeframes = [
    { label: '5m', value: '5m', interval: '5m' },
    { label: '15m', value: '15m', interval: '15m' },
    { label: '1h', value: '1h', interval: '1h' },
    { label: '4h', value: '4h', interval: '4h' },
    { label: '1d', value: '1d', interval: '1d' },
  ];

  // Fetch initial chart data
  const fetchChartData = async (timeframe: string) => {
    setIsLoading(true);
    try {
      // Fetch Binance spot data
      const binanceResponse = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${timeframe}&limit=100`
      );
      const binanceData = await binanceResponse.json();

      // Fetch Deribit perp data (mock for now - replace with actual API)
      const mockPerpData = binanceData.map((item: any[], index: number) => {
        const basePrice = parseFloat(item[4]); // close price
        return basePrice + (Math.random() - 0.5) * 100; // Add some variance
      });

      const processedData: ChartData[] = binanceData.map((item: any[], index: number) => ({
        timestamp: item[0],
        spotPrice: parseFloat(item[4]),
        perpPrice: mockPerpData[index],
        volume: parseFloat(item[5]),
      }));

      setChartData(processedData);
      
      if (processedData.length > 0) {
        const latest = processedData[processedData.length - 1];
        const previous = processedData[processedData.length - 2];
        
        const newPrices = { spot: latest.spotPrice, perp: latest.perpPrice };
        setCurrentPrice(newPrices);
        lastPriceRef.current = newPrices;
        
        setPriceChange({
          spot: previous ? ((latest.spotPrice - previous.spotPrice) / previous.spotPrice) * 100 : 0,
          perp: previous ? ((latest.perpPrice - previous.perpPrice) / previous.perpPrice) * 100 : 0,
        });
        
        onPriceUpdate(latest.spotPrice, latest.perpPrice);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
    setIsLoading(false);
  };

  // Setup WebSocket connection
  const setupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear any existing simulation
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
    }

    // Binance WebSocket for real-time spot prices
    wsRef.current = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newSpotPrice = parseFloat(data.c);
      
      // Only update if price actually changed
      if (newSpotPrice === lastPriceRef.current.spot) {
        return;
      }
      
      // Generate perp price with some correlation to spot but with variance
      const baseVariance = (Math.random() - 0.5) * 100;
      const trendVariance = Math.sin(Date.now() / 10000) * 20;
      const newPerpPrice = newSpotPrice + baseVariance + trendVariance;
      
      // Calculate price changes using the last data point
      const spotChange = lastPriceRef.current.spot ? 
        ((newSpotPrice - lastPriceRef.current.spot) / lastPriceRef.current.spot) * 100 : 0;
      const perpChange = lastPriceRef.current.perp ? 
        ((newPerpPrice - lastPriceRef.current.perp) / lastPriceRef.current.perp) * 100 : 0;
      
      // Update display prices and changes
      const newPrices = { spot: newSpotPrice, perp: newPerpPrice };
      setCurrentPrice(newPrices);
      lastPriceRef.current = newPrices;
      setPriceChange({ spot: spotChange, perp: perpChange });
      
      // Call price update callback
      onPriceUpdate(newSpotPrice, newPerpPrice);

      // Update chart data with new point
      setChartData(prev => {
        const newPoint: ChartData = {
          timestamp: Date.now(),
          spotPrice: newSpotPrice,
          perpPrice: newPerpPrice,
          volume: parseFloat(data.v) || 0,
        };
        
        return [...prev.slice(-99), newPoint]; // Keep last 100 points
      });
    };

    // Fallback simulation for when real prices don't move much
    simulationRef.current = setInterval(() => {
      const baseSpot = lastPriceRef.current.spot || 107000;
      const basePerp = lastPriceRef.current.perp || 107000;
      
      // Create small realistic price movements
      const spotVariance = (Math.random() - 0.5) * 20; // $10 variance
      const perpVariance = (Math.random() - 0.5) * 50; // $25 variance
      
      const newSpotPrice = baseSpot + spotVariance;
      const newPerpPrice = basePerp + perpVariance;
      
      // Calculate price changes
      const spotChange = ((newSpotPrice - baseSpot) / baseSpot) * 100;
      const perpChange = ((newPerpPrice - basePerp) / basePerp) * 100;
      
      // Update display prices and changes
      const newPrices = { spot: newSpotPrice, perp: newPerpPrice };
      setCurrentPrice(newPrices);
      lastPriceRef.current = newPrices;
      setPriceChange({ spot: spotChange, perp: perpChange });
      
      // Call price update callback
      onPriceUpdate(newSpotPrice, newPerpPrice);

      // Update chart data with new point
      setChartData(prev => {
        const newPoint: ChartData = {
          timestamp: Date.now(),
          spotPrice: newSpotPrice,
          perpPrice: newPerpPrice,
          volume: Math.random() * 1000,
        };
        
        return [...prev.slice(-99), newPoint]; // Keep last 100 points
      });
    }, 2000); // Update every 2 seconds

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          setupWebSocket();
        }
      }, 3000);
    };
  };

  // Simple canvas chart renderer
  const renderChart = () => {
    const canvas = chartCanvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match display size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    
    ctx.clearRect(0, 0, width, height);

    // Calculate price range with some padding
    const prices = chartData.flatMap(d => [d.spotPrice, d.perpPrice]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const paddedMin = minPrice - priceRange * 0.05;
    const paddedMax = maxPrice + priceRange * 0.05;
    const paddedRange = paddedMax - paddedMin;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Helper function to get chart coordinates
    const getChartX = (index: number) => (width / Math.max(chartData.length - 1, 1)) * index;
    const getChartY = (price: number) => height - ((price - paddedMin) / paddedRange) * height;

    // Draw spot price line
    if (chartData.length > 1) {
      ctx.strokeStyle = '#10b981'; // green
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      chartData.forEach((point, index) => {
        const x = getChartX(index);
        const y = getChartY(point.spotPrice);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw perp price line
    if (chartData.length > 1) {
      ctx.strokeStyle = '#3b82f6'; // blue
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      chartData.forEach((point, index) => {
        const x = getChartX(index);
        const y = getChartY(point.perpPrice);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw current price indicators
    if (chartData.length > 0) {
      const lastPoint = chartData[chartData.length - 1];
      const lastX = getChartX(chartData.length - 1);
      
      // Spot price dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(lastX, getChartY(lastPoint.spotPrice), 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Perp price dot
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(lastX, getChartY(lastPoint.perpPrice), 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  useEffect(() => {
    fetchChartData(activeTimeframe);
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [activeTimeframe]);

  useEffect(() => {
    renderChart();
  }, [chartData]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      renderChart();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartData]);

  return (
    <Card className="trading-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>BTC/USDT Live Chart</span>
          </CardTitle>
          
          {/* Price Display */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-400 border-green-400">
                Spot
              </Badge>
              <span className="font-mono text-lg font-semibold">
                ${currentPrice.spot.toLocaleString()}
              </span>
              <span className={`text-sm ${priceChange.spot >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange.spot >= 0 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                {priceChange.spot.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Perp
              </Badge>
              <span className="font-mono text-lg font-semibold">
                ${currentPrice.perp.toLocaleString()}
              </span>
              <span className={`text-sm ${priceChange.perp >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange.perp >= 0 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                {priceChange.perp.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Timeframe Selector */}
        <Tabs value={activeTimeframe} onValueChange={setActiveTimeframe} className="mb-4">
          <TabsList className="grid w-full grid-cols-5">
            {timeframes.map((tf) => (
              <TabsTrigger key={tf.value} value={tf.value} className="text-xs">
                {tf.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Chart Canvas */}
        <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-muted/20 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <canvas
              ref={chartCanvasRef}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            />
          )}
          
          {/* Chart Legend */}
          <div className="absolute top-2 left-2 flex space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-green-400"></div>
              <span>Spot</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-blue-400"></div>
              <span>Perp</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingChart;