# Credo Protocol

**Decentralized Trust for Capital**

Credo Protocol is revolutionizing DeFi lending by creating an identity-backed lending model on Moca Chain. Instead of relying solely on collateral, we assess creditworthiness based on verifiable on-chain and off-chain reputation, enabling undercollateralized loans and fair access to capital.

## Vision

To build the foundational trust layer for the new digital economy, making capital accessible based on merit and reputation, not just existing wealth.

## Key Features

- **Identity-Based Lending**: Borrow based on your reputation, not just collateral
- **Privacy-Preserving**: Leverages Zero-Knowledge Proofs and Verifiable Credentials
- **Seamless UX**: One-click Web3 login via Moca ID using AIR Account Services
- **Transparent Scoring**: On-chain credit scores calculated from verifiable credentials
- **Undercollateralized Loans**: Access capital more efficiently than traditional DeFi

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build

```bash
npm run build
npm start
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Blockchain**: Moca Chain, Solidity Smart Contracts
- **Authentication**: AIR Account Services (Moca ID)
- **Credentials**: AIR Credential Services (Verifiable Credentials)

## Project Structure

```
credoprotocol/
├── pages/          # Next.js pages and API routes
├── styles/         # Global styles
├── lib/            # Utility functions
├── public/         # Static assets
└── components/     # React components (to be added)
```

## Documentation

For complete project documentation, see [PRD.md](./PRD.md).

## Contributing

This project is currently in active development for the Moca Chain Hackathon.

## License

MIT
