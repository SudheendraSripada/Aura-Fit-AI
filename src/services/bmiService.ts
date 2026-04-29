export const bmiService = {
  calculateBMI: (weightKg: number, heightCm: number) => {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return parseFloat(bmi.toFixed(1));
  },
  
  getBMIStatus: (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'blue-500' };
    if (bmi < 25) return { label: 'Normal', color: 'emerald-500' };
    if (bmi < 30) return { label: 'Overweight', color: 'yellow-500' };
    return { label: 'Obese', color: 'red-500' };
  }
};
