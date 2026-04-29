import React from 'react';
import { motion } from 'motion/react';
import { Dumbbell } from 'lucide-react';

export default function LoadingOverlay() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[200] bg-white dark:bg-[#121212] flex flex-col items-center justify-center"
    >
      <div className="relative">
        {/* Outer Pulsing Rings */}
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-brand rounded-full blur-2xl"
        />
        
        <motion.div 
          animate={{ 
            rotate: 360 
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="w-32 h-32 rounded-full border-4 border-neutral-100 dark:border-[#2A2A2A] border-t-brand"
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="bg-brand p-5 rounded-2xl shadow-2xl shadow-brand/40 text-white"
          >
            <Dumbbell className="w-10 h-10" />
          </motion.div>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col items-center gap-2"
      >
        <h2 className="text-2xl font-black tracking-tighter text-neutral-900 dark:text-[#EDEDED] italic">AURAFIT</h2>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-1.5 h-1.5 bg-brand rounded-full"
            />
          ))}
        </div>
        <p className="text-neutral-400 dark:text-[#A0A0A0] text-xs font-bold uppercase tracking-widest mt-2">Initializing AI Aura</p>
      </motion.div>
    </motion.div>
  );
}
