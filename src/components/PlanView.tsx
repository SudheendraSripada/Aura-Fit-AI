import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Dumbbell, 
  Utensils, 
  RefreshCw, 
  ListChecks, 
  Flame, 
  Scale, 
  ArrowUpRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { UserProfile, WorkoutPlan, DietPlan } from '../types';
import { generateFitnessPlan } from '../services/gemini';
import { cn } from '../lib/utils';

export default function PlanView({ profile }: { profile: UserProfile }) {
  const [plan, setPlan] = useState<{ workout: WorkoutPlan, diet: DietPlan } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const data = await generateFitnessPlan(profile);
      setPlan(data);
      localStorage.setItem(`aura_plan_${profile.userId}`, JSON.stringify(data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(`aura_plan_${profile.userId}`);
    if (saved) {
      setPlan(JSON.parse(saved));
    } else {
      fetchPlan();
    }
  }, [profile.userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-neutral-100 rounded-full" />
          <div className="w-24 h-24 border-t-4 border-brand rounded-full absolute inset-0 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-brand animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold tracking-tight mb-2 dark:text-[#EDEDED]">Architecting Your Evolution</h3>
          <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium">Gemini is processing your biometrics and health conditions...</p>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter dark:text-[#EDEDED]">Your Blueprint</h2>
          <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium">Precision engineered for {profile.goal.replace('_', ' ')}.</p>
        </div>
        <button 
          onClick={fetchPlan}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2A2A2A] text-neutral-500 dark:text-[#A0A0A0] hover:text-brand hover:border-brand transition-all font-bold text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate Plans
        </button>
      </header>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Workout Plan */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="bg-brand p-3 rounded-2xl shadow-lg shadow-brand/20">
                <Dumbbell className="text-white w-6 h-6" />
             </div>
             <h3 className="text-2xl font-bold italic tracking-tight dark:text-[#EDEDED]">{plan.workout.title}</h3>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm dark:shadow-none overflow-hidden h-fit">
             <div className="p-8 bg-neutral-50 dark:bg-[#121212] border-b border-neutral-100 dark:border-[#2A2A2A] flex items-center justify-between">
                <div className="flex gap-4">
                   <div className="bg-white dark:bg-[#1E1E1E] px-4 py-1.5 rounded-full border border-neutral-200 dark:border-[#2A2A2A] text-xs font-bold uppercase tracking-widest dark:text-[#A0A0A0]">{plan.workout.level}</div>
                   <div className="bg-white dark:bg-[#1E1E1E] px-4 py-1.5 rounded-full border border-neutral-200 dark:border-[#2A2A2A] text-xs font-bold uppercase tracking-widest dark:text-[#A0A0A0]">{plan.workout.duration}</div>
                </div>
                <ListChecks className="text-neutral-300 dark:text-[#A0A0A0] w-6 h-6" />
             </div>
             <div className="p-8 space-y-6">
                {plan.workout.exercises.map((ex, i) => (
                  <div key={i} className="flex gap-6 group">
                     <span className="text-4xl font-bold text-neutral-100 dark:text-[#2A2A2A] group-hover:text-brand/20 transition-colors duration-500">0{i+1}</span>
                     <div className="flex-grow pt-1.5">
                        <h4 className="font-bold text-lg mb-1 dark:text-[#EDEDED]">{ex.name}</h4>
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#A0A0A0] mb-2">
                           <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {ex.sets} Sets</span>
                           <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> {ex.reps}</span>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-[#A0A0A0] leading-relaxed italic">{ex.notes}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Diet Plan */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                <Utensils className="text-white w-6 h-6" />
             </div>
             <h3 className="text-2xl font-bold italic tracking-tight dark:text-[#EDEDED]">{plan.diet.title}</h3>
          </div>

          <div className="space-y-6">
             <div className="grid grid-cols-3 gap-4">
                <MacroCard label="Protein" value={plan.diet.macros.protein} color="blue" />
                <MacroCard label="Carbs" value={plan.diet.macros.carbs} color="amber" />
                <MacroCard label="Fats" value={plan.diet.macros.fats} color="rose" />
             </div>

             <div className="bg-neutral-900 border-none rounded-[2.5rem] p-1 shadow-2xl overflow-hidden">
                <div className="bg-neutral-950 rounded-[2.4rem] p-8 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                         <Flame className="text-brand w-5 h-5" />
                         <span className="text-2xl font-bold">{plan.diet.dailyCalories}</span>
                         <span className="text-neutral-500 text-sm">Avg kcal/day</span>
                      </div>
                      <Scale className="text-neutral-800 w-10 h-10" />
                   </div>
                   
                   <div className="space-y-4">
                    {plan.diet.meals.map((meal, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 transition-colors border border-white/5">
                        <div className="min-w-[70px] text-xs font-bold text-neutral-500 uppercase tracking-widest pt-1">{meal.time}</div>
                        <div className="text-neutral-200 font-medium leading-relaxed">{meal.suggestion}</div>
                      </div>
                    ))}
                   </div>
                </div>
             </div>

             {/* PRECAUTIONARY DIET SECTION */}
             {(plan.diet.precautionaryNotes?.length || plan.diet.healthWarnings?.length) ? (
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] dark:text-[#EDEDED] ml-2">
                     <ShieldAlert className="w-4 h-4 text-brand" />
                     Healthwise Precautions
                  </div>
                  
                  {plan.diet.healthWarnings && plan.diet.healthWarnings.length > 0 && (
                    <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 space-y-3 shadow-lg shadow-rose-500/5">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <ShieldAlert className="w-5 h-5" />
                        Critical Safety Warnings
                      </div>
                      <ul className="space-y-2">
                        {plan.diet.healthWarnings.map((warning, idx) => (
                          <li key={idx} className="text-xs font-medium pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-rose-500 before:rounded-full">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.diet.precautionaryNotes && plan.diet.precautionaryNotes.length > 0 && (
                    <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-500 space-y-3 shadow-lg shadow-blue-500/5">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <Info className="w-5 h-5" />
                        Dietary Considerations
                      </div>
                      <ul className="space-y-2">
                        {plan.diet.precautionaryNotes.map((note, idx) => (
                          <li key={idx} className="text-xs font-medium pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-blue-500 before:rounded-full">
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
               </div>
             ) : (
                <div className="p-6 rounded-3xl bg-neutral-100 dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2A2A2A] text-neutral-500 dark:text-[#A0A0A0] flex items-center gap-3">
                  <Info className="w-5 h-5 text-neutral-400" />
                  <p className="text-xs font-bold uppercase tracking-wider">No specific health precautions detected</p>
                </div>
             )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MacroCard({ label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };
  return (
    <div className={cn("p-4 rounded-2xl border-2 text-center", colors[color])}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
