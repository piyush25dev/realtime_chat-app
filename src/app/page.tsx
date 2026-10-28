"use client";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { AlertCircle, Flame, Loader2, Lock, Users, type LucideIcon } from "lucide-react";
import { EmberField } from "@/components/ember-field";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

/*
  Palette
  night   #1B1830  page
  panel   #25213F  card
  line    #3A3560  borders
  paper   #F4EFE7  primary text
  mist    #A8A3BF  secondary text
  ember   #FF7A45  the one accent (button, status dot, glow)
*/

const Page = () => {
  return (
    <Suspense
      fallback={
        <div
          className={`${display.variable} flex min-h-screen items-center justify-center bg-[#1B1830]`}
        >
          <Loader2 className="h-6 w-6 animate-spin text-[#FF7A45] motion-reduce:animate-none" />
        </div>
      }
    >
      <Lobby />
    </Suspense>
  );
};

export default Page;

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Users, title: "Two people per room", body: "Share the link with one person. Nobody else can join." },
  { icon: Flame, title: "Messages burn", body: "Destroy the room and every message is deleted for good." },
  { icon: Lock, title: "Encrypted, no logs", body: "Conversations stay between the two of you." },
];

function Notice({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: "danger" | "warn";
}) {
  const styles =
    tone === "danger"
      ? "border-[#FF6B6B]/40 bg-[#FF6B6B]/10 text-[#FF9A9A]"
      : "border-[#FFC145]/40 bg-[#FFC145]/10 text-[#FFD37A]";
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-[#F4EFE7]/70">{body}</p>
      </div>
    </div>
  );
}

function Lobby() {
  const router = useRouter();
  const { username } = useUsername();

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  return (
    <main
      className={`${display.variable} ${mono.variable} relative isolate min-h-screen overflow-hidden bg-[#1B1830] font-[family-name:var(--font-display)] text-[#F4EFE7]`}
    >
      {/* One quiet ember glow rising from the bottom edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[60vh] bg-[radial-gradient(ellipse_60%_80%_at_50%_110%,rgba(255,122,69,0.28),transparent_70%)]"
      />

      {/* Three.js embers; they speed up while a room is being created */}
      <EmberField burning={isPending} className="absolute inset-0 -z-10" />

      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-0">
        {/* Left: message */}
        <section className="max-w-xl">
          <p className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-sm text-[#A8A3BF]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF7A45] opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF7A45]" />
            </span>
            private_chat
          </p>

          <h1 className="mt-6 text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Say it once.
            <br />
            Then it&rsquo;s gone.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#A8A3BF]">
            Open a private room, send the link to one person, and talk. When the room is
            destroyed, so is every message.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3A3560] bg-[#25213F]">
                  <Icon className="h-4 w-4 text-[#FF9A6B]" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-[#A8A3BF]">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Right: the one place to act */}
        <section className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="space-y-3">
            {wasDestroyed && (
              <Notice
                tone="danger"
                icon={AlertCircle}
                title="Room destroyed"
                body="All messages were permanently deleted."
              />
            )}
            {error === "room-not-found" && (
              <Notice
                tone="danger"
                icon={AlertCircle}
                title="Room not found"
                body="This room may have expired or never existed."
              />
            )}
            {error === "room-full" && (
              <Notice
                tone="warn"
                icon={Users}
                title="Room is full"
                body="This room already has two people in it."
              />
            )}

            <div className="rounded-3xl border border-[#3A3560] bg-[#25213F] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight">Start a conversation</h2>
              <p className="mt-1.5 text-sm text-[#A8A3BF]">
                You&rsquo;ll get a link to share once the room is ready.
              </p>

              <div className="mt-7">
                <p className="mb-2 text-sm text-[#A8A3BF]">You&rsquo;ll appear as</p>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#3A3560] bg-[#1B1830] px-4 py-3.5">
                  <span className="min-w-0 break-all font-[family-name:var(--font-mono)] text-sm text-[#F4EFE7] sm:text-base">
                    {username}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-[#A8A3BF]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5EE29A]" />
                    Ready
                  </span>
                </div>
              </div>

              <button
                onClick={() => createRoom()}
                disabled={isPending}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#FF7A45] px-5 py-4 text-base font-semibold text-[#1B1830] transition hover:bg-[#FF8D5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB48A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#25213F] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
                    Creating room…
                  </>
                ) : (
                  <>
                    <Flame className="h-5 w-5" aria-hidden />
                    Create private room
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-[#A8A3BF]">
                Messages are temporary and can&rsquo;t be recovered.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}