import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Activity, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Info,
  Scan,
  HeartPulse,
  Brain
} from 'lucide-react';
import { Pose, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Camera as MPCamera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { UserProfile, InjuryAssessment } from '../types';
import { analyzeInjuryRisk } from '../services/gemini';
import { cn } from '../lib/utils';

export default function InjuryRiskAssessment({ profile }: { profile: UserProfile }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [results, setResults] = useState<InjuryAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    shoulderSymmetry: 0,
    hipAlignment: 0,
    headPosture: 0
  });

  // Accumulator for findings during scan
  const findingsRef = useRef<string[]>([]);

  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const onResults = (results: Results) => {
    if (!canvasRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);

    if (results.poseLandmarks) {
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#ff5722', lineWidth: 4 });
      drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#ffffff', lineWidth: 2, radius: 4 });

      // Biomechanical Analysis
      const lShoulder = results.poseLandmarks[11];
      const rShoulder = results.poseLandmarks[12];
      const lHip = results.poseLandmarks[23];
      const rHip = results.poseLandmarks[24];
      const nose = results.poseLandmarks[0];
      const lEar = results.poseLandmarks[7];
      const rEar = results.poseLandmarks[8];

      if (lShoulder && rShoulder && lHip && rHip) {
        // 1. Shoulder Symmetry (Y-axis diff)
        const shoulderDiff = Math.abs(lShoulder.y - rShoulder.y) * 100;
        // 2. Hip Alignment (Y-axis diff)
        const hipDiff = Math.abs(lHip.y - rHip.y) * 100;
        // 3. Forward Head Posture (Average ear to shoulder X distance in profile/semi-profile)
        const avgEarX = (lEar.x + rEar.x) / 2;
        const avgShoulderX = (lShoulder.x + rShoulder.x) / 2;
        const headPosture = Math.abs(avgEarX - avgShoulderX) * 100;

        setLiveMetrics({
          shoulderSymmetry: Number(shoulderDiff.toFixed(1)),
          hipAlignment: Number(hipDiff.toFixed(1)),
          headPosture: Number(headPosture.toFixed(1))
        });

        if (isScanning) {
          if (shoulderDiff > 3) findingsRef.current.push("Notable shoulder height asymmetry detected");
          if (hipDiff > 2.5) findingsRef.current.push("Lateral pelvic tilt detected");
          if (headPosture > 15) findingsRef.current.push("Potential forward head posture");
        }
      }
    }
    canvasCtx.restore();
  };

  useEffect(() => {
    if (!isCameraActive) return;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

    let camera: any = null;
    if (videoRef.current) {
      camera = new MPCamera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) await pose.send({ image: videoRef.current });
        },
        width: 1280,
        height: 720
      });
      camera.start();
    }

    return () => {
      if (camera) camera.stop();
      pose.close();
    };
  }, [isCameraActive]);

  const startScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    findingsRef.current = [];
    
    // Simulate scan duration
    const duration = 10000; // 10 seconds
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setScanProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        clearInterval(timer);
        completeScan();
      }
    }, interval);
  };

  const completeScan = async () => {
    setIsScanning(false);
    setLoading(true);
    try {
      const uniqueFindings = Array.from(new Set(findingsRef.current));
      const assessment = await analyzeInjuryRisk(uniqueFindings, profile);
      setResults(assessment);
      setIsCameraActive(false);
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (results) {
    return (
      <div className="max-w-5xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter mb-2 dark:text-[#EDEDED]">Internal Health Audit</h2>
            <p className="text-neutral-500 dark:text-[#A0A0A0]">Biomechanical analysis complete. Here is your injury prevention plan.</p>
          </div>
          <button 
            onClick={() => setResults(null)}
            className="flex items-center gap-2 text-neutral-400 dark:text-[#A0A0A0] hover:text-brand transition-colors font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            Redo Scan
          </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Risk Overview */}
            <div className={cn(
              "p-8 rounded-[2.5rem] border-2 shadow-xl flex items-center gap-8",
              results.riskLevel === 'low' ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" :
              results.riskLevel === 'moderate' ? "bg-yellow-50 border-yellow-100 dark:bg-yellow-500/10 dark:border-yellow-500/20" :
              "bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20"
            )}>
              <div className={cn(
                "w-24 h-24 rounded-3xl flex items-center justify-center shrink-0 shadow-lg",
                results.riskLevel === 'low' ? "bg-emerald-500" :
                results.riskLevel === 'moderate' ? "bg-yellow-500" :
                "bg-rose-500"
              )}>
                <ShieldAlert className="text-white w-12 h-12" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest opacity-60 mb-1 dark:text-[#A0A0A0]">Risk Summary</p>
                <h3 className="text-4xl font-bold mb-2 dark:text-[#EDEDED]">
                  {results.riskLevel.toUpperCase()} RISK
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-grow h-2 bg-black/5 dark:bg-[#1E1E1E] rounded-full overflow-hidden w-48">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${results.score}%` }}
                      className={cn(
                        "h-full rounded-full",
                        results.riskLevel === 'low' ? "bg-emerald-500" :
                        results.riskLevel === 'moderate' ? "bg-yellow-500" :
                        "bg-rose-500"
                      )}
                    />
                  </div>
                  <span className="font-bold text-xl dark:text-[#EDEDED]">{results.score}%</span>
                </div>
              </div>
            </div>

            {/* Findings */}
            <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm dark:shadow-none">
              <h3 className="font-bold text-2xl mb-8 flex items-center gap-3 dark:text-[#EDEDED]">
                <Brain className="text-brand w-6 h-6" />
                Vision Findings
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {results.findings.map((f, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-neutral-50 dark:bg-[#121212] border border-neutral-100 dark:border-[#2A2A2A] hover:border-brand/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full bg-white dark:bg-[#1E1E1E] text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-[#A0A0A0]">
                        {f.type.replace('_', ' ')}
                      </span>
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <p className="font-bold text-neutral-900 dark:text-[#EDEDED] mb-2">{f.description}</p>
                    <p className="text-sm text-neutral-500 dark:text-[#A0A0A0]">{f.metric}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Corrective Plan */}
            <div className="bg-neutral-900 dark:bg-[#121212] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Activity className="w-64 h-64" />
               </div>
               <h3 className="font-bold text-2xl mb-8 flex items-center gap-3">
                <HeartPulse className="text-brand w-6 h-6" />
                Preventative Protocol
              </h3>
              <div className="space-y-4">
                {results.recommendations.exercises.map((ex, i) => (
                  <div key={i} className="bg-white/5 dark:bg-[#1E1E1E]/50 backdrop-blur-sm border border-white/10 dark:border-[#2A2A2A] p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <h4 className="font-bold text-xl text-brand">{ex.name}</h4>
                      <div className="flex gap-4">
                        <span className="text-xs font-bold text-neutral-400 dark:text-[#A0A0A0]">{ex.frequency}</span>
                        <span className="text-xs font-bold text-neutral-400 dark:text-[#A0A0A0]">{ex.duration}</span>
                      </div>
                    </div>
                    <p className="text-neutral-400 dark:text-[#A0A0A0] text-sm leading-relaxed">{ex.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm">
                <h3 className="font-bold text-xl mb-6 dark:text-[#EDEDED]">Workout Mods</h3>
                <ul className="space-y-4">
                  {results.recommendations.modifications.map((m, i) => (
                    <li key={i} className="flex gap-3 text-sm text-neutral-600 dark:text-[#A0A0A0] font-medium">
                      <div className="shrink-0 mt-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                      {m}
                    </li>
                  ))}
                </ul>
             </div>

             <div className="bg-brand text-white p-8 rounded-[2.5rem] shadow-lg shadow-brand/20">
                <h3 className="font-bold text-xl mb-2">Expert Feedback</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
                  These recommendations are based on your vision data. Implementing these will improve your movement efficiency and longevity.
                </p>
                <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                   <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-60">Status</p>
                   <p className="font-bold">Next Scan in 14 Days</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter dark:text-[#EDEDED]">Injury Risk Scan</h2>
          <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium">Our vision AI identifies biomechanical imbalances before they become injuries.</p>
        </div>
        <div className="flex gap-4">
            <MetricBox label="Asymmetry" value={`${liveMetrics.shoulderSymmetry}%`} />
            <MetricBox label="Neck Lead" value={`${liveMetrics.headPosture}%`} />
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative aspect-video rounded-[3rem] bg-neutral-900 overflow-hidden shadow-2xl border-4 border-white dark:border-[#2A2A2A]">
             {!isCameraActive && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                   <div className="bg-brand/20 p-8 rounded-full mb-8 backdrop-blur-2xl border border-brand/30">
                      <Scan className="w-16 h-16 text-brand" />
                   </div>
                   <h3 className="text-3xl font-bold mb-4">Start Bio-Scan</h3>
                   <p className="text-neutral-400 text-center max-w-sm mb-10 font-medium">
                     Position yourself 6-8 feet away from the camera. Ensure your full body is visible.
                   </p>
                   <button 
                    onClick={() => setIsCameraActive(true)}
                    className="bg-brand hover:bg-brand-dark px-10 py-5 rounded-full font-bold text-lg transition-all active:scale-95 shadow-xl shadow-brand/30 flex items-center gap-3"
                   >
                     Initialize Vision
                     <ChevronRight className="w-6 h-6" />
                   </button>
                </div>
             )}

             {loading && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl z-50 text-white">
                  <div className="w-20 h-20 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6" />
                  <h3 className="text-2xl font-bold">Generating Diagnosis...</h3>
                  <p className="text-neutral-400">Aura AI is cross-referencing your biomechanics with clinical data.</p>
               </div>
             )}

             <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" playsInline muted />
             <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none transform scale-x-[-1]" width={1280} height={720} />

             {isScanning && (
               <div className="absolute inset-0 bg-brand/5 pointer-events-none z-20 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 animate-pulse border-[20px] border-brand/20" />
                  <div className="bg-black/40 backdrop-blur-md px-8 py-4 rounded-full border border-white/20 text-white">
                     <p className="text-sm font-bold uppercase tracking-widest mb-1">Scanning Body Mechanics...</p>
                     <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-brand"
                          initial={{ width: 0 }}
                          animate={{ width: `${scanProgress}%` }}
                        />
                     </div>
                  </div>
               </div>
             )}

             {isCameraActive && !isScanning && !loading && (
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
                  <button 
                    onClick={startScan}
                    className="bg-white text-black px-10 py-5 rounded-full font-bold flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform"
                  >
                    <Activity className="text-brand w-6 h-6" />
                    Begin 10s Diagnostic
                  </button>
               </div>
             )}
          </div>

          <div className="grid grid-cols-3 gap-4">
             <LiveMetric label="Shoulder Sym." value={liveMetrics.shoulderSymmetry} icon={<div className="w-2 h-2 rounded-full bg-brand" />} />
             <LiveMetric label="Pelvic Level" value={liveMetrics.hipAlignment} icon={<div className="w-2 h-2 rounded-full bg-blue-500" />} />
             <LiveMetric label="Head Lead" value={liveMetrics.headPosture} icon={<div className="w-2 h-2 rounded-full bg-emerald-500" />} />
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-neutral-100 dark:border-[#2A2A2A] shadow-sm h-full">
              <h3 className="font-bold text-xl mb-6 dark:text-[#EDEDED]">Instructions</h3>
              <div className="space-y-6">
                <Step num={1} text="Stand 8 feet back from the camera." />
                <Step num={2} text="Face forward and stand naturally." />
                <Step num={3} text="Turn sideways when the scan begins." />
                <Step num={4} text="Perform one slow bodyweight squat." />
              </div>
              <div className="mt-10 p-6 bg-blue-50 dark:bg-blue-500/10 rounded-3xl border border-blue-100 dark:border-blue-500/20 flex gap-4">
                 <div className="shrink-0"><Info className="text-blue-500 w-5 h-5" /></div>
                 <p className="text-xs text-blue-700 dark:text-blue-100/70 leading-relaxed font-medium">
                   Our AI uses positional landmarks to detect misalignments as small as 2cm.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="glass px-6 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[120px] border-neutral-200 dark:border-[#2A2A2A]">
      <span className="text-[10px] font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-widest">{label}</span>
      <span className="text-xl font-bold text-brand">{value}</span>
    </div>
  );
}

function LiveMetric({ label, value, icon }: { label: string, value: any, icon: any }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-3xl border border-neutral-100 dark:border-[#2A2A2A] shadow-sm flex items-center gap-3">
       <div className="p-2 bg-neutral-50 dark:bg-[#121212] rounded-xl">{icon}</div>
       <div>
         <p className="text-[10px] font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-wider">{label}</p>
         <p className="font-bold text-sm dark:text-[#EDEDED]">{value}%</p>
       </div>
    </div>
  );
}

function Step({ num, text }: { num: number, text: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-[#121212] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{num}</span>
      <p className="text-sm font-medium text-neutral-600 dark:text-[#A0A0A0]">{text}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const colors = {
    low: "bg-emerald-100 text-emerald-600",
    medium: "bg-yellow-100 text-yellow-600",
    high: "bg-rose-100 text-rose-600"
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase", colors[severity])}>
      {severity}
    </span>
  );
}
