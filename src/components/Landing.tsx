import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Zap, 
  Target, 
  ShieldCheck, 
  Heart, 
  Camera, 
  Info, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  Brain,
  Twitter,
  Github,
  Instagram,
  Facebook
} from 'lucide-react';
import Onboarding from './Onboarding';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface LandingProps {
  onGetStarted: () => void;
  showOnboarding: boolean;
  onComplete: (profile: UserProfile) => void;
  onShowReport?: () => void;
}

export default function Landing({ onGetStarted, showOnboarding, onComplete, onShowReport }: LandingProps) {
  if (showOnboarding) {
    return <Onboarding onComplete={onComplete} />;
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-brand p-1.5 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tighter uppercase italic">AURAFIT AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onShowReport}
            className="hidden sm:block text-neutral-400 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors"
          >
            Report Issue
          </button>
          <button 
            onClick={onGetStarted}
            className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-neutral-200 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section / Site Overview */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-40">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <Brain className="w-4 h-4" />
              Intelligence Reimagined
            </div>
            <h1 className="text-7xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
              RECODE YOUR <br />
              <span className="text-brand italic">PHYSIQUE.</span>
            </h1>
            <p className="text-xl text-neutral-400 mb-10 max-w-lg leading-relaxed font-medium">
              AuraFit AI is a world-class biomechanical training partner. We use computer vision and Gemini intelligence to give you the advice of an elite coach, instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onGetStarted}
                className="bg-brand text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 group hover:shadow-[0_0_30px_rgba(255,87,34,0.3)] transition-all active:scale-95"
              >
                Access AI Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex -space-x-4 items-center pl-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-neutral-800" />
                ))}
                <span className="pl-6 text-sm text-neutral-500 font-medium">+12k Athletes Online</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[2.5rem] bg-neutral-900 border border-white/10 overflow-hidden relative group shadow-2xl">
              <img 
               src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=2070&auto=format&fit=crop" 
               alt="AuraFit AI Training" 
               className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
               referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8 space-y-4">
                <div className="glass p-5 rounded-[1.5rem] flex items-center gap-4 border-white/5 backdrop-blur-xl">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="text-emerald-500 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Real-time Form Scan</p>
                    <p className="text-xs text-neutral-400">98.4% Accuracy achieved</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* About AuraFit AI */}
        <section className="mb-40">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">Meet your AI Intelligence.</h2>
            <p className="text-neutral-400 text-lg font-medium">AuraFit isn't just an app—it's a living, breathing ecosystem of fitness science and advanced computer vision.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Camera />} 
              title="Form Vision" 
              desc="Our CV engine maps 33 key joint markers to ensure 100% rep perfection." 
            />
            <FeatureCard 
              icon={<Brain />} 
              title="Gemini Reasoning" 
              desc="Google's most advanced AI builds your daily metabolic blueprint." 
            />
            <FeatureCard 
              icon={<Zap />} 
              title="Instant Pulse" 
              desc="Real-time hydration, calorie, and rep data syncing as you move." 
            />
            <FeatureCard 
              icon={<Shield />} 
              title="Privacy Guard" 
              desc="On-device processing means your data never leaves your browser." 
            />
          </div>
        </section>

        {/* Safety & Biometrics */}
        <section className="mb-40 bg-neutral-900/40 rounded-[3rem] p-12 lg:p-20 border border-white/5">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 rounded-full text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                Safety Protocol
              </div>
              <h2 className="text-5xl font-bold tracking-tight leading-tight">Your safety is <br /> our code.</h2>
              <p className="text-neutral-400 text-lg leading-relaxed">
                AuraFit AI is designed with a "Safety First" architecture. Our injury risk assessment engine predicts imbalances before they become injuries, providing corrective plans in real-time.
              </p>
              <ul className="space-y-4 text-neutral-300 font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                  Real-time Joint Strain Alert System
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                  Automated Dehydration Warnings
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                  Over-training Fatigue Detection
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-neutral-800/50 p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="text-3xl font-bold italic text-brand">90%</div>
                <div className="text-sm font-bold uppercase tracking-widest text-neutral-500">Risk Reduction</div>
              </div>
              <div className="bg-neutral-800/50 p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="text-3xl font-bold italic text-brand">33+</div>
                <div className="text-sm font-bold uppercase tracking-widest text-neutral-500">Key Landmarks</div>
              </div>
              <div className="bg-neutral-800/50 p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="text-3xl font-bold italic text-brand">24/7</div>
                <div className="text-sm font-bold uppercase tracking-widest text-neutral-500">Coach Access</div>
              </div>
              <div className="bg-neutral-800/50 p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="text-3xl font-bold italic text-brand">100%</div>
                <div className="text-sm font-bold uppercase tracking-widest text-neutral-500">Privacy Score</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-40 max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Questions for Aura.</h2>
            <p className="text-neutral-500 font-medium">Everything you need to know about the AI revolution.</p>
          </div>
          <div className="space-y-4">
            <LandingFAQ 
              question="Is AuraFit really powered by AI?" 
              answer="Yes. We use cutting-edge Computer Vision for rep counting and Google's Gemini models for nutrition and specialized coaching logic." 
            />
            <LandingFAQ 
              question="Do I need a camera to train?" 
              answer="You can use the dashboard without a camera, but for the full Live Assessment experience, a front-facing camera is required to track your form." 
            />
            <LandingFAQ 
              question="Tell me about the privacy settings." 
              answer="All visual data is processed on-device. We never store video or upload it anywhere. Your health data is strictly yours." 
            />
          </div>
        </section>

        {/* Footer / Copyrights */}
        <footer className="pt-20 border-t border-white/10 mt-40">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <Zap className="text-brand w-6 h-6" />
                <span className="font-black text-2xl tracking-tighter italic">AURAFIT AI</span>
              </div>
              <p className="text-neutral-500 max-w-sm leading-relaxed font-medium">
                Leading the evolution of digital fitness. AuraFit AI blends human bio-mechanics with elite artificial intelligence.
              </p>
              <div className="flex gap-4">
                <SocialIcon icon={<Twitter />} />
                <SocialIcon icon={<Instagram />} />
                <SocialIcon icon={<Github />} />
                <SocialIcon icon={<Facebook />} />
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-neutral-300">Product</h4>
              <ul className="space-y-4 text-neutral-500 font-medium text-sm">
                <li><button className="hover:text-brand transition-colors">AI Dashboard</button></li>
                <li><button className="hover:text-brand transition-colors">Posture Scan</button></li>
                <li><button className="hover:text-brand transition-colors">Nutrition Engine</button></li>
                <li><button className="hover:text-brand transition-colors">Mobile App</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-neutral-300">Support</h4>
              <ul className="space-y-4 text-neutral-500 font-medium text-sm">
                <li><button onClick={onShowReport} className="hover:text-brand transition-colors">Report Issue</button></li>
                <li><button className="hover:text-brand transition-colors">FAQs</button></li>
                <li><button className="hover:text-brand transition-colors">Safety Report</button></li>
                <li><button className="hover:text-brand transition-colors">Direct Support</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-neutral-300">Company</h4>
              <ul className="space-y-4 text-neutral-500 font-medium text-sm">
                <li><button className="hover:text-brand transition-colors">About Us</button></li>
                <li><button className="hover:text-brand transition-colors">Safety Report</button></li>
                <li><button className="hover:text-brand transition-colors">Terms of Use</button></li>
                <li><button className="hover:text-brand transition-colors">Privacy Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center py-10 border-t border-white/5 text-xs font-bold text-neutral-600 uppercase tracking-widest gap-4">
            <p>© {new Date().getFullYear()} AURAFIT AI TECHNOLOGIES. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <span>Made with Gemini Intelligence</span>
              <span>San Francisco, CA</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-neutral-900/50 p-8 rounded-3xl border border-white/5 hover:border-brand/40 transition-all hover:-translate-y-2 group">
      <div className="mb-6 bg-neutral-800 group-hover:bg-brand w-14 h-14 rounded-2xl flex items-center justify-center transition-colors">
        {React.cloneElement(icon as any, { className: "w-7 h-7 text-brand group-hover:text-white" })}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-500 leading-relaxed text-sm font-medium">{desc}</p>
    </div>
  );
}

function LandingFAQ({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-neutral-900 shadow-2xl rounded-3xl overflow-hidden border border-white/5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-center justify-between gap-4"
      >
        <span className="font-bold text-neutral-200">{question}</span>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
          isOpen ? "bg-brand text-white rotate-180" : "bg-neutral-800 text-neutral-500"
        )}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6"
          >
            <p className="text-neutral-500 text-sm font-medium leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-500 hover:text-brand hover:border-brand transition-all">
      {React.cloneElement(icon as any, { className: "w-5 h-5" })}
    </button>
  );
}
