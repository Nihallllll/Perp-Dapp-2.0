# 🌀 Perp‑Dapp‑2.0

**Perp‑Dapp‑2.0** is a minimalistic perpetual futures trading dApp built with **Foundry**, **Ethereum / USDC mock token**, and a modern **React + WAGMI / VIEM frontend**.

Deploy and interact with a simple on‑chain system that lets users:

* Open leveraged long or short positions
* Add / remove margin
* Close positions and settle **PnL** through a mock USDC token
* Get automatic USDC token funding for seamless testing

---

## 🚀 Features

* **Smart contracts** (Solidity + Foundry):

  * `USDC.sol` – simple ERC‑20 with controlled minting by the Perp contract
  * `Perp.sol` – manages margin, leverage, positions, and payout logic
* **Frontend (React)** using:

  * **WAGMI v2 + VIEM** for wallet connection and contract interactions
  * Live Binance price polling to set entry price
  * Clean UI: open/close long & short positions with streamlined feedback

---

## 🧪 Quick Start

### 0. Prerequisites

* Node.js v18+
* Git, npm or yarn

### 1. Clone the repo

```bash
git clone https://github.com/Nihallllll/Perp-Dapp-2.0.git
cd Perp-Dapp-2.0
```

### 2. Install dependencies

```bash
cd frontend
npm install
```

### 3. Compile & deploy contracts

```bash
cd ../contracts
forge build
forge test            # ensure everything compiles & passes
forge deploy --rpc-url <your‑rpc‑url> --private-key <key>
```

After deployment, copy the deployed USDC & Perp contract addresses into:

```
frontend/.env
REACT_APP_PERP_ADDRESS=<deployed perp address>
REACT_APP_USDC_ADDRESS=<deployed USDC address>
```

### 4. Run frontend

```bash
cd ../frontend
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to trade perpetuals with mock USDC.

---

## 🔧 Fund the dApp for Demonstration

By default, only the **Perp** contract can mint USDC to users. For a seamless showcase:

1. After deploying, run:

```solidity
usdc.setPerp(perpAddress);  // assign Perp contract as USDC minter
```

2. When users open/close positions, they’ll receive mock USDC instantly to rabbit start trading.

---

## 📂 Project Structure

```
.
├── contracts/        # Solidity contracts + Forge setup
│   ├── USDC.sol
│   └── Perp.sol
├── frontend/         # React + Typescript UI
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   ├── .env           # Add deployed contract addresses and RPC
│   └── package.json
├── foundry.toml      # Foundry config
└── README.md
```

---

## 🤝 Contributing

* Open issues or PRs for feature suggestions, bug fixes, or UX improvements
* Add margin management, UI charts, or support non‑EVM chains
* Check `forge test` and `npm test` before submitting

---

## ⚖️ License

This project is open‑source under the **MIT License**, unless otherwise specified.

---

## 📬 Author

This project is maintained by **\[Nihal L]**, showcasing a lean perpetual DApp — perfect for demo, learning, or onboarding into full‑stack Ethereum dev.
