
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainId, useSwitchChain, useBalance, useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wallet } from 'lucide-react';

const Header = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: '0x0000000000000000000000000000000000000000' as `0x${string}`, // USDC contract address - update with actual address
  });

  const isUnsupportedChain = chainId && ![1, 5, 11155111].includes(chainId); // Mainnet, Goerli, Sepolia

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-primary">
            Punctual-perpetual
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            Terminal
          </Badge>
        </div>

        {/* Network Warning */}
        {isUnsupportedChain && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive hidden sm:inline">
              Unsupported Network
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => switchChain?.({ chainId: 5 })} // Switch to Goerli
              className="ml-2"
            >
              Switch to Goerli
            </Button>
          </div>
        )}

        {/* Wallet Section */}
        <div className="flex items-center space-x-4">
          {isConnected && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-md">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {balance ? `${parseFloat(balance.formatted).toFixed(2)} USDC` : '0.00 USDC'}
              </span>
            </div>
          )}
          
          <ConnectButton
            chainStatus="icon"
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
