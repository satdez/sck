import {
  siInstagram,
  siPinterest,
  siSnapchat,
  siSpotify,
  siThreads,
  siTiktok,
  siTwitch,
  siX,
  siYoutube,
} from "simple-icons";
import { Globe, Linkedin } from "./lucide-fallbacks";
import type { Platform } from "@/lib/types";

type SI = { path: string; hex: string; title: string };

const MAP: Partial<Record<Platform, SI>> = {
  instagram: siInstagram,
  youtube: siYoutube,
  tiktok: siTiktok,
  x: siX,
  snapchat: siSnapchat,
  twitch: siTwitch,
  threads: siThreads,
  spotify: siSpotify,
  pinterest: siPinterest,
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  snapchat: "Snapchat",
  twitch: "Twitch",
  threads: "Threads",
  spotify: "Spotify",
  pinterest: "Pinterest",
  website: "Website",
};

export const PLATFORM_COLOR: Record<Platform, string> = {
  instagram: "#E4405F",
  youtube: "#FF0000",
  tiktok: "#000000",
  x: "#000000",
  linkedin: "#0A66C2",
  snapchat: "#FFFC00",
  twitch: "#9146FF",
  threads: "#000000",
  spotify: "#1DB954",
  pinterest: "#BD081C",
  website: "#555555",
};

export function PlatformIcon({ platform, size = 18, className }: { platform: Platform; size?: number; className?: string }) {
  const si = MAP[platform];
  if (si) {
    return (
      <svg role="img" aria-label={si.title} viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
        <path d={si.path} />
      </svg>
    );
  }
  const Fallback = platform === "linkedin" ? Linkedin : Globe;
  return <Fallback size={size} className={className} aria-label={PLATFORM_LABEL[platform]} />;
}
