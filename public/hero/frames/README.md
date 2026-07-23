# Frames da sequência 360º do hero

Coloque aqui os ~90 frames de uma volta completa da viatura em destaque:

```
car_0001.webp
car_0002.webp
...
car_0090.webp
```

Depois, em `src/components/hero/frames.ts`:

1. `USE_PROCEDURAL_PLACEHOLDER = false`
2. Ajuste `FRAME_COUNT` se não forem 90.
3. Ajuste `framePath()` se a nomenclatura for diferente.

Recomendações:
- Formato `.webp` (bom rácio qualidade/peso), ~1600px de largura.
- Fundo consistente (preto #0A0A0A ou transparente).
- Enquadramento e distância idênticos entre frames para uma rotação estável.
- Exportar a partir de um render 3D ou de um turntable fotográfico.

Enquanto esta pasta não tiver frames, o hero desenha um placeholder procedural
que roda — o efeito é visível e testável sem qualquer asset binário.
