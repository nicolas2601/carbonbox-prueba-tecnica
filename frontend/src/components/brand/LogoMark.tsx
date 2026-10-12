export function LogoMark({ decorative = false, size = 48 }: { decorative?: boolean; size?: number }) {
  return <svg viewBox="0 0 48 48" width={size} height={size} className="logo-mark" role={decorative ? undefined : "img"}
    aria-hidden={decorative || undefined} aria-label={decorative ? undefined : "CarbonBox"}>
    <use href="/favicon.svg#carbonbox-mark" />
  </svg>;
}
export function Lockup() {
  return <span className="brand-lockup"><LogoMark decorative size={40} />
    <span className="brand-wordmark"><span className="font-semibold">Carbon</span><span className="font-normal">Box</span></span>
  </span>;
}
