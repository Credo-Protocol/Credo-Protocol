import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Credo Protocol - Decentralized Trust for Capital. Identity-based lending on Moca Chain." />
        <meta name="keywords" content="Credo Protocol, DeFi, Moca Chain, Lending, Credit Score, Web3" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
