import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "sck.bio: your creator portfolio",
  description: "Build a portfolio brands trust. Get a link like you.sck.bio for your bio.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster position="bottom-center" richColors={false} toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
