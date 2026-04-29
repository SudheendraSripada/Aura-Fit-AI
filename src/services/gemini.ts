import { GoogleGenAI } from "@google/genai";
import { UserProfile, WorkoutPlan, DietPlan, InjuryAssessment } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const generateFitnessPlan = async (profile: UserProfile): Promise<{ workout: WorkoutPlan, diet: DietPlan }> => {
  const ai = getAI();
  const prompt = `As a world-class fitness coach and nutritionist, generate a personalized workout and diet plan for the following user profile:
  Name: ${profile.name}
  Age: ${profile.age}
  Current Weight: ${profile.weight}kg
  Height: ${profile.height}cm
  Goal: ${profile.goal}
  Diet Preference: ${profile.dietPreference}
  Activity Level: ${profile.activityLevel}
  Health Conditions: ${profile.healthConditions?.join(', ') || 'None'}
  Allergies: ${profile.allergies?.join(', ') || 'None'}

  Return the response STRICTLY as a JSON object with two top-level keys: "workout" and "diet".
  "workout" should match this structure: { title: string, level: string, duration: string, exercises: [{ name: string, sets: number, reps: string, notes: string }] }
  "diet" should match this structure: { title: string, dailyCalories: number, macros: { protein: string, carbs: string, fats: string }, meals: [{ time: string, suggestion: string }], precautionaryNotes: string[], healthWarnings: string[] }
  
  CRITICAL SAFETY INSTRUCTIONS:
  1. DIET: Strictly avoid any ingredients related to the user's allergies: ${profile.allergies?.join(', ') || 'None'}.
  2. DIET PRECAUTIONS: Provide specific advice for health conditions: ${profile.healthConditions?.join(', ') || 'None'}.
  3. WORKOUT: Adjust exercise notes and intensity based on health conditions.
  4. WARNINGS: If conditions exist, add essential safety warnings (e.g., "Consult a physician before high-impact activity").`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text);
};

export const getCoachResponse = async (message: string, profile: UserProfile, history: { role: 'user' | 'model', parts: [{ text: string }] }[]) => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `You are Aura, an empathetic and highly knowledgeable AI Fitness Coach. Your tone is motivating, professional, and concise. 
      The user's profile: ${JSON.stringify(profile)}.
      Guide them through exercises, answer diet questions, and keep them motivated.`
    }
  });

  return response.text;
};

export const analyzeInjuryRisk = async (findings: string[], profile: UserProfile): Promise<InjuryAssessment> => {
  const ai = getAI();
  const prompt = `As a Doctor of Physical Therapy and Elite Strength Coach, analyze these biomechanical findings from a real-time vision assessment and generate a structured injury risk assessment.

  User Profile: ${JSON.stringify(profile)}
  Findings: ${findings.join(', ')}

  Return a JSON object matching this structure:
  {
    "riskLevel": "low" | "moderate" | "high",
    "score": number (0-100, where 100 is high risk),
    "findings": [
      { "type": "asymmetry" | "alignment" | "range_of_motion", "description": string, "severity": "low" | "medium" | "high", "metric": string }
    ],
    "recommendations": {
      "exercises": [
        { "name": string, "reason": string, "frequency": string, "duration": string }
      ],
      "modifications": [string]
    }
  }

  Be specific, clinical yet encouraging, and provide medically-sound corrective exercises (e.g., face pulls for rounded shoulders, glute bridges for anterior pelvic tilt).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const assessment = JSON.parse(response.text);
  return {
    ...assessment,
    date: new Date().toISOString()
  };
};
