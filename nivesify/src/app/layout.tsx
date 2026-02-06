import "./globals.css";
import Header from "@/components/Header";

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
      <body className="bg-[#FCFDFD] text-[#1F2937] antialiased">
        <Header />
        {/* ADDED: pt-20 pushes content down so Header doesn't hide it */}
        <div className="min-h-screen pt-20">
          {children}
        </div>
      </body>
    </html>
  );
}