import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  User,
  ShieldCheck,
  Zap,
  TrendingUp,
  RefreshCcw,
  BarChart3,
  Cpu,
  Server
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { ActivityLog, ErrorLog, AdminStats } from '../types';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalActivities: 0, totalErrors: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'errors'>('logs');

  useEffect(() => {
    // Initial fetch of stats
    const fetchStats = async () => {
      try {
        const s = await adminService.getStats();
        setStats(s);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchStats();

    // Real-time subscriptions
    const unsubscribeLogs = adminService.subscribeToLogs((newLogs) => {
      setLogs(newLogs);
      setIsLoading(false);
    });

    const unsubscribeErrors = adminService.subscribeToErrors((newErrors) => {
      setErrors(newErrors);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeErrors();
    };
  }, []);

  const refreshStats = async () => {
    setIsLoading(true);
    const s = await adminService.getStats();
    setStats(s);
    setIsLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3 h-3" />
            Admin Intelligence Access
          </div>
          <h2 className="text-4xl font-bold tracking-tighter dark:text-[#EDEDED]">Aura Command</h2>
          <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium">Global platform health and activity monitoring.</p>
        </div>
        <button 
          onClick={refreshStats}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-[#1E1E1E] text-white rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/10"
        >
          <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Refresh Registry
        </button>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatItem 
          icon={<Users />} 
          label="Total Athletes" 
          value={stats.totalUsers.toString()} 
          color="brand"
          sub="Verified Users"
        />
        <StatItem 
          icon={<Activity />} 
          label="Pulse Actions" 
          value={stats.totalActivities.toString()} 
          color="emerald"
          sub="Last 30 Days"
        />
        <StatItem 
          icon={<AlertTriangle />} 
          label="Logic Errors" 
          value={stats.totalErrors.toString()} 
          color="rose"
          sub="Critical Logs"
        />
      </div>

      {/* Main Panel */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-neutral-100 dark:border-[#2A2A2A] p-2">
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn(
              "flex-grow flex items-center justify-center gap-2 py-4 font-bold text-sm rounded-2xl transition-all",
              activeTab === 'logs' ? "bg-brand text-white shadow-lg" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-[#EDEDED]"
            )}
          >
            <Server className="w-4 h-4" />
            Activity Registry
          </button>
          <button 
            onClick={() => setActiveTab('errors')}
            className={cn(
              "flex-grow flex items-center justify-center gap-2 py-4 font-bold text-sm rounded-2xl transition-all",
              activeTab === 'errors' ? "bg-rose-500 text-white shadow-lg" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-[#EDEDED]"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            Error Monitor
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden flex flex-col p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'logs' ? (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-grow overflow-y-auto space-y-4 no-scrollbar"
              >
                {logs.length === 0 ? (
                  <EmptyState message="No activity detected yet..." />
                ) : (
                  logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="errors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-grow overflow-y-auto space-y-4 no-scrollbar"
              >
                {errors.length === 0 ? (
                  <EmptyState message="System logic is healthy." />
                ) : (
                  errors.map((error) => (
                    <ErrorItem key={error.id} error={error} />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, color, sub }: any) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm flex items-center justify-between group">
      <div>
        <p className="text-neutral-400 dark:text-[#A0A0A0] text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tighter dark:text-[#EDEDED]">{value}</span>
          <span className="text-neutral-500 text-xs font-bold">{sub}</span>
        </div>
      </div>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
        color === 'brand' ? "bg-brand/10 text-brand" :
        color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
        "bg-rose-500/10 text-rose-500"
      )}>
        {React.cloneElement(icon, { className: "w-7 h-7" })}
      </div>
    </div>
  );
}

function LogItem({ log }: { log: ActivityLog }) {
  const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
  
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-[#121212] rounded-2xl transition-colors group">
      <div className="bg-neutral-100 dark:bg-[#2A2A2A] w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
        <Activity className="w-5 h-5 text-neutral-400 group-hover:text-brand transition-colors" />
      </div>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-sm dark:text-[#EDEDED]">{log.action}</p>
          <span className="text-[10px] font-medium text-neutral-400 italic">
            {date.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-[#A0A0A0]">
          <span className="font-bold text-brand/80">{log.userId.substring(0, 8)}...</span>
          <span>•</span>
          <span className="truncate max-w-[300px]">
            {log.details ? JSON.stringify(log.details) : 'No details available'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ErrorItem({ error }: { error: ErrorLog }) {
  const date = error.timestamp?.toDate ? error.timestamp.toDate() : new Date();

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-rose-50/50 dark:hover:bg-rose-500/5 rounded-2xl transition-colors group border border-transparent hover:border-rose-500/20">
      <div className="bg-rose-500/10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5 text-rose-500" />
      </div>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-sm text-rose-600 dark:text-rose-400">{error.message}</p>
          <span className="text-[10px] font-medium text-neutral-400 italic">
            {date.toLocaleTimeString()}
          </span>
        </div>
        <div className="text-[10px] bg-neutral-100 dark:bg-[#2A2A2A] p-2 rounded-lg font-mono text-neutral-500 dark:text-[#A0A0A0] mt-2 overflow-x-auto">
          {error.stack?.substring(0, 200)}...
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 py-20">
      <Cpu className="w-16 h-16 text-neutral-300" />
      <p className="font-bold text-sm tracking-widest uppercase text-neutral-400">{message}</p>
    </div>
  );
}
