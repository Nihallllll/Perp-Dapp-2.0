
import React, { useState } from 'react';
import Header from '@/components/Header';
import TradingChart from '@/components/TradingChart';
import TradeForm from '@/components/TradeForm';
import PositionSummary from '@/components/PositionSummary';
import { WagmiProvider } from '@/components/providers/WagmiProvider';

const Index = () => {
  const [currentPrices, setCurrentPrices] = useState({ spot: 0, perp: 0 });

  const handlePriceUpdate = (spotPrice: number, perpPrice: number) => {
    setCurrentPrices({ spot: spotPrice, perp: perpPrice });
  };

  return (
    <WagmiProvider >
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Main Trading Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              <TradingChart onPriceUpdate={handlePriceUpdate} />
            </div>
            
            {/* Trading Panel - 1 column on large screens */}
            <div className="space-y-6">
              <TradeForm 
                spotPrice={currentPrices.spot} 
                perpPrice={currentPrices.perp} 
              />
              
              <PositionSummary 
                currentPrice={currentPrices.perp} 
              />
            </div>
          </div>

          {/* Additional Info Panel - Full width on mobile, side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Market Stats */}
            <div className="trading-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                Market Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">24h Volume</span>
                  <span className="font-mono">$2.4B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open Interest</span>
                  <span className="font-mono">$850M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funding Rate</span>
                  <span className="font-mono text-green-400">0.01%</span>
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="trading-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                Recent Trades
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { price: 45234, size: 0.5, type: 'buy' },
                  { price: 45231, size: 1.2, type: 'sell' },
                  { price: 45235, size: 0.8, type: 'buy' },
                  { price: 45230, size: 2.1, type: 'sell' },
                ].map((trade, index) => (
                  <div key={index} className="flex justify-between">
                    <span className={trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                      ${trade.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {trade.size} BTC
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="trading-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-green-400">Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-mono">12ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Update</span>
                  <span className="font-mono">Now</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </WagmiProvider>
  );
};

export default Index;
