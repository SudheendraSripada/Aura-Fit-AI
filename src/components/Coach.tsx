import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, RefreshCcw, Smile, Mic } from 'lucide-react';
import { UserProfile } from '../types';
import { getCoachResponse } from '../services/gemini';
import { adminService } from '../services/adminService';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function Coach({ profile }: { profile: UserProfile }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: `Hello ${profile.name.split(' ')[0]}! I'm Aura, your AI fitness coach. How can I help you reach your ${profile.goal.replace('_', ' ')} goal today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    adminService.logActivity('coach_message_sent', { content: userMessage.substring(0, 50) });
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }] as [{ text: string }]
      }));
      
      const response = await getCoachResponse(userMessage, profile, history);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      adminService.logError('Coach AI Error', (error as Error).stack);
      setMessages(prev => [...prev, { role: 'model', content: "I'm having a bit of trouble connecting right now. Let's try again in a moment!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter flex items-center gap-3 dark:text-[#EDEDED]">
            Aura AI Coach
            <div className="bg-brand/10 dark:bg-brand/20 px-3 py-1 rounded-full border border-brand/20 dark:border-brand/30">
               <Sparkles className="w-4 h-4 text-brand" />
            </div>
          </h2>
          <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium">Real-time guidance, nutrition, and psychological motivation.</p>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', content: `Reset! Ready for a fresh start. How can I help?` }])}
          className="p-2 text-neutral-400 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-grow glass rounded-[2.5rem] border-neutral-200 dark:border-[#2A2A2A] shadow-xl shadow-neutral-100 dark:shadow-none overflow-hidden flex flex-col relative transition-colors duration-300">
        <div 
          ref={scrollRef}
          className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg",
                msg.role === 'user' ? "bg-black dark:bg-brand text-white" : "bg-brand dark:bg-[#1E1E1E] text-white"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={cn(
                "p-5 rounded-[1.5rem] shadow-sm",
                msg.role === 'user' 
                  ? "bg-black dark:bg-brand text-white rounded-tr-none" 
                  : "bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-[#EDEDED] rounded-tl-none border border-neutral-100 dark:border-[#2A2A2A]"
              )}>
                <div className="prose prose-sm max-w-none prose-neutral dark:prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 mr-auto">
              <div className="w-10 h-10 rounded-2xl bg-brand dark:bg-[#1E1E1E] text-white flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-100 dark:border-[#2A2A2A] p-5 rounded-[1.5rem] rounded-tl-none flex gap-1 items-center shadow-sm">
                <div className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-brand/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 bg-neutral-50/50 dark:bg-[#121212]/50 border-t border-neutral-100 dark:border-[#2A2A2A]">
           <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Ask Aura anything about your fitness journey..."
                className="w-full pl-6 pr-32 py-5 bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2A2A2A] rounded-[2rem] focus:ring-2 focus:ring-brand outline-none transition-all shadow-lg shadow-neutral-100 dark:shadow-none dark:text-[#EDEDED]"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
              />
              <div className="absolute right-4 flex gap-2">
                <button className="p-2 text-neutral-400 hover:text-brand transition-colors rounded-full hover:bg-neutral-50 dark:hover:bg-[#2A2A2A]">
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-brand text-white p-3 rounded-2xl shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
           </div>
           <div className="flex gap-4 mt-6 justify-center">
              <SuggestionChip text="Suggest a breakfast" onClick={(txt) => setInput(txt)} />
              <SuggestionChip text="Fix my squat form" onClick={(txt) => setInput(txt)} />
              <SuggestionChip text="Post-workout tips" onClick={(txt) => setInput(txt)} />
           </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({ text, onClick }: { text: string, onClick: (s: string) => void }) {
  return (
    <button 
      onClick={() => onClick(text)}
      className="text-xs font-bold px-4 py-2 rounded-full border border-neutral-200 hover:border-brand hover:text-brand transition-all bg-white text-neutral-400"
    >
      {text}
    </button>
  );
}
