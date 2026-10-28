"use client";
import { useUsername } from '@/hooks/use-username';
import { client } from '@/lib/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from "date-fns"
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { 
  Send, 
  Copy, 
  Check, 
  Clock, 
  Users, 
  Shield, 
  Lock, 
  Terminal, 
  AlertTriangle,
  Trash2,
  User,
  MoreVertical,
  Link2,
  Zap,
  Eye
} from 'lucide-react';

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;

  const router = useRouter();

  const { username } = useUsername();

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [copyStatus, setCopyStatus] = useState('COPY');

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isDestroyed, setIsDestroyed] = useState(false)

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } })
      return res.data
    },
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl)
  }, [ttlData])

  useEffect(() => {
    if (isDestroyed || timeRemaining === null || timeRemaining < 0) return

    if (timeRemaining === 0) {
      router.push("/?destroyed=true")
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, router, isDestroyed])


  const { data: messages, refetch } = useQuery({
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
  })

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      );
      setInput("")
    },
  })

  const { mutate: destroyRoom, isPending: isDestroying } = useMutation({
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
  })

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
    setCopyStatus('COPIED');
    setTimeout(() => {
      setCopyStatus('COPY');
    }, 2000);
  }

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className='flex flex-col h-screen max-h-screen overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-black relative'>
      
      {/* Enhanced animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_70%,transparent_100%)] opacity-40" />
      
      {/* Enhanced glowing orbs */}
      <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 h-48 sm:w-64 sm:h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-56 h-56 sm:w-80 sm:h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 sm:w-64 sm:h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className='relative border-b border-zinc-800/90 bg-black/50 backdrop-blur-xl p-3 sm:p-4 lg:p-5'>
        <div className='flex items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto'>
          {/* Left Section - Room Info & Timer */}
          <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0 flex-wrap lg:flex-nowrap'>
            {/* Room Info */}
            <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
              <div className='hidden sm:block relative flex-shrink-0'>
                <div className='absolute inset-0 bg-green-500/30 blur-md rounded-lg animate-pulse' />
                <div className='relative bg-black/60 p-1.5 sm:p-2 rounded-lg border border-green-500/30'>
                  <Terminal className='h-4 w-4 sm:h-5 sm:w-5 text-green-400' />
                </div>
              </div>
              <div className='flex flex-col min-w-0'>
                <span className='text-[9px] sm:text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1'>
                  <Link2 className='h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0' />
                  <span className='hidden sm:inline'>Room ID</span>
                  <span className='sm:hidden'>Room</span>
                </span>
                <div className='flex items-center gap-1.5 sm:gap-2 mt-0.5'>
                  <span className='font-mono text-[10px] sm:text-xs lg:text-sm font-bold text-green-400 bg-green-950/30 px-1.5 sm:px-2 py-0.5 rounded border border-green-500/30 truncate max-w-[100px] sm:max-w-none'>
                    <span className='hidden sm:inline'>{roomId.slice(0, 8)}...{roomId.slice(-4)}</span>
                    <span className='sm:hidden'>{roomId.slice(0, 6)}...</span>
                  </span>
                  <button 
                    className='group/btn relative flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] bg-zinc-800/80 hover:bg-zinc-700 px-1.5 sm:px-2 py-1 rounded border border-zinc-700/50 transition-all hover:scale-105 flex-shrink-0' 
                    onClick={copyLink}
                  >
                    {copyStatus === 'COPY' ? (
                      <Copy className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-zinc-400 group-hover/btn:text-green-400 transition-colors' />
                    ) : (
                      <Check className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-400' />
                    )}
                    <span className={`hidden sm:inline font-mono ${copyStatus === 'COPIED' ? 'text-green-400' : 'text-zinc-400'}`}>
                      {copyStatus}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className='hidden lg:block h-8 w-px bg-gradient-to-b from-transparent via-zinc-700 to-transparent flex-shrink-0' />

            {/* Timer */}
            <div className='flex items-center gap-1.5 sm:gap-2 flex-shrink-0'>
              <div className='relative'>
                <div className={`absolute inset-0 ${timeRemaining !== null && timeRemaining < 60 ? 'bg-red-500/30' : 'bg-amber-500/30'} blur-md rounded-full animate-pulse`} />
                <div className={`relative ${timeRemaining !== null && timeRemaining < 60 ? 'bg-red-500/20' : 'bg-amber-500/20'} p-1.5 sm:p-2 rounded-lg border ${timeRemaining !== null && timeRemaining < 60 ? 'border-red-500/30' : 'border-amber-500/30'}`}>
                  <Clock className={`h-3 w-3 sm:h-4 sm:w-4 ${timeRemaining !== null && timeRemaining < 60 ? 'text-red-400' : 'text-amber-400'}`} />
                </div>
              </div>
              <div className='flex flex-col'>
                <span className='text-[8px] sm:text-[10px] font-mono text-zinc-500 uppercase tracking-wider whitespace-nowrap'>
                  <span className='hidden sm:inline'>Self-Destruct</span>
                  <span className='sm:hidden'>Timer</span>
                </span>
                <span className={`font-mono text-xs sm:text-sm lg:text-base font-bold flex items-center gap-1 ${timeRemaining !== null && timeRemaining < 60 ? 'text-red-400' : 'text-amber-400'}`}>
                  {timeRemaining !== null ? (
                    <>
                      <span className='tabular-nums'>{formatTimeRemaining(timeRemaining)}</span>
                      <span className='hidden sm:inline text-[8px] sm:text-[9px] text-zinc-500'>left</span>
                    </>
                  ) : (
                    '--:--'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Destroy Button */}
          <button 
            onClick={() => destroyRoom()} 
            disabled={isDestroying}
            className="group/btn relative overflow-hidden flex-shrink-0 disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-red-600/30 rounded-lg sm:rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity blur-md" />
            <div className="relative flex items-center gap-1.5 sm:gap-2 bg-zinc-900/80 hover:bg-red-950/40 border border-zinc-700/50 hover:border-red-500/50 px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300 group-hover/btn:scale-105">
              <Trash2 className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400 group-hover/btn:text-red-400 transition-colors' />
              <span className='hidden md:inline text-[10px] sm:text-xs font-mono font-bold text-zinc-400 group-hover/btn:text-red-400 transition-colors whitespace-nowrap'>
                DESTROY
              </span>
              <span className='md:hidden text-[10px] sm:text-xs font-mono font-bold text-zinc-400 group-hover/btn:text-red-400 whitespace-nowrap'>
                END
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Messages Area */}
<div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none' />
        
        <div className='relative p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 max-w-5xl mx-auto w-full'>
          {messages?.messages.length === 0 && (
            <div className='flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4'>
              <div className='relative mb-4 sm:mb-6'>
                <div className='absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse' />
                <div className='relative bg-green-500/10 p-4 sm:p-6 rounded-2xl border border-green-500/20'>
                  <Users className='h-10 w-10 sm:h-12 sm:w-12 text-green-500/40' />
                </div>
              </div>
              <p className='text-zinc-600 text-xs sm:text-sm font-mono text-center mb-2'>
                <span className='text-green-500/60'>{'>'}</span> No messages yet, start the conversation!
              </p>
              <p className='text-[9px] sm:text-[10px] text-zinc-700 font-mono text-center'>
                All messages are ephemeral and encrypted
              </p>
              <div className='flex items-center gap-3 sm:gap-4 mt-4 sm:mt-6'>
                <div className='flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/40 border border-zinc-800/50'>
                  <Lock className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500/50' />
                  <span className='text-[8px] sm:text-[9px] font-mono text-zinc-600'>256-bit</span>
                </div>
                <div className='flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/40 border border-zinc-800/50'>
                  <Zap className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500/50' />
                  <span className='text-[8px] sm:text-[9px] font-mono text-zinc-600'>auto-destruct</span>
                </div>
              </div>
            </div>
          )}

          {messages?.messages.map((msg, index) => {
            const isOwn = msg.sender === username;
            const showAvatar = index === 0 || messages.messages[index - 1]?.sender !== msg.sender;
            
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[70%] group relative`}>
                  {/* Sender info */}
                  {showAvatar && (
                    <div className={`flex items-baseline gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-1 sm:gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isOwn ? 'bg-green-500/20' : 'bg-blue-500/20'
                        } border ${isOwn ? 'border-green-500/40' : 'border-blue-500/40'}`}>
                          <User className={`h-2 w-2 sm:h-3 sm:w-3 ${isOwn ? 'text-green-400' : 'text-blue-400'}`} />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-mono font-bold ${isOwn ? 'text-green-400' : 'text-blue-400'}`}>
                          {isOwn ? 'You' : msg.sender}
                        </span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-mono text-zinc-600 tabular-nums">
                        {format(msg.timestamp, "HH:mm:ss")}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`relative group/bubble ${!showAvatar ? 'mt-0.5' : ''}`}>
                    <div className={`absolute -inset-0.5 ${
                      isOwn 
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' 
                        : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20'
                    } rounded-2xl blur-md opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-300`} />
                    
                    <div className={`relative px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 rounded-2xl ${
                      isOwn 
                        ? 'bg-gradient-to-br from-green-950/50 to-emerald-950/50 border border-green-500/40' 
                        : 'bg-gradient-to-br from-zinc-900/95 to-black border border-zinc-800/90'
                    } backdrop-blur-xl shadow-lg`}>
                      <p className='text-xs sm:text-sm text-zinc-200 leading-relaxed break-words font-mono'>
                        {msg.text}
                      </p>
                    </div>
                    
                    {/* Message metadata */}
                    <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
                      <span className="text-[7px] sm:text-[8px] font-mono text-zinc-600">
                        ID: {msg.id.slice(0, 4)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className='relative border-t border-zinc-800/90 bg-black/50 backdrop-blur-xl p-3 sm:p-4 lg:p-5'>
        <div className='max-w-5xl mx-auto w-full'>
          <div className='flex gap-2 sm:gap-3 items-end'>
            <div className='flex-1 relative group/input'>
              <div className='absolute -inset-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-lg sm:rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-500 blur-sm' />
              
              <div className='relative'>
                <span className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-green-500 font-mono text-xs sm:text-sm font-bold'>
                  {'>'}
                </span>
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={input}
                  maxLength={500}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim()) {
                      sendMessage({ text: input })
                      inputRef.current?.focus()
                    }
                  }}
                  placeholder="Type your encrypted message..."
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-800/90 focus:border-green-500/50 focus:outline-none transition-all duration-300 text-zinc-100 placeholder:text-zinc-700 py-3 sm:py-3.5 lg:py-4 pl-8 sm:pl-10 pr-16 sm:pr-20 text-xs sm:text-sm rounded-lg sm:rounded-xl font-mono focus:ring-2 focus:ring-green-500/20 shadow-lg"
                />
                
                {/* Character count */}
                {input.length > 0 && (
                  <div className='absolute right-2 sm:right-3 top-1/2 -translate-y-1/2'>
                    <span className={`text-[9px] sm:text-[10px] font-mono ${input.length > 450 ? 'text-amber-500' : 'text-zinc-600'}`}>
                      {input.length}/500
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                sendMessage({ text: input })
                inputRef.current?.focus()
              }}
              disabled={!input.trim() || isPending}
              className="group/btn relative disabled:cursor-not-allowed flex-shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg sm:rounded-xl opacity-20 group-hover/btn:opacity-40 blur-md transition-opacity disabled:opacity-0" />
              
              <div className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 rounded-lg sm:rounded-xl transition-all duration-300 ${
                !input.trim() || isPending
                  ? 'bg-zinc-900 border border-zinc-800'
                  : 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-500/40 hover:border-green-500/60 hover:scale-105 shadow-lg shadow-green-500/10'
              }`}>
                {isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    <span className='hidden sm:inline text-[10px] sm:text-xs font-mono font-bold text-green-400/70'>
                      SENDING
                    </span>
                  </>
                ) : (
                  <>
                    <Send className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${input.trim() ? 'text-green-400' : 'text-zinc-600'}`} />
                    <span className={`hidden sm:inline text-[10px] sm:text-xs font-mono font-bold ${
                      input.trim() ? 'text-green-400' : 'text-zinc-600'
                    }`}>
                      SEND
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Security badges */}
          <div className='flex items-center justify-center sm:justify-end gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap'>
            <div className='flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full bg-black/40 border border-zinc-800/50'>
              <Lock className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-zinc-700 flex-shrink-0' />
              <span className='text-[7px] sm:text-[8px] font-mono text-zinc-700 whitespace-nowrap'>
                END-TO-END ENCRYPTED
              </span>
            </div>
            <div className='flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full bg-black/40 border border-zinc-800/50'>
              <Shield className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-zinc-700 flex-shrink-0' />
              <span className='text-[7px] sm:text-[8px] font-mono text-zinc-700 whitespace-nowrap'>
                SELF-DESTRUCT
              </span>
            </div>
            <div className='flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full bg-black/40 border border-zinc-800/50'>
              <Eye className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-zinc-700 flex-shrink-0' />
              <span className='text-[7px] sm:text-[8px] font-mono text-zinc-700 whitespace-nowrap'>
                ZERO-KNOWLEDGE
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Page