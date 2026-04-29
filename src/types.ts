export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'overall_fitness';
  dietPreference: 'veg' | 'non-veg' | 'vegan';
  activityLevel: 'sedentary' | 'moderate' | 'active' | 'athlete';
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  healthConditions?: string[];
  allergies?: string[];
  userId: string;
}

export interface WorkoutPlan {
  title: string;
  level: string;
  duration: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    notes: string;
  }[];
}

export interface DietPlan {
  title: string;
  dailyCalories: number;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  meals: {
    time: string;
    suggestion: string;
  }[];
  precautionaryNotes?: string[];
  healthWarnings?: string[];
}

export interface ProgressLog {
  date: string;
  weight: number;
  caloriesBurned: number;
  workoutDuration: number;
}

export interface BiomechanicalFinding {
  type: 'asymmetry' | 'alignment' | 'range_of_motion';
  description: string;
  severity: 'low' | 'medium' | 'high';
  metric: string;
}

export interface InjuryAssessment {
  date: string;
  riskLevel: 'low' | 'moderate' | 'high';
  score: number; // 0-100
  findings: BiomechanicalFinding[];
  recommendations: {
    exercises: {
      name: string;
      reason: string;
      frequency: string;
      duration: string;
    }[];
    modifications: string[];
  };
}

export interface ActivityLog {
  id?: string;
  userId: string;
  action: string;
  details?: any;
  timestamp: any;
}

export interface ErrorLog {
  id?: string;
  userId?: string;
  message: string;
  stack?: string;
  timestamp: any;
}

export interface AdminStats {
  totalUsers: number;
  totalActivities: number;
  totalErrors: number;
}

export interface Friendship {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted';
  createdAt: any;
  requesterName?: string;
  receiverName?: string;
}
