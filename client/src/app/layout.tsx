import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "reactflow/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FlowEngine | Visual pipelines that explain themselves",
    template: "%s | FlowEngine"
  },
  description: "Build, validate, and observe real-time data pipelines in one clear workspace.",
  keywords: ["data pipelines", "workflow builder", "ETL", "real-time data"],
  openGraph: {
    title: "FlowEngine | Visual pipelines that explain themselves",
    description: "Build, validate, and observe real-time data pipelines in one clear workspace.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
