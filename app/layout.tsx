import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Wirral Garden Co. | Thoughtful gardens, locally grown",
  description:
    "Tell Wirral Garden Co. about your garden project. A fictional landscaping business and working lead management demo.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
