import { useState } from "react";
import { optimizeImageUrl } from "@/lib/utils";

type Fit = "cover" | "contain";

interface SmartImageProps {
  src?: string | null;
  alt: string;
  /** Tailwind classes for the wrapper (must define the box size). */
  className?: string;
  /** "contain" keeps the original framing, "cover" fills the box. */
  fit?: Fit;
  eager?: boolean;
  /** "hero" ensures a large 1200px+ image for Google Discover and visual quality. "card" uses a smaller 600px image for performance. */
  variant?: "hero" | "card";
  /** Rendered when there is no image or the image fails to load. */
  fallback?: React.ReactNode;
}

/**
 * Image renderer tuned for hot-linked, third-party source images.
 *
 * - `referrerPolicy="no-referrer"` so hosts that block hot-linking by Referer
 *   (most news/university sites) still serve the file.
 * - `crossOrigin` is intentionally NOT set: it would turn a plain image request
 *   into a CORS request and break most public-domain hosts.
 * - When `fit="contain"` a blurred copy of the same image fills the letterbox
 *   area, so nothing is cropped yet the frame never shows dead grey space —
 *   the picture keeps looking like the original source.
 */
export function SmartImage({
  src,
  alt,
  className = "",
  fit = "contain",
  eager = false,
  variant = "card",
  fallback,
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Hero images need high resolution (1200px) for Google Discover eligibility. Cards can be smaller (600px).
  const optimizedSrc = optimizeImageUrl(src, variant === "hero" ? 1200 : 600);

  if (!optimizedSrc || failed) {
    return (
      <div className={`bg-gradient-to-br from-primary/15 via-card to-card ${className}`}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {fit === "contain" && (
        <img
          src={optimizedSrc}
          alt=""
          width={1280}
          height={720}
          aria-hidden="true"
          referrerPolicy="no-referrer"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
        />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={1280}
        height={720}
        referrerPolicy="no-referrer"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`relative h-full w-full ${
          fit === "cover" ? "object-cover" : "object-contain"
        } transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

export default SmartImage;
