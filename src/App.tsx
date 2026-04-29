import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Camera, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  ArrowRight,
  TrendingUp,
  Award,
  CircleStop,
  Menu,
  X,
  ShieldAlert,
  HelpCircle,
  Loader2,
  User,
  Sun,
  Moon,
  Flag,
  AlertTriangle,
  ShieldCheck,
  Users,
  Zap
} from 'lucide-react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from './lib/firebase';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import PostureAI from './components/PostureAI';
import Coach from './components/Coach';
import PlanView from './components/PlanView';
import Landing from './components/Landing';
import InjuryRiskAssessment from './components/InjuryRiskAssessment';
import FloatingChatCoach from './components/FloatingChatCoach';
import FAQs from './components/FAQs';
import Report from './components/Report';
import Social from './components/Social';
import AdminDashboard from './components/AdminDashboard';
import LoadingOverlay from './components/LoadingOverlay';
import { UserProfile, ActivityLog } from './types';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { themeService } from './services/themeService';
import { adminService } from './services/adminService';
import { User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'camera' | 'coach' | 'plan' | 'risk' | 'social' | 'faqs' | 'report' | 'admin'>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLanding, setIsLanding] = useState(true);
  const [showReportLanding, setShowReportLanding] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState<{message: string, senderName: string} | null>(null);

  // Monitor Encouragement
  useEffect(() => {
    if (!user) return;
    
    // Listen to friendships where I am the receiver
    const q1 = query(
      collection(db, 'friendships'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'accepted')
    );

    const q2 = query(
      collection(db, 'friendships'),
      where('requesterId', '==', user.uid),
      where('status', '==', 'accepted')
    );

    const handleChanges = (snapshot: any) => {
      snapshot.docChanges().forEach((change: any) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          if (data.lastEncouragementBy && data.lastEncouragementBy !== user.uid) {
            const senderName = data.lastEncouragementBy === data.requesterId ? data.requesterName : data.receiverName;
            setNotification({
              message: "Sent you some evolution energy!",
              senderName: senderName || "A friend"
            });
            setTimeout(() => setNotification(null), 5000);
          }
        }
      });
    };

    const handleError = (error: any) => {
      console.error('Firestore Error in Friendship Snapshot:', error);
      // Log to errors collection if needed
      adminService.logError("Friendship Snapshot Error", error.stack || error.message, user.uid);
    };

    const unsub1 = onSnapshot(q1, handleChanges, handleError);
    const unsub2 = onSnapshot(q2, handleChanges, handleError);

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // Prevent background scroll when sidebar is open on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  // Initialize Theme
  useEffect(() => {
    const currentTheme = themeService.init();
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    themeService.setTheme(nextTheme);
    setTheme(nextTheme);
  };

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Simple admin check based on email
        const adminEmail = 'saik13200@gmail.com';
        setIsAdmin(firebaseUser.email === adminEmail);

        try {
          const cloudProfile = await dataService.getUserProfile(firebaseUser.uid);
          if (cloudProfile) {
            setProfile(cloudProfile);
            setIsLanding(false);
            setShowOnboarding(false);
            adminService.logActivity('login', { email: firebaseUser.email }, firebaseUser.uid);
          } else {
            setProfile(null);
            setIsLanding(false);
            setShowOnboarding(true);
            adminService.logActivity('onboarding_start', { email: firebaseUser.email }, firebaseUser.uid);
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
          adminService.logError("Profile Load Error", (err as Error).stack, firebaseUser.uid);
        }
      } else {
        setProfile(null);
        setIsLanding(true);
        setShowOnboarding(false);
        setIsAdmin(false);
      }
      setIsInitialLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    if (user) {
      await dataService.saveUserProfile(user.uid, newProfile);
    }
    setProfile(newProfile);
    setShowOnboarding(false);
    setIsLanding(false);
  };

  const resetProfile = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    const handleOpenCoach = () => setActiveTab('coach');
    const handleSwitchTab = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    
    window.addEventListener('open-coach', handleOpenCoach);
    window.addEventListener('switch-tab', handleSwitchTab);
    
    return () => {
      window.removeEventListener('open-coach', handleOpenCoach);
      window.removeEventListener('switch-tab', handleSwitchTab);
    };
  }, []);

  if (isInitialLoading) {
    return <LoadingOverlay />;
  }

  if (isLanding) {
    if (showReportLanding) {
      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#121212] p-8 md:p-12">
          <div className="max-w-4xl mx-auto mb-8">
            <button 
              onClick={() => setShowReportLanding(false)}
              className="px-6 py-2 bg-neutral-200 dark:bg-[#1E1E1E] rounded-full font-bold text-sm dark:text-white"
            >
              Back to Home
            </button>
          </div>
          <Report />
        </div>
      );
    }
    return (
      <Landing 
        onGetStarted={() => setShowOnboarding(true)} 
        showOnboarding={showOnboarding} 
        onComplete={handleOnboardingComplete} 
        onShowReport={() => setShowReportLanding(true)}
      />
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profile={profile!} />;
      case 'camera':
        return <PostureAI />;
      case 'coach':
        return <Coach profile={profile!} />;
      case 'plan':
        return <PlanView profile={profile!} />;
      case 'risk':
        return <InjuryRiskAssessment profile={profile!} />;
      case 'social':
        return <Social profile={profile!} />;
      case 'faqs':
        return <FAQs />;
      case 'report':
        return <Report />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Dashboard profile={profile!} />;
    }
  };

  return (
    <div className="h-screen bg-neutral-50 dark:bg-[#121212] flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      <AnimatePresence>
        {isInitialLoading && <LoadingOverlay />}
      </AnimatePresence>

      {/* Mobile Navbar */}
      <div className="md:hidden glass shrink-0 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-brand w-6 h-6" />
          <span className="font-bold text-xl tracking-tight dark:text-[#EDEDED]">AURAFIT</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 bg-neutral-100 dark:bg-[#1E1E1E] rounded-xl text-neutral-500 dark:text-[#A0A0A0]"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="dark:text-[#EDEDED]">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <nav className={cn(
        "bg-white dark:bg-[#1E1E1E] border-r border-neutral-200 dark:border-[#2A2A2A] z-40 transition-transform duration-300",
        "fixed md:relative top-0 h-screen w-64 p-6 flex flex-col gap-8 shrink-0 overflow-y-auto",
        isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )} style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-brand p-2 rounded-xl">
            <Dumbbell className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tighter dark:text-[#EDEDED]">AURAFIT</span>
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} 
          />
          <NavItem 
            icon={<Camera />} 
            label="Live Assessment" 
            active={activeTab === 'camera'} 
            onClick={() => { setActiveTab('camera'); setIsMenuOpen(false); }} 
          />
          <NavItem 
            icon={<MessageSquare />} 
            label="AI Coach" 
            active={activeTab === 'coach'} 
            onClick={() => { setActiveTab('coach'); setIsMenuOpen(false); }} 
          />
          <NavItem 
            icon={<TrendingUp />} 
            label="My Plan" 
            active={activeTab === 'plan'} 
            onClick={() => { setActiveTab('plan'); setIsMenuOpen(false); }} 
          />
          <NavItem 
            icon={<ShieldAlert />} 
            label="Injury Risk" 
            active={activeTab === 'risk'} 
            onClick={() => { setActiveTab('risk'); setIsMenuOpen(false); }} 
          />
          <NavItem 
            icon={<Users />} 
            label="Social" 
            active={activeTab === 'social'} 
            onClick={() => { setActiveTab('social'); setIsMenuOpen(false); }} 
          />
          <NavItem 
            icon={<HelpCircle />} 
            label="FAQs" 
            active={activeTab === 'faqs'} 
            onClick={() => { setActiveTab('faqs'); setIsMenuOpen(false); }} 
          />
          <NavItem 
            icon={<Flag />} 
            label="Report Issue" 
            active={activeTab === 'report'} 
            onClick={() => { setActiveTab('report'); setIsMenuOpen(false); }} 
          />
          {isAdmin && (
            <NavItem 
              icon={<ShieldCheck className="text-brand" />} 
              label="Aura Command" 
              active={activeTab === 'admin'} 
              onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }} 
            />
          )}
        </div>

        <div className="pt-6 border-t border-neutral-100 dark:border-[#2A2A2A] space-y-4">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#2A2A2A]"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          
          {profile && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-[#2A2A2A] flex items-center justify-center">
                <User className="w-5 h-5 text-neutral-400 dark:text-[#A0A0A0]" />
              </div>
              <div>
                <p className="font-medium text-sm dark:text-[#EDEDED]">{profile.name}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  {profile.goal?.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}
          <button 
            onClick={resetProfile}
            className="flex items-center gap-2 text-neutral-400 hover:text-red-500 transition-colors text-sm font-medium w-full"
          >
            <Settings className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {profile && <FloatingChatCoach profile={profile} />}

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
          >
            <div className="bg-neutral-900 dark:bg-brand text-white p-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-brand dark:text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Success Momentum</p>
                <p className="font-bold text-sm">
                  <span className="text-brand dark:text-white underline decoration-2">{notification.senderName}</span> {notification.message}
                </p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="ml-auto p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
        active 
          ? "bg-brand text-white shadow-lg shadow-brand/20 scale-105" 
          : "text-neutral-500 dark:text-[#A0A0A0] hover:bg-neutral-100 dark:hover:bg-[#2A2A2A]"
      )}
    >
      {React.cloneElement(icon as any, { className: "w-5 h-5" })}
      <span>{label}</span>
      {active && <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );
}

import { cn } from './lib/utils';
