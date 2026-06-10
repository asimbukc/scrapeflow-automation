import React from "react";
import "../index.css";
import Providers from "./providers";

export const metadata = {
  title: "FlowScrape",
  description: "A visual web scraping and workflow automation builder with interactive canvas execution.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="bg-black text-zinc-100 overflow-hidden h-full h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
