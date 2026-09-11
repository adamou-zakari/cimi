import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

// Bricolage Grotesque pour l'affichage : une grotesque a caractere,
// avec des dimensions optiques variables. Inter pour le corps.
const titre = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--police-titre",
  display: "swap",
});

const corps = Inter({
  subsets: ["latin"],
  variable: "--police-corps",
  display: "swap",
});

export const metadata = {
  title: "Cimi - verificateur vocal",
  description:
    "Dites ce que vous avez entendu. Cimi cherche les sources et vous montre ce qu'elles disent. Francais et hausa.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${titre.variable} ${corps.variable}`}>
      <body>{children}</body>
    </html>
  );
}
