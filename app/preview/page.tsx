"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type PreviewPayload = {
  success: boolean;
  email?: string;
  name?: string;
  previewUrl?: string;
  downloadUrl?: string;
  message?: string;
};

const EVENT_NAME = process.env.NEXT_PUBLIC_EVENT_NAME || "cloud vision, by cloud computing club";
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff"]);

function isImageDownloadUrl(url: string) {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const pathname = decodeURIComponent(parsedUrl.pathname);
    const filename = pathname.split("/").pop() || "";
    const extensionIndex = filename.lastIndexOf(".");

    if (extensionIndex < 0) {
      return false;
    }

    const extension = filename.slice(extensionIndex).toLowerCase();
    return IMAGE_EXTENSIONS.has(extension);
  } catch {
    return false;
  }
}

export default function PreviewPage() {
  const [token, setToken] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  const isImagePreview = isImageDownloadUrl(previewUrl);

  const handleDownload = () => {
    if (!downloadUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setShowThankYou(true);
  };

  useEffect(() => {
    const tokenFromUrl = new URLSearchParams(window.location.search).get("token") || "";
    setToken(tokenFromUrl);
  }, []);

  useEffect(() => {
    async function loadPreview() {
      if (!token) {
        setError("Invalid preview request.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/preview?token=${encodeURIComponent(token)}`);
        const data = (await response.json()) as PreviewPayload;

        if (!response.ok || !data.success || !data.previewUrl || !data.downloadUrl) {
          setError(data.message || "Could not load certificate preview.");
          return;
        }

        setName(data.name || "");
        setEmail(data.email || "");
        setPreviewUrl(data.previewUrl);
        setDownloadUrl(data.downloadUrl);
      } catch {
        setError("Could not load certificate preview.");
      } finally {
        setLoading(false);
      }
    }

    void loadPreview();
  }, [token]);

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-6">
      <div className="absolute inset-0 bg-gradient-to-b from-black/72 via-black/80 to-black/94" />
      <div className="absolute inset-x-0 top-0 h-[36vh] bg-gradient-to-b from-black/95 via-black/80 to-transparent" />
      <main className="relative z-10 w-full max-w-5xl">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-zinc-100 md:text-2xl">Certificate Preview</h1>
              <p className="text-sm text-zinc-300">{name} • {email}</p>
            </div>
            {downloadUrl ? (
              <div className="w-full sm:w-52">
                <Button type="button" onClick={handleDownload}>
                  Download Certificate
                </Button>
              </div>
            ) : null}
          </div>

          {loading ? <p className="text-sm text-zinc-300">Loading preview...</p> : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          {!loading && !error && previewUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="h-[72vh] overflow-hidden rounded-2xl border border-white/15 bg-black/35"
            >
              {isImagePreview ? (
                <div className="relative h-full w-full">
                  <Image
                    src={previewUrl}
                    alt="Certificate Preview"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              ) : (
                <iframe src={previewUrl} className="h-full w-full" title="Certificate Preview" />
              )}
            </motion.div>
          ) : null}

          <AnimatePresence>
            {showThankYou ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
              >
                <motion.div
                  initial={{ scale: 0.96, y: 10, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.98, y: 6, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-900 p-6 text-center shadow-2xl"
                >
                  <p className="text-lg font-semibold text-zinc-100">
                    {`Thank you for making ${EVENT_NAME} successful.`}
                  </p>
                  <div className="mt-4">
                    <Button type="button" onClick={() => setShowThankYou(false)}>
                      Close
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>
      </main>
    </div>
  );
}
