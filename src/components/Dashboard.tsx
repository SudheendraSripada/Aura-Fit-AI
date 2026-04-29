import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Clock, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  Activity,
  Award,
  Calendar,
  Utensils,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Footprints,
  Droplets,
  Flag
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { realTimeService, LiveMetrics } from '../services/realTimeService';
import { bmiService } from '../services/bmiService';
import { adminService } from '../services/adminService';

const data = [
  { name: 'Mon', calories: 2100 },
  { name: 'Tue', calories: 2350 },
  { name: 'Wed', calories: 1900 },
  { name: 'Thu', calories: 2500 },
  { name: 'Fri', calories: 2200 },
  { name: 'Sat', calories: 2700 },
  { name: 'Sun', calories: 2400 },
];

export default function Dashboard({ profile }: { profile: UserProfile }) {
  const [metrics, setMetrics] = useState<LiveMetrics>(realTimeService.getInitialMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => realTimeService.simulateMetrics(prev));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const bmi = bmiService.calculateBMI(profile.weight, profile.height);
  const bmiStatus = bmiService.getBMIStatus(bmi);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter dark:text-[#EDEDED]">Welcome back, {profile.name.split(' ')[0]}</h2>
          <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium">You're on track to reach your {profile.goal.replace('_', ' ')} goal.</p>
        </div>
        <div className="flex gap-2">
          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 border-neutral-200 dark:border-[#2A2A2A] shadow-sm">
            <Calendar className="w-4 h-4 text-brand" />
            <span className="text-sm font-bold dark:text-[#EDEDED]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="bg-brand text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand/20">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-bold underline underline-offset-4 decoration-2">5 Day Streak</span>
          </div>
        </div>
      </header>

      {/* Stats Grid - Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto pb-4 lg:grid lg:grid-cols-3 xl:grid-cols-6 gap-6 no-scrollbar snap-x">
        <div className="min-w-[280px] snap-center">
          <StatCard 
            icon={<Flame className="text-orange-500" />} 
            label="Active Calories" 
            value={metrics.calories.toString()} 
            unit="kcal" 
            trend="+12%" 
            color="orange"
            isLive
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <StatCard 
            icon={<Activity className="text-blue-500" />} 
            label="Heart Rate" 
            value={metrics.heartRate.toString()} 
            unit="bpm" 
            trend="Live" 
            color="blue"
            isLive
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <StatCard 
            icon={<Footprints className="text-emerald-500" />} 
            label="Step Count" 
            value={metrics.steps.toLocaleString()} 
            unit="steps" 
            trend="+840" 
            color="emerald"
            isLive
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <StatCard 
            icon={<Droplets className="text-cyan-500" />} 
            label="Hydration" 
            value={metrics.hydration.toFixed(1)} 
            unit="L" 
            trend="Target 3L" 
            color="cyan"
            isLive
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <StatCard 
            icon={<Clock className="text-purple-500" />} 
            label="Training Time" 
            value={metrics.activeMinutes.toString()} 
            unit="min" 
            trend="+5" 
            color="purple"
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <StatCard 
            icon={<Target className="text-emerald-500" />} 
            label="Rep Accuracy" 
            value="94" 
            unit="%" 
            trend="+3%" 
            color="emerald"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Chart */}
          <div className="dark-card p-8 rounded-[2rem] shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-xl flex items-center gap-2 dark:text-[#EDEDED]">
                <TrendingUp className="text-brand w-5 h-5" />
                Activity Progress
              </h3>
              <select className="bg-neutral-50 dark:bg-[#1E1E1E] border-none rounded-lg text-xs font-bold px-3 py-1 outline-none dark:text-[#A0A0A0]">
                <option>Last 7 Days</option>
                <option>Last Month</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5722" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ff5722" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-neutral-200 dark:text-[#2A2A2A]" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fontWeight: 600, fill: 'currentColor'}} 
                    dy={10} 
                    className="text-neutral-400 dark:text-[#A0A0A0]"
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700, color: '#ff5722' }}
                  />
                  <Area type="monotone" dataKey="calories" stroke="#ff5722" strokeWidth={3} fillOpacity={1} fill="url(#colorCal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Scrollable Recent Activity */}
          <div className="dark-card p-8 rounded-[2.5rem] shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl dark:text-[#EDEDED]">Recent Activity</h3>
                <button className="text-sm font-bold text-brand hover:underline">View All</button>
             </div>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                <ActivityRow title="HIIT Core Session" category="Workout" time="2h ago" calories="320" status="Completed" />
                <ActivityRow title="Protein Intake Log" category="Diet" time="4h ago" calories="450" status="Logged" />
                <ActivityRow title="Posture Scan" category="Health" time="10h ago" calories="-" status="Audit Done" />
                <ActivityRow title="Morning Run" category="Cardio" time="1d ago" calories="280" status="Completed" />
                <ActivityRow title="Chest Day" category="Strength" time="1d ago" calories="410" status="Completed" />
             </div>
          </div>
        </div>

        {/* Right Info Cards */}
        <div className="space-y-6">
          {/* Today's Goal & BMI View */}
          <div className="bg-neutral-900 dark:bg-[#1E1E1E] text-white p-8 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              < Award className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <p className="text-neutral-400 dark:text-[#A0A0A0] font-bold text-xs uppercase tracking-widest mb-2">Daily Goal</p>
              <h4 className="text-3xl font-bold mb-4">Hit 2,500 kcal <br /> intake today</h4>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold">{(metrics.calories + 1078).toString()}</span>
                <span className="text-neutral-500 dark:text-[#A0A0A0] font-bold pb-1">/ 2,500</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 dark:bg-[#121212] rounded-full overflow-hidden mb-8">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-brand"
                />
              </div>

              {/* BMI SECTION */}
              <div className="pt-6 border-t border-white/10 dark:border-[#2A2A2A]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-neutral-400 dark:text-[#A0A0A0] font-bold text-xs uppercase tracking-widest">Body Mass Index (BMI)</p>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", `bg-${bmiStatus.color}/20 text-${bmiStatus.color}`)}>
                    {bmiStatus.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold tracking-tight">{bmi}</span>
                  <span className="text-neutral-500 dark:text-[#A0A0A0] text-sm font-medium">kg/m²</span>
                </div>
                
                {/* BMI Gauge */}
                <div className="relative h-2 w-full bg-neutral-800 dark:bg-[#121212] rounded-full flex overflow-hidden">
                  <div className="h-full w-[18.5%] bg-blue-500/40" />
                  <div className="h-full w-[6.5%] bg-emerald-500/40" />
                  <div className="h-full w-[5%] bg-yellow-500/40" />
                  <div className="h-full flex-grow bg-red-500/40" />
                  
                  {/* Marker */}
                  <motion.div 
                    initial={{ left: 0 }}
                    animate={{ left: `${Math.min(Math.max((bmi - 15) * 4, 0), 100)}%` }}
                    className="absolute top-0 w-1 h-full bg-white shadow-[0_0_10px_white] z-10"
                  />
                </div>
                <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-neutral-600 dark:text-[#A0A0A0] uppercase tracking-tighter">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dark-card p-6 rounded-[2rem] shadow-sm space-y-4">
            <h4 className="font-bold mb-4 dark:text-[#EDEDED]">Quick Actions</h4>
            <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] transition-colors group">
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-xl group-hover:bg-brand transition-colors">
                <Utensils className="w-5 h-5 text-brand group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm dark:text-[#EDEDED]">Update Weight</p>
                <p className="text-xs text-neutral-400 dark:text-[#A0A0A0]">Keep tracking progress</p>
              </div>
              <ChevronRight className="ml-auto w-4 h-4 text-neutral-300 dark:text-[#A0A0A0]" />
            </button>
            <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] transition-colors group">
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl group-hover:bg-blue-500 transition-colors">
                <Activity className="w-5 h-5 text-blue-500 group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm dark:text-[#EDEDED]">New Workout</p>
                <p className="text-xs text-neutral-400 dark:text-[#A0A0A0]">AI personal rotation</p>
              </div>
              <ChevronRight className="ml-auto w-4 h-4 text-neutral-300 dark:text-[#A0A0A0]" />
            </button>
            <button 
              onClick={() => {
                adminService.logActivity('dashboard_report_issue_click');
                window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'report' }));
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] transition-colors group"
            >
              <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl group-hover:bg-rose-500 transition-colors">
                <Flag className="w-5 h-5 text-rose-500 group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm dark:text-[#EDEDED]">Report Issue</p>
                <p className="text-xs text-neutral-400 dark:text-[#A0A0A0]">Contact support team</p>
              </div>
              <ChevronRight className="ml-auto w-4 h-4 text-neutral-300 dark:text-[#A0A0A0]" />
            </button>
            <button className="w-full h-1 text-transparent pointer-events-none" /> {/* Spacer */}
            <div className="p-1 bg-gradient-to-br from-brand/10 to-rose-500/10 rounded-3xl">
              <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[1.4rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm flex items-center gap-4">
                <div className="bg-rose-50 dark:bg-rose-950 p-3 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                </div>
                <div>
                  <p className="font-bold text-sm dark:text-[#EDEDED]">Injury Risk Scan</p>
                  <p className="text-xs text-neutral-400 dark:text-[#A0A0A0]">Scan bio-mechanics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Teaser Section */}
      <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[3rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-brand p-3 rounded-2xl shadow-lg shadow-brand/20">
              <HelpCircle className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight dark:text-[#EDEDED]">Need help? FAQs</h3>
              <p className="text-neutral-500 dark:text-[#A0A0A0] text-sm font-medium">Quick answers to improve your training experience</p>
            </div>
          </div>
          <button 
            onClick={() => {
              adminService.logActivity('dashboard_faq_view_all');
              window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'faqs' }));
            }}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-[#1E1E1E] text-white rounded-2xl font-bold text-sm hover:bg-neutral-800 dark:hover:bg-[#2A2A2A] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-neutral-200 dark:shadow-none"
          >
            View all FAQs
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 relative z-10">
          <DashboardFAQ 
            question="How accurate is the AI tracking?" 
            answer="Our bio-mechanical engine achieves 98%+ precision in clear lighting. It analyzes 33 key points on your body to ensure every rep is perfect and safe."
          />
          <DashboardFAQ 
            question="Can I train without equipment?" 
            answer="Absolutely! AI AuraFit specializes in bodyweight movements. The AI Coach can pivot your entire plan to equipment-free sessions instantly."
          />
        </div>
      </div>
    </div>
  );
}

