import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, User, Activity, Dumbbell, Apple, Mail, Lock, AlertCircle, Loader2, Zap, Heart } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { adminService } from '../services/adminService';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

type Step = 'auth' | 'basic' | 'physical' | 'health' | 'goals' | 'forgot';

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    goal: 'overall_fitness',
    dietPreference: 'veg',
    activityLevel: 'moderate',
    gender: 'male',
    healthConditions: [],
    allergies: []
  });

  const handleAuth = async () => {
    setIsLoading(true);
    setAuthError('');
    try {
      if (step === 'forgot') {
        if (!email) {
          setAuthError('Please enter your email to reset your password.');
          setIsLoading(false);
          return;
        }
        await authService.sendPasswordReset(email);
        setResetSent(true);
      } else if (authMode === 'signup') {
        const user = await authService.signUp(email, password);
        setStep('basic');
      } else {
        const user = await authService.login(email, password);
        const profile = await dataService.getUserProfile(user.uid);
        if (profile) {
          onComplete(profile);
        } else {
          setStep('basic');
        }
      }
    } catch (error: any) {
      console.error(error);
      adminService.logError('Auth Error', error.stack || error.message);
      let message = 'Authentication failed. Please check your credentials.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please try again.';
      }
      
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    if (step === 'auth' || step === 'forgot') {
      await handleAuth();
    } else if (step === 'basic') {
      setStep('physical');
    } else if (step === 'physical') {
      setStep('health');
    } else if (step === 'health') {
      setStep('goals');
    } else {
      setIsLoading(true);
      const user = authService.getCurrentUser();
      if (user) {
        try {
          await dataService.saveUserProfile(user.uid, formData as UserProfile);
          // Small delay for simulation of plan preparation
          setTimeout(() => {
            setIsLoading(false);
            onComplete({ ...formData, userId: user.uid } as UserProfile);
          }, 2000);
        } catch (err: any) {
          setAuthError(err.message || "Failed to save profile.");
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setAuthError("No authenticated user found.");
      }
    }
  };

  const prevStep = () => {
    if (step === 'forgot') setStep('auth');
    else if (step === 'physical') setStep('basic');
    else if (step === 'health') setStep('physical');
    else if (step === 'goals') setStep('health');
    else if (step === 'basic') setStep('auth');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#121212] flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] shadow-2xl shadow-neutral-200 dark:shadow-none p-8 md:p-12 border border-neutral-100 dark:border-[#2A2A2A]"
      >
        <div className="flex items-center justify-between mb-12">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  (step === 'auth' && s === 1) || (step === 'basic' && s <= 2) || (step === 'physical' && s <= 3) || (step === 'health' && s <= 4) || (step === 'goals' && s <= 5)
                    ? "w-8 bg-brand" 
                    : "w-4 bg-neutral-200 dark:bg-[#121212]"
                )} 
              />
            ))}
          </div>
          {step !== 'auth' && (
            <button onClick={prevStep} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-[#EDEDED] flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 'auth' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3 dark:text-[#EDEDED]">
                  {authMode === 'signup' ? 'Create Account.' : 'Welcome Back.'}
                </h2>
                <p className="text-neutral-500 dark:text-[#A0A0A0]">
                  {authMode === 'signup' 
                    ? 'Start your AI-powered fitness journey with a secure account.' 
                    : 'Log in to sync your biometrics and continue your plan.'}
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 p-4 rounded-2xl flex items-start gap-3 border border-red-100 dark:border-red-500/20 italic text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#A0A0A0] w-5 h-5" />
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-[#121212] border-none rounded-2xl focus:ring-2 focus:ring-brand outline-none transition-all dark:text-[#EDEDED]"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#A0A0A0] w-5 h-5" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-[#121212] border-none rounded-2xl focus:ring-2 focus:ring-brand outline-none transition-all dark:text-[#EDEDED]"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                  {authMode === 'login' && (
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          setStep('forgot');
                          setAuthError('');
                          setResetSent(false);
                        }}
                        className="text-xs font-bold text-neutral-400 hover:text-brand transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                  className="text-sm font-bold text-neutral-400 hover:text-brand transition-colors"
                >
                  {authMode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'forgot' && (
            <motion.div 
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <button 
                  onClick={() => setStep('auth')}
                  className="mb-6 flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-brand transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Sign In
                </button>
                <h2 className="text-3xl font-bold tracking-tight mb-3 dark:text-[#EDEDED]">Reset Password.</h2>
                <p className="text-neutral-500 dark:text-[#A0A0A0]">Enter your registered email and we'll send you a secure link to reset your password.</p>
              </div>

              {authError && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 p-4 rounded-2xl flex items-start gap-3 border border-red-100 dark:border-red-500/20 italic text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {resetSent && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl flex items-start gap-3 border border-emerald-100 dark:border-emerald-500/20 italic text-sm font-bold">
                  <Zap className="w-5 h-5 shrink-0" />
                  <span>Reset link sent! Please check your inbox.</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#A0A0A0] w-5 h-5" />
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-[#121212] border-none rounded-2xl focus:ring-2 focus:ring-brand outline-none transition-all dark:text-[#EDEDED]"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'basic' && (
            <motion.div 
              key="basic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3 dark:text-[#EDEDED]">Welcome to AuraFit.</h2>
                <p className="text-neutral-500 dark:text-[#A0A0A0]">First, let's get to know you better. Your data is handled securely to personalize your experience.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#A0A0A0] w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Enter your name"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-[#121212] border-none rounded-2xl focus:ring-2 focus:ring-brand outline-none transition-all dark:text-[#EDEDED]"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Age</label>
                  <input 
                    type="number" 
                    placeholder="How old are you?"
                    className="w-full px-4 py-4 bg-neutral-50 dark:bg-[#121212] border-none rounded-2xl focus:ring-2 focus:ring-brand outline-none transition-all dark:text-[#EDEDED]"
                    value={formData.age || ''}
                    onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Gender</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['male', 'female', 'other', 'prefer_not_to_say'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={cn(
                          "px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center text-xs font-bold capitalize",
                          formData.gender === g 
                            ? "bg-brand/10 border-brand text-brand" 
                            : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-white/5 text-neutral-400"
                        )}
                      >
                        {g.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'physical' && (
            <motion.div 
              key="physical"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3 dark:text-[#EDEDED]">Your Metrics.</h2>
                <p className="text-neutral-500 dark:text-[#A0A0A0]">Essential biometrics for metabolic calculations and calorie planning.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Weight (kg)</label>
                  <input 
                    type="number" 
                    placeholder="00"
                    className="w-full px-4 py-4 bg-neutral-50 dark:bg-[#121212] border-none rounded-2xl focus:ring-2 focus:ring-brand outline-none transition-all font-mono dark:text-[#EDEDED]"
                    value={formData.weight || ''}
                    onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Height (cm)</label>
                  <input 
                    type="number" 
                    placeholder="000"
                    className="w-full px-4 py-4 bg-neutral-50 dark:bg-[#121212] border-none rounded-2xl focus:ring-2 focus:ring-brand outline-none transition-all font-mono dark:text-[#EDEDED]"
                    value={formData.height || ''}
                    onChange={e => setFormData({ ...formData, height: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Daily Activity</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['sedentary', 'moderate', 'active', 'athlete'] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setFormData({ ...formData, activityLevel: lvl })}
                      className={cn(
                        "px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center text-sm font-bold capitalize",
                        formData.activityLevel === lvl 
                          ? "bg-brand/10 border-brand text-brand" 
                          : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-white/5 text-neutral-400"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'health' && (
            <motion.div 
              key="health"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3 dark:text-[#EDEDED]">Health Check.</h2>
                <p className="text-neutral-500 dark:text-[#A0A0A0]">Any medical conditions we should know about? This helps us refine your nutrition plan.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="col-span-full mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand mb-4">Medical Conditions</h3>
                </div>
                {[
                  { id: 'none', label: 'No Diseases', icon: <Heart className="w-4 h-4 text-emerald-500" /> },
                  { id: 'diabetes', label: 'Diabetes', icon: <Activity className="w-4 h-4 text-blue-500" /> },
                  { id: 'hypertension', label: 'Hypertension', icon: <Heart className="w-4 h-4 text-red-500" /> },
                  { id: 'hypothyroidism', label: 'Hypothyroidism', icon: <Zap className="w-4 h-4 text-purple-500" /> },
                  { id: 'cvd', label: 'Cardiovascular', icon: <Heart className="w-4 h-4 text-rose-500" /> },
                  { id: 'pcod', label: 'PCOD / PCOS', icon: <User className="w-4 h-4 text-pink-500" /> },
                  { id: 'gluten', label: 'Gluten Intolerance', icon: <Apple className="w-4 h-4 text-amber-500" /> },
                ].map((condition) => {
                  const isSelected = formData.healthConditions?.includes(condition.id);
                  return (
                    <button
                      key={condition.id}
                      onClick={() => {
                        const current = formData.healthConditions || [];
                        if (condition.id === 'none') {
                          if (isSelected) {
                            setFormData({ ...formData, healthConditions: [] });
                          } else {
                            setFormData({ ...formData, healthConditions: ['none'] });
                          }
                          return;
                        }
                        
                        const filtered = current.filter(c => c !== 'none');
                        if (isSelected) {
                          setFormData({ ...formData, healthConditions: filtered.filter(c => c !== condition.id) });
                        } else {
                          setFormData({ ...formData, healthConditions: [...filtered, condition.id] });
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left group",
                        isSelected
                          ? "bg-brand/10 border-brand text-brand"
                          : "bg-white dark:bg-[#121212] border-neutral-100 dark:border-[#2A2A2A] text-neutral-600 dark:text-[#A0A0A0] hover:border-neutral-200"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isSelected ? "bg-brand/20" : "bg-neutral-100 dark:bg-[#1E1E1E] group-hover:bg-neutral-200"
                      )}>
                        {condition.icon}
                      </div>
                      <span className="font-bold text-sm tracking-tight">{condition.label}</span>
                    </button>
                  );
                })}

                <div className="col-span-full mt-6 mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand mb-4">Allergies</h3>
                </div>
                {[
                  { id: 'peanuts', label: 'Peanuts', icon: <Apple className="w-4 h-4 text-amber-700" /> },
                  { id: 'dairy', label: 'Dairy', icon: <Apple className="w-4 h-4 text-blue-200" /> },
                  { id: 'eggs', label: 'Eggs', icon: <Apple className="w-4 h-4 text-yellow-200" /> },
                  { id: 'fish', label: 'Fish', icon: <Zap className="w-4 h-4 text-cyan-400" /> },
                  { id: 'shellfish', label: 'Shellfish', icon: <Zap className="w-4 h-4 text-rose-300" /> },
                  { id: 'tree_nuts', label: 'Tree Nuts', icon: <Apple className="w-4 h-4 text-stone-600" /> },
                  { id: 'wheat', label: 'Wheat', icon: <Apple className="w-4 h-4 text-yellow-600" /> },
                  { id: 'soy', label: 'Soy', icon: <Apple className="w-4 h-4 text-green-300" /> },
                ].map((allergy) => {
                  const isSelected = formData.allergies?.includes(allergy.id);
                  return (
                    <button
                      key={allergy.id}
                      onClick={() => {
                        const current = formData.allergies || [];
                        if (isSelected) {
                          setFormData({ ...formData, allergies: current.filter(a => a !== allergy.id) });
                        } else {
                          setFormData({ ...formData, allergies: [...current, allergy.id] });
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left group",
                        isSelected
                          ? "bg-brand/10 border-brand text-brand"
                          : "bg-white dark:bg-[#121212] border-neutral-100 dark:border-[#2A2A2A] text-neutral-600 dark:text-[#A0A0A0] hover:border-neutral-200"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isSelected ? "bg-brand/20" : "bg-neutral-100 dark:bg-[#1E1E1E] group-hover:bg-neutral-200"
                      )}>
                        {allergy.icon}
                      </div>
                      <span className="font-bold text-sm tracking-tight">{allergy.label}</span>
                    </button>
                  );
                })}

                <div className="col-span-full mt-6">
                  <button
                    onClick={() => {
                      if (formData.healthConditions?.includes('none')) {
                        setFormData({ ...formData, healthConditions: [], allergies: [] });
                      } else {
                        setFormData({ ...formData, healthConditions: ['none'], allergies: [] });
                      }
                    }}
                    className={cn(
                      "flex items-center justify-center gap-3 p-4 w-full rounded-2xl border-2 transition-all text-center group",
                      formData.healthConditions?.includes('none')
                        ? "bg-brand/10 border-brand text-brand"
                        : "bg-white dark:bg-[#121212] border-neutral-100 dark:border-[#2A2A2A] text-neutral-600 dark:text-[#A0A0A0] hover:border-neutral-200"
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    <span className="font-bold text-sm tracking-tight">None of the above</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'goals' && (
            <motion.div 
              key="goals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3 dark:text-[#EDEDED]">Define Success.</h2>
                <p className="text-neutral-500 dark:text-[#A0A0A0]">What do you want to achieve with AuraFit?</p>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3">
                  {[
                    { id: 'weight_loss', label: 'Weight Loss', icon: <Activity /> },
                    { id: 'muscle_gain', label: 'Muscle Gain', icon: <Dumbbell /> },
                    { id: 'overall_fitness', label: 'Overall Fitness', icon: <Zap className="w-5 h-5" /> },
                  ].map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => setFormData({ ...formData, goal: goal.id as any })}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                        formData.goal === goal.id 
                          ? "bg-brand border-brand text-white shadow-lg shadow-brand/20" 
                          : "bg-white dark:bg-[#121212] border-neutral-100 dark:border-[#2A2A2A] text-neutral-600 dark:text-[#EDEDED] hover:border-neutral-200"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl",
                        formData.goal === goal.id ? "bg-white/20" : "bg-neutral-100 dark:bg-[#1E1E1E]"
                      )}>
                        {React.cloneElement(goal.icon as any, { className: "w-5 h-5" })}
                      </div>
                      <span className="font-bold">{goal.label}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-2 pt-4">
                  <label className="text-sm font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">Dietary Pref</label>
                  <div className="flex gap-2">
                    {(['veg', 'non-veg', 'vegan'] as const).map(pref => (
                      <button
                        key={pref}
                        onClick={() => setFormData({ ...formData, dietPreference: pref })}
                        className={cn(
                          "flex-1 py-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-wider",
                          formData.dietPreference === pref 
                            ? "bg-black dark:bg-brand border-black dark:border-brand text-white" 
                            : "bg-white dark:bg-[#121212] border-neutral-100 dark:border-[#2A2A2A] text-neutral-400 dark:text-[#A0A0A0]"
                        )}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={nextStep}
          disabled={
            isLoading || 
            (step === 'auth' && (!email || !password)) || 
            (step === 'forgot' && !email) || 
            (step === 'basic' && (!formData.name || !formData.age || !formData.gender)) ||
            (step === 'physical' && (!formData.weight || !formData.height)) ||
            (step === 'health' && false) || 
            (step === 'goals' && (!formData.goal || !formData.dietPreference))
          }
          className={cn(
            "w-full mt-12 bg-black dark:bg-brand text-white py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none group shadow-xl shadow-black/10 dark:shadow-brand/20",
            isLoading && "opacity-80"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {step === 'auth' ? (authMode === 'signup' ? 'Create Account' : 'Sign In') : step === 'forgot' ? 'Send Reset Link' : step === 'goals' ? 'Complete Setup' : 'Continue'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
