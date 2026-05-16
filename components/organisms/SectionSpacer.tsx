/**
 * 12px thin neutral-100 divider between sections. Matches the Figma
 * "Greeting Spacer / Description Spacer" pattern.
 */
export function SectionSpacer() {
  return <div className="h-3 w-full bg-[var(--color-neutral-100)]" aria-hidden />;
}
