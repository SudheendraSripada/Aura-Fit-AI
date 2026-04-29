import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, AlertCircle, Info, Trophy, Play, Square, Sparkles, Dumbbell } from 'lucide-react';
import { Pose, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Camera as MPCamera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import canvasConfetti from 'canvas-confetti';
import { adminService } from '../services/adminService';

export default function PostureAI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [feedback, setFeedback] = useState('Position yourself in front of the camera');
  const [formAlerts, setFormAlerts] = useState<string[]>([]);
  const [formScore, setFormScore] = useState(100);
  const [auraColor, setAuraColor] = useState<'green' | 'yellow' | 'rose'>('green');
  const [currentKneeAngle, setCurrentKneeAngle] = useState(180);
  const [status, setStatus] = useState<'idle' | 'tracking' | 'down' | 'up'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for squat logic and form tracking
  const squatStateRef = useRef({ 
    stage: 'up', 
    count: 0, 
    lastAngle: 180, 
    maxDepth: 180,
    startTime: 0
  });

  const calculateAngle = (a: any, b: any, c: any) => {
    if (!a || !b || !c) return 180;
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const checkForm = (results: Results) => {
    const landmarks = results.poseLandmarks;
    if (!landmarks) return [];
    
    const alerts: string[] = [];
    const lShoulder = landmarks[11];
    const lHip = landmarks[23];
    const lKnee = landmarks[25];
    const lAnkle = landmarks[27];
    const rKnee = landmarks[26];
    const rHip = landmarks[24];

    if (lShoulder && lHip && lKnee && lAnkle) {
      const kneeAngle = calculateAngle(lHip, lKnee, lAnkle);
      
      // 1. Torso Angle (Back Straightness)
      const torsoDiff = Math.abs(lShoulder.x - lHip.x);
      if (torsoDiff > 0.15 && kneeAngle < 120) {
        alerts.push("Keep chest up - Don't lean too far forward");
      }

      // 2. Knee Depth
      if (squatStateRef.current.stage === 'down' && kneeAngle > 105) {
        alerts.push("Go deeper for a full rep");
      }

      // 3. Knee Alignment (Lateral Stability)
      if (lKnee && rKnee && lHip && rHip) {
        const kneeWidth = Math.abs(lKnee.x - rKnee.x);
        const hipWidth = Math.abs(lHip.x - rHip.x);
        if (kneeWidth < hipWidth * 0.8 && kneeAngle < 130) {
          alerts.push("Push knees out - Avoid caving");
        }
      }
    }
    
    return alerts;
  };

  const onResults = (results: Results) => {
    if (!canvasRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Only draw landmarks if results are valid
    if (results.poseLandmarks) {
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: '#ff5722', lineWidth: 4 });
      drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#ffffff', lineWidth: 2, radius: 4 });

      // Squat counting logic (simplified)
      // Landmarks: Left Hip (23), Left Knee (25), Left Ankle (27)
      const hip = results.poseLandmarks[23];
      const knee = results.poseLandmarks[25];
      const ankle = results.poseLandmarks[27];

      if (hip && knee && ankle) {
        const angle = calculateAngle(hip, knee, ankle);
        setCurrentKneeAngle(Math.round(angle));
        const currentAlerts = checkForm(results);
        setFormAlerts(currentAlerts);
        
        // Calculate Form Score and Aura Intensity
        const newScore = Math.max(0, 100 - (currentAlerts.length * 25));
        setFormScore(prev => Math.round((prev * 0.9) + (newScore * 0.1))); // Smooth transition
        
        if (currentAlerts.length === 0) setAuraColor('green');
        else if (currentAlerts.length === 1) setAuraColor('yellow');
        else setAuraColor('rose');

        // Squat logic
        if (angle < 95) {
           if (squatStateRef.current.stage === 'up') {
             squatStateRef.current.stage = 'down';
             squatStateRef.current.startTime = Date.now();
             setFeedback('Great depth! Now drive up.');
           }
           if (angle < squatStateRef.current.maxDepth) {
             squatStateRef.current.maxDepth = angle;
           }
        }

        if (angle > 155 && squatStateRef.current.stage === 'down') {
           const repDuration = (Date.now() - squatStateRef.current.startTime) / 1000;
           
           squatStateRef.current.stage = 'up';
           squatStateRef.current.count += 1;
           setRepCount(squatStateRef.current.count);
           // Tempo feedback
           if (repDuration < 1.2) {
             setFeedback('Rep counted! Try controlling the descent.');
           } else {
             setFeedback('Excellent tempo! Keep that control.');
           }
           
           squatStateRef.current.maxDepth = 180; 
           
           if (squatStateRef.current.count % 5 === 0) {
             canvasConfetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#ff5722', '#ffffff']
            });
           }
        }
      }
    }
    canvasCtx.restore();
  };

  useEffect(() => {
    if (!isCameraActive) return;

    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

    let camera: any = null;
    if (videoRef.current) {
      try {
        camera = new MPCamera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await pose.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720
        });
        camera.start().catch((err: any) => {
          console.error("Camera start error:", err);
          setError("Failed to start the camera. Please ensure it's not in use by another app.");
          setIsCameraActive(false);
        });
      } catch (err: any) {
        console.error("Camera init error:", err);
        setError("Error initializing camera module.");
        setIsCameraActive(false);
      }
    }

    return () => {
      if (camera) camera.stop();
      pose.close();
    };
  }, [isCameraActive]);

  const toggleCamera = async () => {
    setError(null);
    if (!isCameraActive) {
      adminService.logActivity('posture_ai_camera_start');
      setLoading(true);
      try {
        // Pre-check camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately
        setIsCameraActive(true);
      } catch (err: any) {
        console.error("Camera permission error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Camera access was denied. Please allow it in browser settings.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError("No camera device found. Please connect a webcam.");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError("Camera is already in use by another application.");
        } else {
          setError("Unable to access camera. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      setIsCameraActive(false);
      squatStateRef.current.count = 0;
      setRepCount(0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter dark:text-[#EDEDED]">Live Form Analysis</h2>
          <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium">Point your camera to track exercise reps and posture accuracy.</p>
        </div>
        <div className="flex gap-3">
          <div className="glass px-6 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[120px] dark:border-[#2A2A2A]">
            <span className="text-xs font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-widest">Reps</span>
            <span className="text-3xl font-bold text-brand">{repCount}</span>
          </div>
          <div className="glass px-6 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[120px] dark:border-[#2A2A2A]">
            <span className="text-xs font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-widest">Type</span>
            <span className="text-lg font-bold dark:text-[#EDEDED]">Squats</span>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className={cn(
            "relative aspect-video rounded-[2.5rem] bg-neutral-900 overflow-hidden shadow-2xl group border-4 transition-all duration-500",
            !isCameraActive ? "border-white" : 
            auraColor === 'green' ? "border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)]" :
            auraColor === 'yellow' ? "border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.3)]" :
            "border-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.3)]"
          )}>
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                <AnimatePresence>
                  {loading ? (
                    <motion.div 
                      key="loading"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative mb-6">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-24 h-24 rounded-full border-4 border-white/5 border-t-white"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="bg-brand p-4 rounded-xl shadow-2xl"
                          >
                            <Dumbbell className="w-8 h-8 text-white" />
                          </motion.div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Powering up AI...</h3>
                      <p className="text-white/40 text-sm font-medium">Calibrating biometric sensors</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="bg-white/10 p-8 rounded-full mb-6 backdrop-blur-xl">
                        <Camera className="w-16 h-16 opacity-50" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Camera is Off</h3>
                      {error ? (
                        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl mb-8 flex items-center gap-3 max-w-sm">
                          <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                          <p className="text-sm text-red-100">{error}</p>
                        </div>
                      ) : (
                        <p className="text-neutral-400 mb-8 max-w-sm text-center">Allow camera access to start real-time pose tracking and rep counting.</p>
                      )}
                      <button 
                        onClick={toggleCamera}
                        className="bg-brand text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-50"
                       >
                        <Play className="w-5 h-5" />
                        Start Session
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
              style={{ display: isCameraActive ? 'block' : 'none' }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full z-10 pointer-events-none transform scale-x-[-1]"
              width={1280}
              height={720}
              style={{ display: isCameraActive ? 'block' : 'none' }}
            />

            {isCameraActive && (
              <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse" />
                  <span className="text-white text-xs font-bold tracking-widest uppercase">Live Vision</span>
                </div>
                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-tighter">Biometrics Active</span>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3 text-white">
                <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/20 flex flex-col items-center">
                   <div className="text-[10px] font-bold opacity-60 uppercase mb-1">Knee Angle</div>
                   <div className="text-2xl font-black">{currentKneeAngle}°</div>
                </div>
                <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/20 flex flex-col items-center">
                   <div className="text-[10px] font-bold opacity-60 uppercase mb-1">Aura Score</div>
                   <div className={cn(
                     "text-2xl font-black",
                     formScore > 85 ? "text-emerald-400" : formScore > 60 ? "text-yellow-400" : "text-rose-400"
                   )}>{formScore}%</div>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div className="absolute bottom-6 right-6 z-20">
                <button 
                  onClick={toggleCamera}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all"
                >
                  <Square className="w-4 h-4 fill-white" />
                  Stop
                </button>
              </div>
            )}
          </div>

          <div className={cn(
             "p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center gap-6 transition-all border-2",
             isCameraActive 
               ? "bg-brand/5 border-brand/20 shadow-lg shadow-brand/5 dark:bg-brand/10" 
               : "bg-neutral-100 dark:bg-[#1E1E1E]/50 border-transparent text-neutral-400 dark:text-[#A0A0A0]"
          )}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-colors duration-300",
                    !isCameraActive ? "bg-neutral-200 dark:bg-neutral-700" :
                    auraColor === 'green' ? "bg-emerald-500 text-white" :
                    auraColor === 'yellow' ? "bg-yellow-500 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-wider mb-1">Aura Intelligence</p>
                    <p className={cn("text-lg font-bold transition-colors duration-300", 
                      !isCameraActive ? "text-neutral-400" :
                      auraColor === 'green' ? "text-emerald-700 dark:text-emerald-400" :
                      auraColor === 'yellow' ? "text-yellow-700 dark:text-yellow-400" :
                      "text-rose-700 dark:text-rose-400"
                    )}>
                      {isCameraActive ? feedback : 'Session not started'}
                    </p>
                  </div>
                </div>
                {isCameraActive && (
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-widest mb-1">Stability Meter</span>
                    <div className="w-32 h-2 bg-neutral-100 dark:bg-[#121212] rounded-full overflow-hidden border border-neutral-200 dark:border-[#2A2A2A]">
                      <motion.div 
                        animate={{ 
                          width: `${formScore}%`,
                          backgroundColor: auraColor === 'green' ? '#10b981' : auraColor === 'yellow' ? '#f59e0b' : '#f43f5e'
                        }}
                        className="h-full" 
                      />
                    </div>
                  </div>
                )}
              </div>

            <AnimatePresence>
              {isCameraActive && formAlerts.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 min-w-[300px]"
                >
                  <AlertCircle className="text-rose-500 w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Form Correction</p>
                    <ul className="space-y-1">
                      {formAlerts.map((alert, i) => (
                        <li key={i} className="text-sm font-bold text-rose-700 dark:text-rose-400 leading-tight">• {alert}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <div className="dark-card p-8 rounded-[2.5rem] shadow-sm">
             <h3 className="font-bold text-xl mb-6 flex items-center gap-2 dark:text-[#EDEDED]">
               <Trophy className="text-brand w-5 h-5" />
               Current Session
             </h3>
             <ul className="space-y-4">
               <MetricRow label="Set Goal" value="15 Reps" />
               <MetricRow label="Form Score" value={`${formScore}%`} color={formScore > 85 ? 'text-emerald-500' : formScore > 60 ? 'text-yellow-500' : 'text-rose-500'} />
               <MetricRow label="Avg Tempo" value="2.4s" />
               <MetricRow label="Live Angle" value={`${currentKneeAngle}°`} />
             </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-500/10 p-6 rounded-[2rem] border border-yellow-100 dark:border-yellow-500/20">
             <div className="flex items-center gap-2 mb-3 text-yellow-700 dark:text-yellow-500">
               <AlertCircle className="w-5 h-5" />
               <h4 className="font-bold">Pro Tip</h4>
             </div>
             <p className="text-sm text-yellow-800 dark:text-yellow-100/70 leading-relaxed font-medium">
               Keep your back straight and weight on your heels for maximum glute activation. Look forward, not down.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <li className="flex items-center justify-between py-3 border-b border-neutral-50 dark:border-[#2A2A2A] last:border-0">
      <span className="text-neutral-400 dark:text-[#A0A0A0] font-bold text-sm">{label}</span>
      <span className={cn("font-bold dark:text-[#EDEDED]", color)}>{value}</span>
    </li>
  );
}

import { cn } from '../lib/utils';
