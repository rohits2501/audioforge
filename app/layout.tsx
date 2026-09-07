import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Script → Episode Engine",
  description: "Upload a script → get a production-ready multi-character audio episode.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
