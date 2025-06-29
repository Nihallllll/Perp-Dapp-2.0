import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAccount, useBalance, useWriteContract } from "wagmi";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";
// wagmi v2+
import { config } from "./providers/WagmiProvider";
import { toast } from "sonner";
import { Perpabi } from "../abi/abi";
import { writeContract } from "wagmi/actions";
import { createWalletClient, custom, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { type UseWriteContractParameters } from "wagmi";

type Position = {
  entryPrice: bigint;
  margin: bigint;
  leverage: number;
  timestamp: bigint;
  size: bigint;
  isLong: boolean;
  quantity: bigint;
};

interface TradeFormProps {
  spotPrice: number;
  perpPrice: number;
}

const TradeForm: React.FC<TradeFormProps> = ({ spotPrice, perpPrice }) => {
  const [margin, setMargin] = useState("");
  const [leverage, setLeverage] = useState([1]);
  const [isOpeningLong, setIsOpeningLong] = useState(false);
  const [isOpeningShort, setIsOpeningShort] = useState(false);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  const { data: usdcBalance } = useBalance({
    address,
    token: "0x0000000000000000000000000000000000000000" as `0x${string}`, // USDC contract address - update with actual address
  });

  // 🔁 Fetch latest price from Binance every 5 seconds
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
    const interval = setInterval(fetchPrice, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  const handleOpenLong = async () => {
    if (!latestPrice || !address) {
      toast.error("Price not available or wallet not connected");
      return;
    }

    setIsOpeningLong(true);
    
    try {
      writeContract({
        abi: Perpabi,
        address: "0xFD5091a4c78849904F939b8d11fB36Bc62e9E2ae",
        functionName: "openPosition",
        args: [
           // 1000 USDC margin
          BigInt(leverage[0]), // 5x leverage
          true, // isLong
          BigInt(Number(latestPrice) * 1e8), // price scaled for 8 decimals
        ],
        chain: sepolia,
        account: address,
        value :parseEther(margin)
      });
      
      toast.success("Long position opened successfully!");
      setMargin("");
      setLeverage([1]);
      
    } catch (error) {
      toast.error("Failed to open long position");
      console.error("Transaction failed:", error);
    } finally {
      setIsOpeningLong(false);
    }
  };

  const handleOpenShort = async () => {
     if (!latestPrice || !address) {
      toast.error("Price not available or wallet not connected");
      return;
    }

    setIsOpeningLong(true);
    
    try {
      writeContract({
        abi: Perpabi,
        address: "0xFD5091a4c78849904F939b8d11fB36Bc62e9E2ae",
        functionName: "openPosition",
        args: [
           // 1000 USDC margin
          BigInt(leverage[0]), // 5x leverage
          false, // isLong
          BigInt(Number(latestPrice) * 1e8), // price scaled for 8 decimals
        ],
        chain: sepolia,
        account: address,
        value : parseEther(margin)
      });
      
      toast.success("Short position opened successfully!");
      setMargin("");
      setLeverage([1]);
      
    } catch (error) {
      toast.error("Failed to open long position");
      console.error("Transaction failed:", error);
    } finally {
      setIsOpeningLong(false);
    }
  };

  const maxMargin = usdcBalance ? parseFloat(usdcBalance.formatted) : 0;
  const positionSize = margin ? parseFloat(margin) * leverage[0] : 0;
  const isFormValid =
    isConnected &&
    margin &&
    parseFloat(margin) > 0 &&
    leverage[0] > 0 &&
    perpPrice > 0;

  const handleMaxMargin = () => {
    if (maxMargin > 0) {
      setMargin(maxMargin.toFixed(2));
    }
  };

  return (
    <div className="space-y-4">
      {/* Trading Form */}
      <Card className="trading-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Open Position</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isConnected && (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground">
                Connect your wallet to start trading
              </p>
            </div>
          )}

          {/* Margin Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="margin">Margin (USDC)</Label>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>Balance: {maxMargin.toFixed(2)} USDC</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMaxMargin}
                  disabled={!isConnected || maxMargin === 0}
                  className="h-6 px-2 text-xs"
                >
                  MAX
                </Button>
              </div>
            </div>
            <Input
              id="margin"
              type="number"
              placeholder="0.00"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              disabled={!isConnected}
              className="trading-input"
            />
          </div>

          {/* Leverage Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Leverage</Label>
              <Badge variant="outline" className="font-mono">
                {leverage[0]}x
              </Badge>
            </div>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              max={10}
              min={1}
              step={1}
              disabled={!isConnected}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1x</span>
              <span>5x</span>
              <span>10x</span>
            </div>
          </div>

          {/* Position Info */}
          {margin && (
            <div className="p-3 bg-muted/30 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Position Size:</span>
                <span className="font-mono">
                  ${positionSize.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Entry Price:</span>
                <span className="font-mono">${perpPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Liquidation Price:</span>
                <span className="font-mono text-red-400">
                  ${(perpPrice * (1 - 0.8 / leverage[0])).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Trade Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleOpenLong}
              disabled={!isFormValid || isOpeningLong}
              className="btn-long h-12"
            >
              {isOpeningLong ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Long
                </>
              )}
            </Button>

            <Button
              onClick={handleOpenShort}
              disabled={!isFormValid || isOpeningShort}
              className="btn-short h-12"
            >
              {isOpeningShort ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Short
                </>
              )}
            </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeForm;