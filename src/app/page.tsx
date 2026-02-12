"use client";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Shield, Users, Lock, AlertCircle, Terminal, Zap, Eye } from "lucide-react";

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
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-black via-zinc-950 to-black overflow-hidden">
      
      {/* Enhanced animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)] opacity-50" />
      
      {/* Enhanced glowing orbs with better positioning */}
      <div className="absolute top-10 sm:top-20 -left-10 sm:-left-20 w-48 h-48 sm:w-72 sm:h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 sm:bottom-20 -right-10 sm:-right-20 w-56 h-56 sm:w-80 sm:h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-4 sm:space-y-6">
        {/* Alert Messages */}
        {wasDestroyed &&
          <div className="group relative overflow-hidden rounded-lg sm:rounded-xl border border-red-500/30 bg-red-950/30 backdrop-blur-md p-3 sm:p-4 animate-in slide-in-from-top duration-300 shadow-lg shadow-red-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5">
                <div className="rounded-full bg-red-500/30 p-1.5 sm:p-2">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs sm:text-sm font-bold text-red-400">[ROOM_DESTROYED]</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">
                  All messages were permanently deleted.
                </p>
              </div>
            </div>
          </div>
        }
        
        {error === "room-not-found" &&
          <div className="group relative overflow-hidden rounded-lg sm:rounded-xl border border-red-500/30 bg-red-950/30 backdrop-blur-md p-3 sm:p-4 animate-in slide-in-from-top duration-300 shadow-lg shadow-red-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5">
                <div className="rounded-full bg-red-500/30 p-1.5 sm:p-2">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs sm:text-sm font-bold text-red-400">[ROOM_NOT_FOUND]</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">
                  This room may have expired or never existed.
                </p>
              </div>
            </div>
          </div>
        }
        
        {error === "room-full" &&
          <div className="group relative overflow-hidden rounded-lg sm:rounded-xl border border-orange-500/30 bg-orange-950/30 backdrop-blur-md p-3 sm:p-4 animate-in slide-in-from-top duration-300 shadow-lg shadow-orange-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5">
                <div className="rounded-full bg-orange-500/30 p-1.5 sm:p-2">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs sm:text-sm font-bold text-orange-400">[ROOM_FULL]</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">
                  This room is at maximum capacity.
                </p>
              </div>
            </div>
          </div>
        }

        {/* Main Card */}
        <div className="relative group">
          {/* Enhanced animated border gradient */}
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500/30 via-emerald-500/40 to-green-500/30 rounded-xl sm:rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-700 animate-pulse" />
          
          <div className="relative border border-zinc-800/90 bg-zinc-900/50 backdrop-blur-xl rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            
            {/* Header with terminal style */}
            <div className="border-b border-zinc-800/90 bg-gradient-to-b from-black/60 to-black/40 p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-green-500/30 blur-md rounded-full animate-pulse" />
                  <div className="relative bg-black/60 p-2 sm:p-2.5 rounded-lg border border-green-500/30">
                    <Terminal className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-mono text-lg sm:text-xl lg:text-2xl font-bold tracking-tighter text-green-400">
                      private_chat
                    </h1>
                    <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full">
                      <span className="text-[9px] sm:text-[10px] font-mono text-green-400 font-semibold">v1.0</span>
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[10px] sm:text-xs font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                    <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="whitespace-nowrap">end-to-end encrypted</span>
                    <span className="hidden xs:inline">•</span>
                    <span className="whitespace-nowrap">self-destructing</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
              {/* Identity Section */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span>Your Identity</span>
                </label>
                
                <div className="relative group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/30 via-blue-500/30 to-green-500/30 rounded-lg sm:rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-500" />
                  <div className="relative flex items-center gap-2 bg-black/80 border border-zinc-800/90 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
                    <div className="flex-1 px-3 sm:px-4 py-3 sm:py-3.5 min-w-0">
                      <span className="font-mono text-xs sm:text-sm lg:text-base text-green-400/90 tracking-wider break-all">
                        {username}
                      </span>
                    </div>
                    <div className="px-2 sm:px-3 py-2 sm:py-2.5 bg-zinc-800/60 border-l border-zinc-700/60 flex-shrink-0">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                        <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 font-semibold">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Room Button */}
              <button 
                onClick={() => createRoom()} 
                disabled={isPending}
                className="relative w-full group/btn disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {/* Enhanced animated background */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 rounded-lg sm:rounded-xl blur-lg opacity-70 group-hover/btn:opacity-100 transition duration-500 group-disabled/btn:opacity-30 animate-pulse" />
                
                <div className="relative flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-black border border-green-500/40 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3.5 sm:py-4 lg:py-5 hover:from-green-950/40 hover:via-green-950/30 hover:to-black transition-all duration-300 disabled:from-zinc-900 disabled:to-black shadow-xl">
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                      <span className="font-mono text-xs sm:text-sm lg:text-base font-medium text-green-400/70">
                        CREATING_ROOM...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="relative flex-shrink-0">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 group-hover/btn:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-green-500/30 blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </div>
                      <span className="font-mono text-xs sm:text-sm lg:text-base font-bold tracking-wider text-green-400 group-hover/btn:text-green-300 transition-colors">
                        CREATE_SECURE_ROOM
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Enhanced Security Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                {[
                  { icon: Lock, label: "256-bit", desc: "encryption", color: "green" },
                  { icon: Users, label: "2 users", desc: "max limit", color: "blue" },
                  { icon: Zap, label: "instant", desc: "destruct", color: "purple" }
                ].map((item, i) => (
                  <div key={i} className="group/card relative">
                    <div className={`absolute -inset-0.5 bg-gradient-to-b from-${item.color}-500/20 to-transparent rounded-lg opacity-0 group-hover/card:opacity-100 transition duration-300 blur`} />
                    <div className="relative flex flex-col items-center p-2 sm:p-3 rounded-lg bg-black/60 border border-zinc-800/70 hover:border-zinc-700/90 transition-all duration-300 hover:shadow-lg">
                      <div className={`bg-${item.color}-500/10 p-1.5 sm:p-2 rounded-md mb-1.5 sm:mb-2`}>
                        <item.icon className={`h-3 w-3 sm:h-4 sm:w-4 text-${item.color}-400`} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] lg:text-xs font-mono font-bold text-zinc-300 text-center leading-tight">{item.label}</span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-zinc-500 text-center mt-0.5">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Security Info */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-zinc-800/70">
                  <Eye className="h-3 w-3 text-zinc-500" />
                  <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400">zero-knowledge</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-zinc-800/70">
                  <Shield className="h-3 w-3 text-zinc-500" />
                  <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400">no-logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center space-y-2">
          <p className="text-[9px] sm:text-[10px] font-mono text-zinc-600 tracking-wider">
            [ALL_MESSAGES_ARE_EPHEMERAL]
          </p>
          <div className="flex items-center justify-center gap-2 text-[8px] sm:text-[9px] font-mono text-zinc-700">
            <span>SECURED</span>
            <span>•</span>
            <span>PRIVATE</span>
            <span>•</span>
            <span>TEMPORARY</span>
          </div>
        </div>
      </div>
    </main>
  );
}