function DashboardFAQ({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full text-left p-6 rounded-[2rem] transition-all duration-300 flex items-center justify-between gap-4",
          isOpen ? "bg-neutral-900 dark:bg-[#121212] text-white shadow-2xl" : "bg-neutral-50 dark:bg-[#1E1E1E]/50 hover:bg-neutral-100 dark:hover:bg-[#1E1E1E] text-neutral-800 dark:text-[#EDEDED]"
        )}
      >
        <span className="font-bold text-sm md:text-base">{question}</span>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-brand text-white rotate-180" : "bg-neutral-200 dark:bg-[#2A2A2A] text-neutral-400"
        )}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-6 text-sm text-neutral-500 dark:text-[#A0A0A0] font-medium leading-relaxed bg-white/50 dark:bg-[#1E1E1E]/50 rounded-b-[2rem] border-x border-b border-neutral-100 dark:border-[#2A2A2A] mt-[-1rem] pt-8">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivityRow({ title, category, time, calories, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-[#1E1E1E]/50 hover:bg-neutral-100 dark:hover:bg-[#1E1E1E] transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-[#2A2A2A] group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#2A2A2A] flex items-center justify-center text-brand shadow-sm border border-neutral-100 dark:border-[#2A2A2A]">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm dark:text-[#EDEDED]">{title}</p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 dark:text-[#A0A0A0]">
            <span className="uppercase tracking-wider">{category}</span>
            <span>•</span>
            <span>{time}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-sm dark:text-[#EDEDED]">{calories === '-' ? '' : `${calories} kcal`}</p>
        <span className="text-[10px] font-bold text-emerald-500 uppercase">{status}</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, trend, color, isLive }: any) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-50 dark:bg-orange-950/30",
    blue: "bg-blue-50 dark:bg-blue-950/30",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10",
    cyan: "bg-cyan-50 dark:bg-cyan-950/30",
    purple: "bg-purple-50 dark:bg-purple-950/30"
  };

  return (
    <div className="dark-card p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow group relative">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(colorMap[color] || "bg-neutral-50 dark:bg-neutral-900", "p-3 rounded-2xl group-hover:scale-110 transition-transform")}>
          {React.cloneElement(icon as any, { className: "w-6 h-6" })}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-lg",
            trend.startsWith('+') 
              ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
              : 'text-neutral-400 dark:text-[#A0A0A0] bg-neutral-50 dark:bg-[#1E1E1E]'
          )}>
            {trend}
          </span>
          {isLive && (
             <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                </span>
                <span className="text-[8px] font-black tracking-widest text-brand uppercase">Live</span>
             </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-neutral-400 dark:text-[#A0A0A0] text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight dark:text-[#EDEDED]">{value}</span>
          <span className="text-neutral-400 dark:text-[#A0A0A0] text-sm font-medium">{unit}</span>
        </div>
      </div>
    </div>
  );
}
