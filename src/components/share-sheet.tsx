"use client";

import { Check, Copy, Download, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";

export function publicUrl(slug: string) {
  return `https://${slug}.sck.bio`;
}

/** Bottom sheet (Vaul) with the link, a QR code and native share. */
export function ShareSheet({ slug, trigger }: { slug: string; trigger: ReactNode }) {
  const url = publicUrl(slug);
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(url, { margin: 1, width: 560, color: { dark: "#111111", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [open, url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied", { description: url.replace("https://", "") });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "My portfolio", url });
    } catch {
      /* dismissed */
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col rounded-t-[28px] bg-ui-panel text-ui-ink outline-none">
          <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-ui-line" />
          <div className="flex flex-col items-center gap-5 px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="text-center">
              <Drawer.Title className="text-lg font-semibold">Share your page</Drawer.Title>
              <Drawer.Description className="text-sm text-ui-muted">Add it to your bio or let people scan it.</Drawer.Description>
            </div>

            <div className="grid size-56 place-items-center rounded-3xl border border-ui-line bg-white p-3">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`QR code for ${url}`} className="size-full" />
              ) : (
                <div className="size-full animate-pulse rounded-2xl bg-neutral-100" />
              )}
            </div>

            <div className="flex w-full items-center gap-2 rounded-2xl border border-ui-line bg-ui-sunken p-1.5 pl-4">
              <span className="min-w-0 flex-1 truncate font-mono text-sm select-all">{url.replace("https://", "")}</span>
              <button
                type="button"
                onClick={copy}
                className="ui-press inline-flex h-9 items-center gap-1.5 rounded-xl bg-ui-ink px-3 text-sm font-medium text-ui-bg"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="grid w-full grid-cols-2 gap-2">
              <a
                href={qr || undefined}
                download={`${slug}-sck-bio-qr.png`}
                className="ui-press inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ui-line text-sm font-medium"
              >
                <Download className="size-4" /> Save QR
              </a>
              <button
                type="button"
                onClick={nativeShare}
                className="ui-press inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ui-line text-sm font-medium"
              >
                <Share2 className="size-4" /> Share…
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
