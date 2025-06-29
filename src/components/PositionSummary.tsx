import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { Wallet, TrendingUp, TrendingDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { Perpabi } from '@/abi/abi'
import { sepolia } from 'viem/chains'

interface PositionSummaryProps {
  currentPrice: number
}

type Position = {
  entryPrice: bigint;
  margin: bigint;
  leverage: number;
  timestamp: bigint;
  size: bigint;
  isLong: boolean;
  quantity: bigint;
};

const PositionSummary: React.FC<PositionSummaryProps> = ({ currentPrice }) => {
  const [pnl, setPnl] = useState(0)
  const [pnlPercentage, setPnlPercentage] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const [latestPrice, setLatestPrice] = useState<number | null>(null)
  const { address, isConnected } = useAccount()
  const { writeContract } = useWriteContract()
 
  const { data, refetch } = useReadContract({
    address: "0xFD5091a4c78849904F939b8d11fB36Bc62e9E2ae",
    abi: Perpabi,
    functionName: "getUserPosition",
    args: address ? [address] : undefined,
    // enabled: !!address && isConnected,
  });

  // Fetch latest price from Binance every 5 seconds
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
        );
        const data = await res.json();
        setLatestPrice(Number(data.price));
      } catch (err) {
        console.error("Failed to fetch price:", err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isConnected || !address) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 5000); // every 5s
    return () => clearInterval(interval);
  }, [refetch, isConnected, address]);

  let position: Position | null = null;

  if (Array.isArray(data) && data.length === 7) {
    position = {
      entryPrice: BigInt(data[0]),
      margin: BigInt(data[3]),
      leverage: Number(data[1]),
      timestamp: BigInt(data[2]), 
      size: BigInt(data[4]),
      isLong: Boolean(data[5]),
      quantity: BigInt(data[6]),
    };
  }
  setTimeout(()=>{
   const currentPosition  = latestPrice - Number(position.entryPrice); 
   setPnl(currentPosition);
  },1000)
  // Calculate PnL when position and currentPrice change
  useEffect(() => {
    if (position && currentPrice > 0) {
      // Convert BigInt values with proper decimal handling
      const entryPriceNum = Number(position.entryPrice) / 1e18;
      const sizeNum = Number(position.size) / 1e18;
      const marginNum = Number(position.margin) / 1e18;
      
      console.log("PnL Calculation:", {
        entryPrice: entryPriceNum,
        currentPrice,
        size: sizeNum,
        margin: marginNum,
        isLong: position.isLong
      });
      
      let pnlValue = 0;
      if (position.isLong) {
        pnlValue = ((currentPrice - entryPriceNum) / entryPriceNum) * sizeNum;
      } else {
        pnlValue = ((entryPriceNum - currentPrice) / entryPriceNum) * sizeNum;
      }
      
      const pnlPercent = marginNum > 0 ? (pnlValue / marginNum) * 100 : 0;
      
      setPnl(pnlValue);
      setPnlPercentage(pnlPercent);
    }
  }, [position, currentPrice]);

  const handleClosePosition = async () => {
    // Validation checks
    if (!latestPrice) {
      toast.error("Price not available. Please wait...");
      return;
    }

    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    if (!position || position.size === BigInt(0)) {
      toast.error("No active position to close");
      return;
    }

    setIsClosing(true);
    try {
      console.log("Closing position with price:", latestPrice);
      
      const result = await writeContract({
        address: "0xFD5091a4c78849904F939b8d11fB36Bc62e9E2ae",
        abi: Perpabi,
        functionName: "closePosition",
        args: [
          BigInt(Math.floor(latestPrice * 1e8)), // price scaled for 8 decimals
        ],
        chain: sepolia,
        account: address,
      });

      console.log("Transaction result:", result);
      toast.success("Position close transaction sent!");
      
      // Refresh position data after a short delay
      setTimeout(() => {
        refetch();
      }, 2000);
      
    } catch (error: any) {
      console.error("Failed to close position:", error);
      
      // Handle specific error types
      if (error?.cause?.code === 4001) {
        toast.error("Transaction rejected by user");
      } else if (error?.message?.includes("insufficient")) {
        toast.error("Insufficient funds for gas");
      } else if (error?.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(`Failed to close position: ${error?.message || "Unknown error"}`);
      }
    } finally {
      setIsClosing(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp * 1000; // Convert to milliseconds
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return hours > 0 ? `${hours}h ${minutes}m ago` : `${minutes}m ago`
  }

  const formatBigIntToPrice = (value: bigint, decimals: number = 18) => {
    try {
      // Handle zero values
      if (value === BigInt(0)) return "0.00";
      
      // Convert BigInt to string to avoid precision loss
      const valueStr = value.toString();
      const divisor = Math.pow(10, decimals);
      const result = Number(valueStr) / divisor;
      
      // Check if result is valid
      if (isNaN(result) || !isFinite(result)) return "0.00";
      
      return result.toFixed(2);
    } catch (error) {
      console.error("Error formatting BigInt:", error, value);
      return "0.00";
    }
  }

  if (!isConnected) {
    return (
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Position</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-muted-foreground">Connect wallet to view positions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!position || position.size === BigInt(0)) {
    return (
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Position</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-muted-foreground">No active positions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="trading-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Active Position</span>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Badge 
              variant={position.isLong ? "default" : "destructive"} 
              className={position.isLong ? "bg-green-500" : "bg-red-500"}
            >
              {position.isLong ? "LONG" : "SHORT"}
            </Badge>
            <Badge variant="outline">{position.leverage}x</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Position Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Entry Price</p>
            <p className="font-mono font-semibold">
              ${Number(position.entryPrice)/1e8}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Price</p>
            <p className="font-mono font-semibold">
              ${currentPrice.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Size</p>
            <p className="font-mono font-semibold">
              ${Number(position.size)/1e18}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Margin</p>
            <p className="font-mono font-semibold">
              ${Number(position.margin)/1e18}
            </p>
          </div>
        </div>

        {/* PnL Display */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Unrealized PnL</span>
            <span className="text-xs text-muted-foreground">
              Opened {formatTime(Number(position.timestamp))}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {pnl >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
            <div className="flex-1">
              <div className={`text-xl font-bold font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pnl}
              </div>
              <div className={`text-sm font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <Button 
          onClick={handleClosePosition} 
          disabled={isClosing || !latestPrice || !position} 
          variant="destructive" 
          className="w-full h-12"
        >
          {isClosing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <>
              <X className="h-4 w-4 mr-2" />
              Close Position
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default PositionSummary