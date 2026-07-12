import type { Metadata } from "next";
import type { ReactNode } from "react";
import "reactflow/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowEngine",
  description: "Real-time data pipeline visualizer"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
