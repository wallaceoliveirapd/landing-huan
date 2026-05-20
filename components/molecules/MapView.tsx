"use client";

import { useEffect, useRef, useState } from "react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const MAPBOX_STYLE = "mapbox://styles/uolaci/cmgxmdq9a004v01s536k6ah2b";

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  /** Optional marker label */
  label?: string;
  /** Animate fly-to when coords change */
  animate?: boolean;
  /**
   * Disable all map interaction (pan / pinch zoom / scroll wheel / etc).
   * Default false (map is interactive). Set true for "preview" maps
   * where the user shouldn't be able to drag/zoom.
   */
  staticView?: boolean;
  /**
   * Show the pin marker. Default true. Pass false to render an
   * unmarked overview map (e.g. as the default "Nordeste" background).
   */
  showMarker?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMarkerElement(label?: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "mapbox-marker";
  el.style.cssText = `
    width:44px; height:44px; border-radius:50%;
    background:#323439;
    border:0px solid #fff;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    display:flex; align-items:center; justify-content:center;
    font-size:20px; cursor:pointer;
  `;
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="color:#fff"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
  if (label) {
    const tooltip = document.createElement("div");
    tooltip.style.cssText = `
      position:absolute; bottom:52px; left:50%; transform:translateX(-50%);
      background:#fff; color:#323439; padding:4px 10px; border-radius:99px;
      font-size:12px; font-weight:500; white-space:nowrap;
      font-family:var(--font-display);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    `;
    tooltip.textContent = label;
    el.appendChild(tooltip);
  }
  return el;
}

export function MapView({
  lat,
  lng,
  zoom = 11,
  className = "",
  label,
  animate = true,
  staticView = false,
  showMarker = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mglRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // ── Init map (once) ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    async function init() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mgl: any = (await import("mapbox-gl")).default;
      if (cancelled) return;
      mglRef.current = mgl;
      mgl.accessToken = MAPBOX_TOKEN;

      if (mapRef.current) return;

      const map = new mgl.Map({
        container: containerRef.current!,
        style: MAPBOX_STYLE,
        center: [lng, lat],
        zoom,
        attributionControl: false,
        logoPosition: "bottom-left",
        interactive: !staticView,
      });

      mapRef.current = map;
      map.on("load", () => {
        loadedRef.current = true;
        setMapLoaded(true);
        syncMarker();
      });
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        loadedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync marker presence + label whenever showMarker/label changes ──
  function syncMarker() {
    const map = mapRef.current;
    const mgl = mglRef.current;
    if (!map || !mgl || !loadedRef.current) return;

    if (showMarker) {
      if (markerRef.current) {
        // recreate to apply potentially new label
        markerRef.current.remove();
        markerRef.current = null;
      }
      const el = buildMarkerElement(label);
      markerRef.current = new mgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }

  useEffect(() => {
    syncMarker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMarker, label]);

  // ── Fly to new position when coords change ──────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const method = animate ? "flyTo" : "jumpTo";
    mapRef.current[method]({
      center: [lng, lat],
      zoom,
      duration: 1400,
      essential: true,
    });
    markerRef.current?.setLngLat([lng, lat]);
  }, [lat, lng, zoom, animate]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-2xl overflow-hidden ${className}`}
      style={{ minHeight: 240, position: "relative" }}
    >
      {!mapLoaded && (
        <span
          aria-hidden
          className="absolute inset-0 z-10 bg-[var(--color-neutral-200)] animate-pulse"
        />
      )}
    </div>
  );
}
