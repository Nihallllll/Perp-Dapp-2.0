
import React from 'react';
import { WagmiProvider as WagmiProviderCore, createConfig, http, injected } from 'wagmi';
import { mainnet, goerli, sepolia } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

export const config = createConfig({
  // chains: [sepolia],
  // connectors: [
  //   injected(),
  // ],
  // transports: {
  //   [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/ykmlhC0B4H137VurA9aPk"),
  // },
   chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

interface WagmiProviderProps {
  children: React.ReactNode;
}

export const WagmiProvider: React.FC<WagmiProviderProps> = ({ children }) => {
  return (
    <WagmiProviderCore config={config}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiProviderCore>
  );
};
