import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "@/theme/ThemeRegistry";
import AuthContextProvider from "@/contexts/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Handyman",
  description: "Connect with trusted professionals for home services.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={plusJakartaSans.className}>
      <body>
        <ThemeRegistry>
          <AuthContextProvider>
            {children}
          </AuthContextProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
