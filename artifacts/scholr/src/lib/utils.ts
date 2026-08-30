import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertGoogleDriveLink(url: string | null | undefined): string {
  if (!url) return url || "";
  
  // Match standard /d/FILE_ID/view URLs
  let match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`;
  }
  
  // Match ?id=FILE_ID URLs
  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`;
  }

  return url;
}
export function optimizeImageUrl(url: string | null | undefined, width: number = 800): string {
  if (!url) return "";
  if (url.includes("drive.google.com/thumbnail") && url.includes("sz=w")) {
    return url.replace(/sz=w\d+/, `sz=w${width}`);
  }
  return url;
}
