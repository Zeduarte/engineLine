import "server-only";
import QRCode from "qrcode";

/** Gera um QR code como data URL (PNG) para embutir num <img>. */
export async function qrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 240,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
  } catch {
    return "";
  }
}
