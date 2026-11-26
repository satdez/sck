import type { Offer } from "@/lib/solo/types";

/** An offer's cover: the creator's image when they added one, otherwise its emoji. Fills a `relative` box. */
export function OfferArt({ o, className = "" }: { o: Pick<Offer, "emoji" | "image">; className?: string }) {
  if (o.image)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={o.image} alt="" className={`absolute inset-0 size-full object-cover ${className}`} draggable={false} />;
  return <span className={className}>{o.emoji}</span>;
}
