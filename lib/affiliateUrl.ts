export function affiliateUrl(
  ref: string,
  type: string,
  name: string,
  targetUrl: string,
  channel?: string,
): string {
  const params = new URLSearchParams({ ref, type, name, link: targetUrl });
  if (channel) params.set("channel", channel);
  return `/redirect?${params.toString()}`;
}
