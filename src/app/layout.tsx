import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/600.css";
import "./globals.css";
import { LangProvider } from "@/i18n";
import { Nav, Footer } from "@/components/chrome";

export const metadata: Metadata = {
  metadataBase: new URL("https://drugprices.canada.nshipyard.com"),
  title: "What does one drug cost in the US vs Canada? | Open Nshipyard",
  description:
    "The same active drug sells at two prices on two sides of the border: 500 high-spending Medicare Part D drugs, 194 matched against Canadian price references so far.",
  openGraph: {
    title: "What does one drug cost in the US vs Canada? | Open Nshipyard",
    description:
      "The same active drug sells at two prices on two sides of the border: 500 high-spending Medicare Part D drugs, 194 matched against Canadian price references so far.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "What does one drug cost in the US vs Canada? | Open Nshipyard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "What does one drug cost in the US vs Canada? | Open Nshipyard",
    description:
      "The same active drug sells at two prices on two sides of the border: 500 high-spending Medicare Part D drugs, 194 matched against Canadian price references so far.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LangProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
