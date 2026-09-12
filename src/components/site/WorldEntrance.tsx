"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { asset } from "@/lib/asset";
import styles from "./WorldEntrance.module.css";

/** Demonstration selector: memory only, so every full reload shows it again. */
export function WorldEntrance({ name }: { name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [entered, setEntered] = useState(false);
  const router = useRouter();
  const [leaving, setLeaving] = useState<string | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exiting = useRef(false);

  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  function move(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    event.currentTarget.style.setProperty("--pan-x", `${(x - .5) * 22}px`);
    event.currentTarget.style.setProperty("--pan-y", `${(y - .5) * 16}px`);
    event.currentTarget.style.setProperty("--light-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--light-y", `${y * 100}%`);
  }

  function reset(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.setProperty("--pan-x", "0px");
    event.currentTarget.style.setProperty("--pan-y", "0px");
  }

  function letters(word: string) {
    return [...word].map((letter, index) => (
      <span key={index} style={{ "--letter": index } as CSSProperties}>{letter}</span>
    ));
  }

  useEffect(() => {
    if (entered) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      element?.close();
      document.documentElement.style.overflow = previous;
    };
  }, [entered]);

  function enter(choice = "A tua próxima viagem") {
    if (exiting.current) return;
    exiting.current = true;
    const finish = () => {
      dialog.current?.close();
      setEntered(true);
      router.push("/");
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setLeaving(choice);
    exitTimer.current = setTimeout(finish, 1500);
  }

  if (entered) return null;

  return (
    <dialog ref={dialog} className={styles.entrance} data-leaving={leaving ? "true" : undefined} aria-labelledby="world-title"
      data-lenis-prevent onCancel={(event) => { event.preventDefault(); enter(); }}>
      <header className={styles.header}>
        <span className={styles.brand}>{name}<span className={styles.brandDot}>.</span></span>
        <span className={styles.edition}>DUAS FORMAS DE SENTIR A ESTRADA</span>
        <button className={styles.skip} onClick={() => enter()}>Entrar no site <span aria-hidden>↗</span></button>
      </header>

      <div className={styles.heading}>
        <p>O DESTINO É TEU.</p>
        <h1 id="world-title">Escolhe a tua <em>liberdade.</em></h1>
      </div>

      <div className={styles.worlds}>
        <span className={styles.opening} aria-hidden />
        <button className={`${styles.world} ${styles.moto}`} onPointerMove={move} onPointerLeave={reset} onClick={() => enter("Liberdade sobre duas rodas")} aria-label="Escolher motas e entrar no site">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/entrance/motorcycle.jpg")} alt="" fetchPriority="high" className={styles.photo} />
          <span className={styles.shade} />
          <span className={styles.light} aria-hidden />
          <span className={styles.speedLines} aria-hidden><i /><i /><i /></span>
          <span className={styles.number} aria-hidden>01 / TWO WHEELS</span>
          <span className={styles.copy}>
            <span className={styles.kicker}>INSTINTO SEM FILTROS</span>
            <span className={styles.title}>{letters("MOTAS")}<span className={styles.dot}>.</span></span>
            <span className={styles.description}>Menos limites. Mais estrada.</span>
            <span className={styles.cta}>Explorar motas <span className={styles.arrow} aria-hidden>↗</span></span>
          </span>
        </button>
        <span className={styles.divider} aria-hidden><span>&</span></span>
        <button className={`${styles.world} ${styles.car}`} onPointerMove={move} onPointerLeave={reset} onClick={() => enter("Paixão em quatro rodas")} aria-label="Escolher carros e entrar no site">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/hero/porse.jpeg")} alt="" fetchPriority="high" className={styles.photo} />
          <span className={styles.shade} />
          <span className={styles.light} aria-hidden />
          <span className={styles.speedLines} aria-hidden><i /><i /><i /></span>
          <span className={styles.number} aria-hidden>02 / FOUR WHEELS</span>
          <span className={styles.copy}>
            <span className={styles.kicker}>PAIXÃO EM CADA CURVA</span>
            <span className={styles.title}>{letters("CARROS")}<span className={styles.dot}>.</span></span>
            <span className={styles.description}>A tua próxima grande viagem.</span>
            <span className={styles.cta}>Explorar carros <span className={styles.arrow} aria-hidden>↗</span></span>
          </span>
        </button>
      </div>
      {leaving && <div className={styles.departure} role="status">
        <span className={styles.departureLine} />
        <p>VAMOS A ISSO.</p><strong>{leaving}<span>.</span></strong>
        <span className={styles.departureArrow} aria-hidden>↗</span>
      </div>}
      <footer className={styles.footer}><span>UMA PAIXÃO. DOIS UNIVERSOS.</span><span>O próximo capítulo começa aqui <span aria-hidden>↗</span></span></footer>
    </dialog>
  );
}
