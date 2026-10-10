"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * `next/image` que entra com fade quando a foto acaba de carregar, em vez de
 * "pintar" aos bocados. O estado escondido só existe sob `.js-anim` (ver
 * globals.css): sem JS ou com reduced-motion a imagem aparece logo.
 *
 * Dica: dar `key={src}` ao trocar de foto, para o fade repetir.
 */
export function FadeImage({ alt, className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      {...props}
      alt={alt}
      data-loaded={loaded}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={`img-fade ${className ?? ""}`}
    />
  );
}
