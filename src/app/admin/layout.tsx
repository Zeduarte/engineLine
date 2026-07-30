import type { Metadata } from "next";

// O backoffice nunca deve ser indexado.
export const metadata: Metadata = {
  title: "Backoffice",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
