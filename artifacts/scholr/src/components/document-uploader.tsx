import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, CheckCircle2, X, FileText, Loader2,
  AlertCircle, Eye, Trash2, File
} from "lucide-react";

export interface DocumentSlot {
  type: string;
  label: string;
  required: boolean;
  objectPath?: string | null;
  fileName?: string | null;
  uploadedAt?: string | null;
  size?: number | null;
}

interface DocumentUploaderProps {
  slot: DocumentSlot;
  onUploaded: (objectPath: string, fileName: string, size: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED: Record<string, string> = {
  cv: ".pdf,.doc,.docx",
  transcript: ".pdf,.jpg,.jpeg,.png",
  passport: ".pdf,.jpg,.jpeg,.png",
  photo: ".jpg,.jpeg,.png,.webp",
  recommendation: ".pdf,.doc,.docx",
  statement: ".pdf,.doc,.docx",
  certificate: ".pdf,.jpg,.jpeg,.png",
  english_test: ".pdf,.jpg,.jpeg,.png",
  other: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
};

export function DocumentUploader({ slot, onUploaded, onRemove, disabled }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUploaded = !!slot.objectPath;
  const accept = ACCEPTED[slot.type] ?? ACCEPTED.other;

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10 MB)");
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(10);
    try {
      const token = localStorage.getItem("scholr_student_token");
      const urlRes = await fetch(`${BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
      });
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { uploadURL, objectPath } = await urlRes.json() as { uploadURL: string; objectPath: string };

      setProgress(30);

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      setProgress(100);
      onUploaded(objectPath, file.name, file.size);
    } catch (e: unknown) {
      setError((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={`border rounded-xl p-4 transition-all ${
      isUploaded
        ? "border-emerald-500/40 bg-emerald-500/5"
        : error
        ? "border-red-500/40 bg-red-500/5"
        : "border-border bg-card hover:border-primary/40"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isUploaded ? "bg-emerald-500/20" : "bg-muted"
          }`}>
            {isUploaded
              ? <CheckCircle2 size={18} className="text-emerald-400" />
              : <FileText size={18} className="text-muted-foreground" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{slot.label}</span>
              {slot.required
                ? <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 px-1.5 py-0">Required</Badge>
                : <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">Optional</Badge>
              }
            </div>
            {isUploaded && slot.fileName && (
              <div className="flex items-center gap-2 mt-1">
                <File size={11} className="text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-emerald-400 truncate">{slot.fileName}</span>
                {slot.size && <span className="text-xs text-muted-foreground flex-shrink-0">({formatBytes(slot.size)})</span>}
              </div>
            )}
            {!isUploaded && (
              <p className="text-xs text-muted-foreground mt-0.5">{accept.replace(/\./g, "").replace(/,/g, ", ").toUpperCase()} — max 10 MB</p>
            )}
            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle size={11} /> {error}
              </p>
            )}
            {uploading && (
              <div className="mt-2">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">Uploading... {progress}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isUploaded ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => window.open(`${BASE}/api/storage${slot.objectPath}`, "_blank")}
                title="Preview"
              >
                <Eye size={14} />
              </Button>
              {!disabled && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                  onClick={onRemove}
                  title="Remove"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading
                ? <><Loader2 size={12} className="animate-spin" /> Uploading</>
                : <><Upload size={12} /> Upload</>
              }
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        disabled={disabled || uploading}
      />
    </div>
  );
}
