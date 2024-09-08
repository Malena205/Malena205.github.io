import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Itim as Font } from 'next/font/google'
 
const font = Font({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-custom',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${font.variable} font-sans`}>
      <Component {...pageProps} />
    </div>
  );
}
