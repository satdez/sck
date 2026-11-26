import { siInstagram, siWhatsapp, siYoutube } from "simple-icons";

export function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#25D366" aria-hidden>
      <path d={siWhatsapp.path} />
    </svg>
  );
}

export function PlatformGlyph({ platform, className = "size-3.5" }: { platform: "instagram" | "youtube"; className?: string }) {
  const si = platform === "instagram" ? siInstagram : siYoutube;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" role="img" aria-label={si.title}>
      <path d={si.path} />
    </svg>
  );
}
