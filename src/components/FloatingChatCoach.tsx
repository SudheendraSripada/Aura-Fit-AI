import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Minus, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { UserProfile } from '../types';
import { getCoachResponse } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function FloatingChatCoach({ profile }: { profile: UserProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: `Hey ${profile.name.split(' ')[0]}! I'm your AI Coach. Need quick help with your workout or diet?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Could not start recognition:', err);
      }
    }
  };

  const speak = (text: string) => {
    if (!isSpeakingEnabled) return;
    
    // Clean markdown for better speech
    const cleanText = text.replace(/[*#_\[\]()]/g, '').replace(/<[^>]*>?/gm, '');
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (messageOverride?: string) => {
    const userMessage = (messageOverride || input).trim();
    if (!userMessage || isTyping) return;

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
      speak(response);
      if (!isOpen) setHasUnread(true);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = "Sorry, I hit a snag. Can we try that again?";
      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
      speak(errorMsg);
      if (!isOpen) setHasUnread(true);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-[90vw] md:w-[400px] h-[500px] bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-[#2A2A2A] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand p-5 text-white flex items-center justify-between shadow-lg shadow-brand/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Aura Chat</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">AI Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title={isSpeakingEnabled ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
                >
                  {isSpeakingEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                    msg.role === 'user' ? "bg-neutral-800 dark:bg-[#EDEDED]/10 text-white dark:text-[#EDEDED]" : "bg-neutral-100 dark:bg-white/10 text-brand"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[75%] p-3 rounded-2xl text-sm group relative",
                    msg.role === 'user' 
                      ? "bg-neutral-800 dark:bg-[#121212] text-white dark:text-[#EDEDED] rounded-tr-none border dark:border-[#2A2A2A]" 
                      : "bg-neutral-50 dark:bg-[#121212] text-neutral-800 dark:text-[#EDEDED] rounded-tl-none border border-neutral-100 dark:border-[#2A2A2A]"
                  )}>
                    <div className="prose prose-xs max-w-none prose-neutral">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.role === 'model' && (
                      <button 
                        onClick={() => { setIsSpeakingEnabled(true); speak(msg.content); }}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 text-brand flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-neutral-50 dark:bg-[#121212] p-3 rounded-2xl rounded-tl-none flex gap-1 items-center border dark:border-[#2A2A2A]">
                    <div className="w-1 h-1 bg-brand/40 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-brand/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-50 dark:border-[#2A2A2A] bg-neutral-50/30 dark:bg-[#121212]">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-grow">
                  <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder={isListening ? "Listening..." : "Ask anything..."}
                    className={cn(
                      "w-full pl-4 pr-10 py-3 bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2A2A2A] rounded-2xl text-sm focus:ring-2 focus:ring-brand outline-none transition-all dark:text-[#EDEDED]",
                      isListening && "ring-2 ring-red-500 border-red-500 animate-pulse"
                    )}
                  />
                  <button 
                    onClick={toggleListening}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
                      isListening ? "text-red-500 bg-red-50" : "text-neutral-400 hover:text-brand hover:bg-brand/5"
                    )}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="bg-brand text-white p-3 rounded-xl disabled:opacity-50 transition-all hover:scale-105 shadow-lg shadow-brand/20 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-white dark:bg-[#1E1E1E] text-brand" : "bg-brand text-white"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && hasUnread && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-black dark:bg-[#EDEDED] text-white dark:text-[#121212] text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#121212]"
          >
            1
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
