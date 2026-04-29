import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { authService } from './authService';
import { ActivityLog, ErrorLog } from '../types';

export const adminService = {
  /**
   * Logs a user activity
   */
  async logActivity(action: string, details?: any, explicitUserId?: string) {
    const user = explicitUserId || authService.getCurrentUser()?.uid;
    if (!user) return;

    try {
      await addDoc(collection(db, 'logs'), {
        userId: user,
        action,
        details: details || {},
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  },

  /**
   * Logs an application error
   */
  async logError(message: string, stack?: string, explicitUserId?: string) {
    const user = explicitUserId || authService.getCurrentUser()?.uid;
    try {
      await addDoc(collection(db, 'errors'), {
        userId: user || 'anonymous',
        message,
        stack: stack || 'No stack available',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to log error:", err);
    }
  },

  /**
   * Subscribes to real-time activity logs (Admin only)
   */
  subscribeToLogs(callback: (logs: ActivityLog[]) => void) {
    const logsRef = collection(db, 'logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      callback(logs);
    });
  },

  /**
   * Subscribes to real-time error logs (Admin only)
   */
  subscribeToErrors(callback: (errors: ErrorLog[]) => void) {
    const errorsRef = collection(db, 'errors');
    const q = query(errorsRef, orderBy('timestamp', 'desc'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
      const errors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ErrorLog[];
      callback(errors);
    });
  },

  /**
   * Gets total stats (Admin only)
   */
  async getStats() {
    const usersSnap = await getDocs(collection(db, 'users'));
    const logsSnap = await getDocs(collection(db, 'logs'));
    const errorsSnap = await getDocs(collection(db, 'errors'));

    return {
      totalUsers: usersSnap.size,
      totalActivities: logsSnap.size,
      totalErrors: errorsSnap.size
    };
  }
};
