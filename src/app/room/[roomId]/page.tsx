"use client";
import { useUsername } from '@/hooks/use-username';
import { client } from '@/lib/client';
import { useRealtime } from '@/lib/realtime-client';
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
  Link2
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
    if (timeRemaining === null || timeRemaining < 0) return

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
  }, [timeRemaining, router])


  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });
      return res.data;
    },
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

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") {
        refetch()
      }

      if (event === "chat.destroy") {
        router.push("/?destroyed=true")
      }
    }
  })

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await client.messages.delete(null, { query: { roomId } })
    }
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
      
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_70%,transparent_100%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <header className='relative border-b border-zinc-800/80 bg-black/40 backdrop-blur-xl p-4 flex items-center justify-between'>
        <div className='flex items-center gap-4 flex-wrap sm:flex-nowrap'>
          {/* Room Info */}
          <div className='flex items-center gap-3'>
            <div className='hidden sm:block relative'>
              <div className='absolute inset-0 bg-green-500/20 blur-sm rounded-lg' />
              <Terminal className='relative h-5 w-5 text-green-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1'>
                <Link2 className='h-3 w-3' />
                Room ID
              </span>
              <div className='flex items-center gap-2 mt-0.5'>
                <span className='font-mono text-sm font-bold text-green-400 bg-green-950/30 px-2 py-0.5 rounded border border-green-500/20'>
                  {roomId.slice(0, 8)}...{roomId.slice(-4)}
                </span>
                <button 
                  className='group/btn relative flex items-center gap-1.5 text-[10px] bg-zinc-800/80 hover:bg-zinc-700 px-2 py-1 rounded border border-zinc-700/50 transition-all hover:scale-105' 
                  onClick={copyLink}
                >
                  {copyStatus === 'COPY' ? (
                    <Copy className='h-3 w-3 text-zinc-400 group-hover/btn:text-green-400 transition-colors' />
                  ) : (
                    <Check className='h-3 w-3 text-green-400' />
                  )}
                  <span className={`text-[10px] font-mono ${copyStatus === 'COPIED' ? 'text-green-400' : 'text-zinc-400'}`}>
                    {copyStatus}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className='hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-zinc-700 to-transparent' />

          {/* Timer */}
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <Clock className={`h-4 w-4 ${timeRemaining !== null && timeRemaining < 60 ? 'text-red-400' : 'text-amber-400'}`} />
              <div className={`absolute inset-0 ${timeRemaining !== null && timeRemaining < 60 ? 'bg-red-500/20' : 'bg-amber-500/20'} blur-sm rounded-full`} />
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] font-mono text-zinc-500 uppercase tracking-wider'>
                Self-Destruct
              </span>
              <span className={`font-mono text-sm font-bold flex items-center gap-1 ${timeRemaining !== null && timeRemaining < 60 ? 'text-red-400' : 'text-amber-400'}`}>
                {timeRemaining !== null ? (
                  <>
                    <span className='tabular-nums'>{formatTimeRemaining(timeRemaining)}</span>
                    <span className='text-[8px] text-zinc-500'>remaining</span>
                  </>
                ) : (
                  '--:--'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Destroy Button */}
        <button 
          onClick={() => destroyRoom()} 
          className="group/btn relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity blur" />
          <div className="relative flex items-center gap-2 bg-zinc-900/80 hover:bg-red-600/20 border border-zinc-700/50 hover:border-red-500/50 px-3 py-2 rounded-lg transition-all duration-300">
            <Trash2 className='h-4 w-4 text-zinc-400 group-hover/btn:text-red-400 transition-colors' />
            <span className='hidden sm:inline text-xs font-mono font-bold text-zinc-400 group-hover/btn:text-red-400 transition-colors'>
              DESTROY
            </span>
            <span className='sm:hidden text-xs font-mono font-bold text-zinc-400 group-hover/btn:text-red-400'>
              END
            </span>
          </div>
        </button>
      </header>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-600'>
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none' />
        
        <div className='relative p-4 space-y-4 max-w-5xl mx-auto w-full'>
          {messages?.messages.length === 0 && (
            <div className='flex flex-col items-center justify-center h-[60vh]'>
              <div className='relative'>
                <div className='absolute inset-0 bg-green-500/10 blur-3xl rounded-full' />
                <Users className='relative h-12 w-12 text-green-500/30 mb-4' />
              </div>
              <p className='text-zinc-600 text-sm font-mono text-center'>
                <span className='text-green-500/50'>{'>'}</span> No messages yet, start the conversation!
              </p>
              <p className='text-[10px] text-zinc-700 font-mono mt-2'>
                All messages are ephemeral and encrypted
              </p>
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
                <div className={`max-w-[85%] sm:max-w-[70%] group relative`}>
                  {/* Sender info */}
                  {showAvatar && (
                    <div className={`flex items-baseline gap-2 mb-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isOwn ? 'bg-green-500/20' : 'bg-blue-500/20'
                        } border ${isOwn ? 'border-green-500/30' : 'border-blue-500/30'}`}>
                          <User className={`h-3 w-3 ${isOwn ? 'text-green-400' : 'text-blue-400'}`} />
                        </div>
                        <span className={`text-xs font-mono font-bold ${isOwn ? 'text-green-400' : 'text-blue-400'}`}>
                          {isOwn ? 'You' : msg.sender}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-600">
                        {format(msg.timestamp, "HH:mm:ss")}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`relative group/bubble ${!showAvatar ? 'mt-0.5' : ''}`}>
                    <div className={`absolute inset-0 ${
                      isOwn 
                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10' 
                        : 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10'
                    } rounded-2xl blur-md opacity-0 group-hover/bubble:opacity-100 transition-opacity`} />
                    
                    <div className={`relative px-4 py-2.5 rounded-2xl ${
                      isOwn 
                        ? 'bg-gradient-to-br from-green-950/40 to-emerald-950/40 border border-green-500/30' 
                        : 'bg-gradient-to-br from-zinc-900/90 to-black border border-zinc-800'
                    } backdrop-blur-xl`}>
                      <p className='text-sm text-zinc-200 leading-relaxed break-words font-mono'>
                        {msg.text}
                      </p>
                    </div>
                    
                    {/* Message metadata */}
                    <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <span className="text-[8px] font-mono text-zinc-600">
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
      <div className='relative border-t border-zinc-800/80 bg-black/40 backdrop-blur-xl p-4'>
        <div className='max-w-5xl mx-auto w-full'>
          <div className='flex gap-3 items-end'>
            <div className='flex-1 relative group/input'>
              <div className='absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover/input:opacity-100 transition duration-300 blur-sm' />
              
              <div className='relative'>
                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-mono text-sm'>
                  {'>'}
                </span>
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={input}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim()) {
                      sendMessage({ text: input })
                      inputRef.current?.focus()
                    }
                  }}
                  placeholder="Type your encrypted message..."
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-800/80 focus:border-green-500/50 focus:outline-none transition-all duration-300 text-zinc-100 placeholder:text-zinc-700 py-4 pl-10 pr-4 text-sm rounded-lg font-mono focus:ring-2 focus:ring-green-500/20"
                />
                
                {/* Character count */}
                {input.length > 0 && (
                  <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                    <span className='text-[10px] font-mono text-zinc-600'>
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
              className="group/btn relative disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg opacity-20 group-hover/btn:opacity-30 blur transition-opacity disabled:opacity-0" />
              
              <div className={`relative flex items-center justify-center gap-2 px-6 py-4 rounded-lg transition-all duration-300 ${
                !input.trim() || isPending
                  ? 'bg-zinc-900 border border-zinc-800'
                  : 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 hover:border-green-500/60 hover:scale-105'
              }`}>
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    <span className='hidden sm:inline text-xs font-mono font-bold text-green-400/70'>
                      SENDING
                    </span>
                  </>
                ) : (
                  <>
                    <Send className={`h-4 w-4 ${input.trim() ? 'text-green-400' : 'text-zinc-600'}`} />
                    <span className={`hidden sm:inline text-xs font-mono font-bold ${
                      input.trim() ? 'text-green-400' : 'text-zinc-600'
                    }`}>
                      SEND
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Security badge */}
          <div className='flex items-center justify-end gap-3 mt-2'>
            <div className='flex items-center gap-1.5'>
              <Lock className='h-3 w-3 text-zinc-700' />
              <span className='text-[8px] font-mono text-zinc-700'>
                END-TO-END ENCRYPTED
              </span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Shield className='h-3 w-3 text-zinc-700' />
              <span className='text-[8px] font-mono text-zinc-700'>
                MESSAGES SELF-DESTRUCT
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Page