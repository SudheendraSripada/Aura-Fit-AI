export interface LiveMetrics {
  calories: number;
  steps: number;
  heartRate: number;
  activeMinutes: number;
  hydration: number;
}

export const realTimeService = {
  simulateMetrics: (current: LiveMetrics): LiveMetrics => {
    // Realistic increments
    return {
      calories: current.calories + Math.floor(Math.random() * 2),
      steps: current.steps + Math.floor(Math.random() * 5),
      heartRate: 70 + Math.floor(Math.random() * 10), // Fluctuate around 70-80
      activeMinutes: current.activeMinutes + (Math.random() > 0.9 ? 1 : 0),
      hydration: current.hydration + (Math.random() > 0.99 ? 0.1 : 0)
    };
  },
  
  getInitialMetrics: (): LiveMetrics => ({
    calories: 742,
    steps: 8420,
    heartRate: 72,
    activeMinutes: 45,
    hydration: 1.8
  })
};
