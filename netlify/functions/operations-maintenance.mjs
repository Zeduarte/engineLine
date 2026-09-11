/** Netlify runs this only on the published deployment, never on branch previews. */
export default async () => {
  const origin = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.MAINTENANCE_SECRET;
  if (!origin || !secret) throw new Error("Configure MAINTENANCE_SECRET e o URL do site.");
  const response = await fetch(new URL("/api/maintenance", origin), {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(25000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Manutenção falhou: HTTP ${response.status}`);
};
export const config = { schedule: "* * * * *" };
