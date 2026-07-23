/**
 * Desenha um frame placeholder de uma viatura a rodar 360º.
 *
 * Não é arte final — é uma prova visual de que a sequência está a ser
 * controlada pelo scroll. A largura do "carro" é modelada por |cos(ângulo)|
 * para simular a foreshortening da rotação, e um farol/realce percorre a
 * carroçaria conforme o ângulo. Quando os frames reais entrarem, este ficheiro
 * deixa de ser chamado.
 */
export function drawPlaceholderFrame(
  ctx: CanvasRenderingContext2D,
  index: number,
  count: number,
  width: number,
  height: number,
  accent = "#E8B15A",
): void {
  const cx = width / 2;
  const cy = height / 2;
  const angle = (index / count) * Math.PI * 2;
  const facing = Math.cos(angle); // -1..1 → traseira..frente
  const foreshorten = 0.5 + 0.5 * Math.abs(facing);

  ctx.clearRect(0, 0, width, height);

  // Fundo radial subtil.
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.7);
  bg.addColorStop(0, "#141416");
  bg.addColorStop(1, "#0A0A0A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const base = Math.min(width, height);
  const carW = base * 0.62 * foreshorten;
  const carH = base * 0.2;
  const groundY = cy + carH * 0.9;

  // Sombra/reflexo no chão.
  ctx.save();
  ctx.translate(cx, groundY);
  ctx.scale(1, 0.16);
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, carW * 0.6);
  shadow.addColorStop(0, "rgba(0,0,0,0.55)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, carW * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Carroçaria.
  ctx.save();
  ctx.translate(cx, cy);
  const bodyGrad = ctx.createLinearGradient(0, -carH, 0, carH);
  bodyGrad.addColorStop(0, "#3a3a3f");
  bodyGrad.addColorStop(1, "#1a1a1d");
  ctx.fillStyle = bodyGrad;
  roundedRect(ctx, -carW / 2, -carH / 2, carW, carH, carH * 0.35);
  ctx.fill();

  // Tejadilho/cabine.
  ctx.fillStyle = "#232327";
  roundedRect(ctx, -carW * 0.26, -carH * 0.95, carW * 0.52, carH * 0.6, carH * 0.3);
  ctx.fill();

  // Vidros.
  ctx.fillStyle = "#0c0c0e";
  roundedRect(ctx, -carW * 0.22, -carH * 0.82, carW * 0.44, carH * 0.42, carH * 0.22);
  ctx.fill();

  // Realce/farol que percorre a carroçaria conforme o ângulo.
  const hx = facing * (carW * 0.42);
  const light = ctx.createRadialGradient(hx, 0, 0, hx, 0, carW * 0.3);
  light.addColorStop(0, hexToRgba(accent, 0.5));
  light.addColorStop(1, hexToRgba(accent, 0));
  ctx.fillStyle = light;
  roundedRect(ctx, -carW / 2, -carH / 2, carW, carH, carH * 0.35);
  ctx.fill();

  // Linha de acento.
  ctx.strokeStyle = hexToRgba(accent, 0.8);
  ctx.lineWidth = Math.max(1, base * 0.004);
  ctx.beginPath();
  ctx.moveTo(-carW / 2, carH * 0.1);
  ctx.lineTo(carW / 2, carH * 0.1);
  ctx.stroke();

  // Rodas (mais separadas quando vemos o perfil).
  const wheelR = carH * 0.42;
  const wheelSpread = carW * 0.34;
  drawWheel(ctx, -wheelSpread, carH * 0.55, wheelR * (0.6 + 0.4 * (1 - Math.abs(facing))));
  drawWheel(ctx, wheelSpread, carH * 0.55, wheelR * (0.6 + 0.4 * (1 - Math.abs(facing))));
  ctx.restore();

  // Contador de frame + ângulo (guia de desenvolvimento).
  ctx.fillStyle = "rgba(245,245,244,0.35)";
  ctx.font = `500 ${Math.round(base * 0.028)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  const deg = Math.round((index / count) * 360);
  ctx.fillText(`FRAME ${index + 1} / ${count} · ${deg}°`, cx, height - base * 0.06);
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b2b2f";
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.5, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.substring(0, 2), 16);
  const g = parseInt(v.substring(2, 4), 16);
  const b = parseInt(v.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
