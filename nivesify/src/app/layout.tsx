import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer"; // Import the Footer

export const metadata = {
  title: "Nivesify — Thoughtful Money, Better Life",
  description: "A calm financial sanctuary for Indian investors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FCFDFD] text-[#1F2937] antialiased flex flex-col min-h-screen">
        {/* Global Header */}
        <Header />

        {/* Page Content 
            pt-20: Adds padding so the fixed header doesn't cover content.
            flex-grow: Pushes the footer to the bottom even on short pages.
        */}
        <main className="pt-20 flex-grow">
          {children}
        </main>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}