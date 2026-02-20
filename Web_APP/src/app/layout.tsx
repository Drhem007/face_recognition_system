import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import { Toaster } from 'react-hot-toast';

const poppins = Poppins({ 
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  title: "Exam Room Device Control | Ecole Polytechnique d'Agadir",
  description: "Admin application to control exam room devices for Ecole Polytechnique d'Agadir",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AuthProvider>
          <DeviceProvider>
            <AttendanceProvider>
              {children}
              <Toaster position="top-right" />
            </AttendanceProvider>
          </DeviceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
