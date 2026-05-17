"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { STATUS, type CallBackProps, type Step } from "react-joyride";

// react-joyride uses window during module init, dynamic import keeps SSR safe.
const JoyrideClient = dynamic(() => import("react-joyride"), { ssr: false });

const STORAGE_KEY = "huan-welcome-tour-v1";

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Bem-vindo!",
    content: "Bora dar uma volta rápida? Em 5 passos te mostro como aproveitar tudo por aqui.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="search"]',
    placement: "bottom",
    title: "Pergunta pro Huan",
    content: "Toque aqui pra abrir uma conversa, escreve o que você procura e eu te respondo com lugares, restaurantes e cupons.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="huan"]',
    placement: "top",
    title: "Esse aqui sou eu",
    content: "Esse botão amarelo é o atalho pra me chamar de qualquer página. Tô sempre disponível.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="favorites"]',
    placement: "top",
    title: "Seus favoritos",
    content: "Tudo que você curtir nos cards aparece aqui pra você revisitar depois.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile"]',
    placement: "top",
    title: "Seu perfil",
    content: "Suas viagens, cupons e configurações da conta ficam aqui dentro.",
    disableBeacon: true,
  },
];

/**
 * Spotlight welcome tour using react-joyride. Triggers once per device for
 * authenticated users. Admin /admin/tour page can force/reset the flag.
 */
export function WelcomeTour() {
  const auth = useAuth();
  const viewer = useQuery(api.users.viewer);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    if (viewer === undefined) return;
    if (!viewer) return;
    let flag: string | null = null;
    try {
      flag = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (flag === "done") return;
    // Wait so target elements (BottomNav, hero) are mounted + painted.
    const t = window.setTimeout(() => setRun(true), 900);
    return () => window.clearTimeout(t);
  }, [auth.isAuthenticated, viewer]);

  function handleCallback(data: CallBackProps) {
    const ended: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (ended.includes(data.status)) {
      try {
        // Keep "force" mode (admin debug); otherwise mark done.
        if (localStorage.getItem(STORAGE_KEY) !== "force") {
          localStorage.setItem(STORAGE_KEY, "done");
        }
      } catch {
        /* noop */
      }
      setRun(false);
    }
  }

  if (!run) return null;

  return (
    <JoyrideClient
      steps={STEPS}
      run
      continuous
      showSkipButton
      showProgress={false}
      disableScrolling
      callback={handleCallback}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Finalizar",
        next: "Próximo",
        open: "Abrir",
        skip: "Pular tour",
      }}
      styles={{
        options: {
          primaryColor: "#323439",
          textColor: "#323439",
          backgroundColor: "#ffffff",
          arrowColor: "#ffffff",
          overlayColor: "rgba(0, 0, 0, 0.55)",
          spotlightShadow: "0 0 0 4px rgba(249, 253, 23, 0.55)",
          zIndex: 90,
        },
        tooltip: {
          borderRadius: 20,
          padding: 20,
          fontFamily: "var(--font-asap), system-ui, sans-serif",
          fontSize: 14,
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 500,
          marginBottom: 8,
        },
        tooltipContent: {
          lineHeight: 1.55,
          color: "#565a60",
          padding: 0,
        },
        buttonNext: {
          backgroundColor: "#323439",
          borderRadius: 999,
          padding: "10px 22px",
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: "#72777f",
          fontSize: 13,
          fontWeight: 500,
        },
        buttonSkip: {
          color: "#72777f",
          fontSize: 13,
          fontWeight: 500,
        },
        spotlight: {
          borderRadius: 12,
        },
      }}
    />
  );
}
