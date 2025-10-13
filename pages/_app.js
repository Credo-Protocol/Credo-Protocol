import "@/styles/globals.css";
import Head from "next/head";
import { Inter } from "next/font/google";

// Configure Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Credo Protocol - Decentralized Trust for Capital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={`${inter.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
