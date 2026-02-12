"use client";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Shield, Users, Lock, AlertCircle, Terminal } from "lucide-react";

const Page = () => {
  return <Suspense fallback={
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="animate-pulse text-green-500 font-mono">LOADING_...</div>
    </div>
  }>
    <Lobby/>
  </Suspense>
}

export default Page

function Lobby() {
  const router = useRouter();
  const { username } = useUsername();

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error")

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    }
  })

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-black via-zinc-950 to-black overflow-hidden">
      
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_70%,transparent_100%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Alert Messages */}
        {wasDestroyed &&
          <div className="group relative overflow-hidden rounded-lg border border-red-500/20 bg-red-950/20 backdrop-blur-sm p-4 animate-in slide-in-from-top duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="mt-0.5">
                <div className="rounded-full bg-red-500/20 p-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-mono text-sm font-bold text-red-400">[ROOM_DESTROYED]</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  All messages were permanently deleted.
                </p>
              </div>
            </div>
          </div>
        }
        
        {error === "room-not-found" &&
          <div className="group relative overflow-hidden rounded-lg border border-red-500/20 bg-red-950/20 backdrop-blur-sm p-4 animate-in slide-in-from-top duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="mt-0.5">
                <div className="rounded-full bg-red-500/20 p-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-mono text-sm font-bold text-red-400">[ROOM_NOT_FOUND]</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  This room may have expired or never existed.
                </p>
              </div>
            </div>
          </div>
        }
        
        {error === "room-full" &&
          <div className="group relative overflow-hidden rounded-lg border border-orange-500/20 bg-orange-950/20 backdrop-blur-sm p-4 animate-in slide-in-from-top duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="mt-0.5">
                <div className="rounded-full bg-orange-500/20 p-1.5">
                  <Users className="h-4 w-4 text-orange-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-mono text-sm font-bold text-orange-400">[ROOM_FULL]</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  This room is at maximum capacity.
                </p>
              </div>
            </div>
          </div>
        }

        {/* Main Card */}
        <div className="relative group">
          {/* Animated border gradient */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500" />
          
          <div className="relative border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl rounded-lg overflow-hidden">
            
            {/* Header with terminal style */}
            <div className="border-b border-zinc-800/80 bg-black/40 p-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-sm rounded-full" />
                  <Terminal className="relative h-6 w-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-mono text-xl font-bold tracking-tighter text-green-400">
                      private_chat
                    </h1>
                    <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full">
                      <span className="text-[10px] font-mono text-green-400">v1.0</span>
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs font-mono mt-0.5 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    end-to-end encrypted • self-destructing
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Identity Section */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  <Shield className="h-3.5 w-3.5" />
                  Your Identity
                </label>
                
                <div className="relative group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover/input:opacity-100 transition duration-300" />
                  <div className="relative flex items-center gap-2 bg-black/60 border border-zinc-800/80 rounded-lg overflow-hidden">
                    <div className="flex-1 px-4 py-3.5">
                      <span className="font-mono text-sm text-green-400/90 tracking-wider">
                        {username}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-zinc-800/50 border-l border-zinc-700/50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-zinc-400">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Room Button */}
              <button 
                onClick={() => createRoom()} 
                disabled={isPending}
                className="relative w-full group/btn disabled:cursor-not-allowed"
              >
                {/* Animated background */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-lg blur opacity-60 group-hover/btn:opacity-100 transition duration-300 disabled:opacity-30" />
                
                <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-zinc-900 to-black border border-green-500/30 rounded-lg px-6 py-4 hover:from-green-950/30 hover:to-black transition-all duration-300 disabled:from-zinc-900 disabled:to-black">
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                      <span className="font-mono text-sm font-medium text-green-400/70">
                        CREATING_ROOM...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Shield className="h-4 w-4 text-green-400 group-hover/btn:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-green-500/20 blur-sm opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </div>
                      <span className="font-mono text-sm font-medium tracking-wider text-green-400 group-hover/btn:text-green-300 transition-colors">
                        CREATE_SECURE_ROOM
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Security Features */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { icon: Lock, label: "256-bit", desc: "encryption" },
                  { icon: Users, label: "2", desc: "participants" },
                  { icon: AlertCircle, label: "auto", desc: "destruct" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center p-2 rounded-md bg-black/40 border border-zinc-800/50">
                    <item.icon className="h-3.5 w-3.5 text-zinc-400 mb-1" />
                    <span className="text-[10px] font-mono font-bold text-zinc-300">{item.label}</span>
                    <span className="text-[8px] font-mono text-zinc-500">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] font-mono text-zinc-600">
            [ALL_MESSAGES_ARE_EPHEMERAL]
          </p>
        </div>
      </div>
    </main>
  );
}