/// <reference types="react/canary" />
"use client";

import * as React from "react";
import type { ViewTransitionProps } from "react";

/**
 * `<ViewTransition>` do React (canal experimental, ligado com
 * `experimental.viewTransition` no next.config). Ainda é exportado como
 * `unstable_ViewTransition`; este wrapper dá-lhe tipos e, se algum dia não
 * existir (flag desligada), passa os filhos tal como estão — o site continua a
 * funcionar, só sem animação de página.
 */
const Impl = (
  React as unknown as {
    unstable_ViewTransition?: React.ComponentType<ViewTransitionProps>;
  }
).unstable_ViewTransition;

export function ViewTransition(props: ViewTransitionProps) {
  if (!Impl) return <>{props.children}</>;
  return <Impl {...props} />;
}
