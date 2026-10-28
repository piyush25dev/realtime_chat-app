"use client";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { AlertTriangle, Check, Copy, Flame, Loader2, Lock, Send, Trash2 } from "lucide-react";
import { EmberField } from "@/components/ember-field";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

/*
  Palette (shared with the lobby)
  night   #1B1830  page
  panel   #25213F  surfaces
  line    #3A3560  borders
  paper   #F4EFE7  primary text
  mist    #A8A3BF  secondary text
  ember   #FF7A45  the one accent
*/

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;

  const router = useRouter();

  const { username } = useUsername();

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [totalTtl, setTotalTtl] = useState<number | null>(null);
  const [isDestroyed, setIsDestroyed] = useState(false);

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      return res.data;
    },
  });

  useEffect(() => {
    if (ttlData?.ttl !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeRemaining(ttlData.ttl);
      // remember the starting value so the fuse bar knows how long it began
      setTotalTtl((prev) => prev ?? (ttlData.ttl > 0 ? ttlData.ttl : null));
    }
  }, [ttlData]);

  useEffect(() => {
    if (isDestroyed || timeRemaining === null || timeRemaining < 0) return;

    if (timeRemaining === 0) {
      router.push("/?destroyed=true");
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, router, isDestroyed]);

  const { data: messages } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });
      if (res.status === 410 || res.status === 404) {
        setIsDestroyed(true);
        router.replace("/?destroyed=true");
        return { messages: [] };
      }
      if (!res.data) throw new Error("Unable to load messages");
      return res.data;
    },
    refetchInterval: 1500,
    retry: false,
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post({ sender: username, text }, { query: { roomId } });
      setInput("");
    },
  });

  const {
    mutate: destroyRoom,
    isPending: isDestroying,
    isError: destroyFailed,
    reset: resetDestroy,
  } = useMutation({
    mutationFn: async () => {
      const res = await client.messages.delete(null, { query: { roomId } });
      if (res.status < 200 || res.status >= 300) {
        throw new Error("Could not destroy this room. Please try again.");
      }
    },
    onSuccess: () => {
      setIsDestroyed(true);
      setTimeRemaining(0);
      router.replace("/?destroyed=true");
    },
  });

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open or close the native <dialog> (gives focus trapping and Esc for free)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmOpen && !dialog.open) dialog.showModal();
    if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);

  const closeConfirm = () => {
    if (isDestroying) return; // don't allow dismissing mid-request
    setConfirmOpen(false);
  };

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const urgent = timeRemaining !== null && timeRemaining < 60;
  const fuse =
    timeRemaining !== null && totalTtl
      ? Math.max(0, Math.min(1, timeRemaining / totalTtl)) * 100
      : 100;

  const submit = () => {
    if (!input.trim() || isPending) return;
    sendMessage({ text: input });
    inputRef.current?.focus();
  };

  return (
    <main
      className={`${display.variable} ${mono.variable} relative isolate flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#1B1830] font-[family-name:var(--font-display)] text-[#F4EFE7]`}
    >
      {/* Quiet ember glow and drifting embers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[50vh] bg-[radial-gradient(ellipse_60%_80%_at_50%_110%,rgba(255,122,69,0.18),transparent_70%)]"
      />
      <EmberField className="absolute inset-0 -z-10 opacity-40" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#3A3560] bg-[#1B1830]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3A3560] bg-[#25213F] sm:flex">
              <Flame className="h-4 w-4 text-[#FF9A6B]" aria-hidden />
            </span>

            <div className="min-w-0">
              <p className="text-xs text-[#A8A3BF]">Room</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="truncate font-[family-name:var(--font-mono)] text-sm">
                  {roomId.slice(0, 6)}…{roomId.slice(-4)}
                </span>
                <button
                  onClick={copyLink}
                  aria-label={copied ? "Link copied" : "Copy room link"}
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-[#3A3560] bg-[#25213F] px-2 py-1 text-xs text-[#A8A3BF] transition hover:text-[#F4EFE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB48A] motion-reduce:transition-none"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-[#5EE29A]" aria-hidden />
                  ) : (
                    <Copy className="h-3 w-3" aria-hidden />
                  )}
                  <span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
                </button>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-[#3A3560] sm:block" />

            <div className="shrink-0">
              <p className="text-xs text-[#A8A3BF]">Time left</p>
              <p
                className={`mt-0.5 font-[family-name:var(--font-mono)] text-base font-medium tabular-nums ${
                  urgent ? "text-[#FF6B6B]" : "text-[#FFB48A]"
                }`}
              >
                {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isDestroying}
            aria-haspopup="dialog"
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#3A3560] bg-[#25213F] px-3 py-2 text-sm font-medium text-[#A8A3BF] transition hover:border-[#FF6B6B]/60 hover:bg-[#FF6B6B]/10 hover:text-[#FF9A9A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9A9A] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
          >
            {isDestroying ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden sm:inline">Destroy room</span>
            <span className="sm:hidden">Destroy</span>
          </button>
        </div>

        {/* Fuse: burns down as the room's time runs out */}
        <div
          className="relative h-[3px] w-full bg-[#3A3560]/50"
          role="progressbar"
          aria-label="Time left before the room self-destructs"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fuse)}
        >
          <div
            className={`relative h-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none ${
              urgent ? "bg-[#FF6B6B]" : "bg-[#FF7A45]"
            }`}
            style={{ width: `${fuse}%` }}
          >
            <span
              className={`absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                urgent
                  ? "bg-[#FFB4B4] shadow-[0_0_10px_3px_rgba(255,107,107,0.8)]"
                  : "bg-[#FFB48A] shadow-[0_0_10px_3px_rgba(255,122,69,0.8)]"
              }`}
            />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto [scrollbar-color:#3A3560_transparent] [scrollbar-width:thin]">
        <div
          role="log"
          aria-live="polite"
          className="mx-auto w-full max-w-3xl space-y-1.5 px-4 py-6 sm:px-6"
        >
          {messages?.messages.length === 0 && (
            <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#3A3560] bg-[#25213F]">
                <Flame className="h-6 w-6 text-[#FF9A6B]" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">Nothing here yet</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#A8A3BF]">
                Send the first message, or copy the link and invite one person. Everything
                disappears when the timer ends.
              </p>
            </div>
          )}

          {messages?.messages.map((msg, index) => {
            const isOwn = msg.sender === username;
            const startsGroup =
              index === 0 || messages.messages[index - 1]?.sender !== msg.sender;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${
                  startsGroup && index !== 0 ? "pt-3" : ""
                } animate-in fade-in duration-300 motion-reduce:animate-none`}
              >
                {startsGroup && (
                  <div
                    className={`mb-1 flex items-baseline gap-2 px-1 ${
                      isOwn ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold ${
                        isOwn ? "text-[#FFB48A]" : "text-[#F4EFE7]"
                      }`}
                    >
                      {isOwn ? "You" : msg.sender}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[#A8A3BF]">
                      {format(msg.timestamp, "HH:mm")}
                    </span>
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl border px-4 py-2.5 sm:max-w-[75%] ${
                    isOwn
                      ? "rounded-br-md border-[#FF7A45]/35 bg-[#FF7A45]/15"
                      : "rounded-bl-md border-[#3A3560] bg-[#25213F]"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="relative z-10 border-t border-[#3A3560] bg-[#1B1830]/80 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={input}
                maxLength={500}
                aria-label="Message"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="Write a message"
                onChange={(e) => setInput(e.target.value)}
                className="w-full rounded-2xl border border-[#3A3560] bg-[#25213F] py-3.5 pl-4 pr-16 text-[15px] text-[#F4EFE7] placeholder:text-[#A8A3BF]/70 transition focus:border-[#FF7A45]/70 focus:outline-none focus:ring-2 focus:ring-[#FF7A45]/25 motion-reduce:transition-none"
              />
              {input.length > 0 && (
                <span
                  className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[11px] tabular-nums ${
                    input.length > 450 ? "text-[#FFC145]" : "text-[#A8A3BF]"
                  }`}
                >
                  {input.length}/500
                </span>
              )}
            </div>

            <button
              onClick={submit}
              disabled={!input.trim() || isPending}
              aria-label="Send message"
              className="flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#FF7A45] text-[#1B1830] transition hover:bg-[#FF8D5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB48A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1830] active:scale-95 disabled:cursor-not-allowed disabled:bg-[#25213F] disabled:text-[#A8A3BF]/50 motion-reduce:transition-none"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <Send className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>

          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-[#A8A3BF] sm:justify-end">
            <Lock className="h-3 w-3" aria-hidden />
            Encrypted and deleted when the timer ends
          </p>
        </div>
      </div>
      {/* Destroy confirmation */}
      <dialog
        ref={dialogRef}
        onClose={() => {
          setConfirmOpen(false);
          resetDestroy();
        }}
        onCancel={(e) => {
          if (isDestroying) e.preventDefault();
        }}
        onClick={(e) => {
          // a click on the backdrop lands on the <dialog> itself
          if (e.target === e.currentTarget) closeConfirm();
        }}
        aria-labelledby="destroy-title"
        aria-describedby="destroy-desc"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[#3A3560] bg-[#25213F] p-0 font-[family-name:var(--font-display)] text-[#F4EFE7] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop:bg-[#0F0D1F]/75 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 open:duration-200 motion-reduce:animate-none"
      >
        <div className="p-6 sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#FF6B6B]/40 bg-[#FF6B6B]/10">
            <AlertTriangle className="h-5 w-5 text-[#FF9A9A]" aria-hidden />
          </span>

          <h2 id="destroy-title" className="mt-5 text-xl font-semibold tracking-tight">
            Destroy this room?
          </h2>
          <p id="destroy-desc" className="mt-2 text-sm leading-relaxed text-[#A8A3BF]">
            Every message is permanently deleted for both of you, and the room link stops
            working. This can&rsquo;t be undone.
          </p>

          {destroyFailed && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-3 py-2 text-sm text-[#FF9A9A]"
            >
              Couldn&rsquo;t destroy the room. Try again.
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={closeConfirm}
              disabled={isDestroying}
              className="cursor-pointer rounded-xl border border-[#3A3560] px-5 py-3 text-sm font-medium text-[#F4EFE7] transition hover:bg-[#3A3560]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB48A] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Cancel
            </button>
            <button
              onClick={() => destroyRoom()}
              disabled={isDestroying}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FF6B6B] px-5 py-3 text-sm font-semibold text-[#1B1830] transition hover:bg-[#FF8282] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB4B4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#25213F] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
            >
              {isDestroying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  Destroying…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Destroy room
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>
    </main>
  );
};

export default Page;