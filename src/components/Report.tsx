import React from 'react';
import { motion } from 'motion/react';
import { Mail, Flag, AlertCircle, Send, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { adminService } from '../services/adminService';

export default function Report() {
  const supportEmail = "aurafitai6@gmail.com";

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 rounded-full text-sm font-bold uppercase tracking-widest">
          <Flag className="w-4 h-4" />
          Feedback & Support
        </div>
        <h2 className="text-4xl font-bold tracking-tighter dark:text-[#EDEDED]">Report an Issue</h2>
        <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium max-w-lg mx-auto">
          Help us improve AuraFit. Whether it's a bug, a suggestion, or a general question, we're here to help.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Email Support Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm space-y-6"
        >
          <div className="bg-brand/10 w-14 h-14 rounded-2xl flex items-center justify-center">
            <Mail className="text-brand w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-bold dark:text-[#EDEDED]">Email Support</h3>
            <p className="text-neutral-500 dark:text-[#A0A0A0] mt-1 font-medium">Direct line to our engineering team.</p>
          </div>
          
          <div 
            onClick={() => {
              adminService.logActivity('report_email_click');
              const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}`;
              window.open(gmailUrl, '_blank');
            }}
            className="p-4 bg-neutral-50 dark:bg-[#121212] rounded-2xl border border-neutral-100 dark:border-[#2A2A2A] flex items-center justify-between group cursor-pointer hover:border-brand/50 transition-colors"
          >
            <span className="font-bold text-neutral-800 dark:text-[#EDEDED]">{supportEmail}</span>
            <div className="p-2 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 group-hover:scale-110 active:scale-95 transition-all">
              <Send className="w-4 h-4" />
            </div>
          </div>
          
          <p className="text-xs text-neutral-400 dark:text-[#A0A0A0] font-medium">
            Typical response time: <span className="text-emerald-500 font-bold">Under 24 hours</span>
          </p>
        </motion.div>

        {/* Categories Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-neutral-900 dark:bg-[#121212] p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl"
        >
          <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center">
            <AlertCircle className="text-brand w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold">What to Report</h3>
          
          <div className="space-y-4">
            <ReportPoint text="Technical bugs or application crashes" />
            <ReportPoint text="Inaccuracies in AI fitness assessments" />
            <ReportPoint text="Feature requests and UI suggestions" />
            <ReportPoint text="Health and safety concerns" />
          </div>

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-coach'))}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            Quick AI Chat Help
          </button>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-[3rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm text-center">
        <h4 className="text-xl font-bold dark:text-[#EDEDED] mb-2">Our Commitment</h4>
        <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium max-w-2xl mx-auto leading-relaxed">
          At AuraFit, your safety and experience are non-negotiable. Every report is reviewed by our core team to ensure Aura Intelligence remains the world's most reliable fitness partner.
        </p>
      </div>
    </div>
  );
}

function ReportPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-brand rounded-full" />
      <span className="text-sm font-medium text-neutral-300">{text}</span>
    </div>
  );
}
