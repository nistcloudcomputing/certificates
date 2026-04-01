"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { CheckCircle2, Mail, UserRound } from "lucide-react";
import { FormEvent, useCallback, useState } from "react";

type ApiResponse = {
  success: boolean;
  message: string;
  downloadUrl?: string;
};

export default function Form() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const formControls = useAnimationControls();

  const triggerErrorAnimation = useCallback(async () => {
    await formControls.start({
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.45, ease: "easeOut" },
    });
  }, [formControls]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    setMessage(null);
    if (!trimmedEmail && !trimmedName) {
      setMessage({
        type: "error",
        text: "Please enter email or name.",
      });
      void triggerErrorAnimation();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail, name: trimmedName }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success || !data.downloadUrl) {
        setMessage({
          type: "error",
          text: data.message || "Invalid details. Please check and try again.",
        });
        void triggerErrorAnimation();
        return;
      }

      setMessage({
        type: "success",
        text: "Verified successfully. Starting download...",
      });

      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setMessage({
        type: "error",
        text: "Unable to verify right now. Please try again.",
      });
      void triggerErrorAnimation();
    } finally {
      setLoading(false);
    }
  }, [email, name, triggerErrorAnimation]);

  return (
    <motion.form
      className={`space-y-4 transition ${
        message?.type === "error" ? "rounded-2xl shadow-[0_0_42px_rgba(248,113,113,0.2)]" : ""
      }`}
      onSubmit={handleSubmit}
      animate={formControls}
      initial={false}
    >
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          autoFocus
          label="Email"
          icon={<Mail className="size-4" />}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.03 }}
      >
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          label="Name"
          icon={<UserRound className="size-4" />}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.05 }}
      >
        <Button type="submit" loading={loading}>
          Verify &amp; Download
        </Button>
      </motion.div>

      <AnimatePresence mode="wait">
        {message ? (
          <motion.div
            key={message.type + message.text}
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`rounded-xl border px-3 py-2 text-sm ${
              message.type === "success"
                ? "border-white/35 bg-white/16 text-zinc-100"
                : "border-red-300/45 bg-red-200/18 text-red-50"
            }`}
          >
            <div className="flex items-center gap-2 break-words">
              {message.type === "success" ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24 }}
                >
                  <CheckCircle2 className="size-4" />
                </motion.span>
              ) : null}
              <span>{message.text}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.form>
  );
}
