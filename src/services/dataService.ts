import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { adminService } from './adminService';

export const dataService = {
  /**
   * Saves or updates the user profile in Firestore
   */
  async saveUserProfile(uid: string, profile: UserProfile) {
    const userRef = doc(db, 'users', uid);
    try {
      await setDoc(userRef, {
        ...profile,
        userId: uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      adminService.logActivity('profile_updated', { userId: uid }, uid);
    } catch (error) {
      console.error("Error saving user profile:", error);
      adminService.logError('Profile Save Error', (error as Error).stack, uid);
      throw error;
    }
  },

  /**
   * Retrieves the user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Remove internal fields before returning
        const { userId, updatedAt, ...profile } = data;
        return profile as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  /**
   * Updates specific fields in the user profile
   */
  async updateProfileFields(uid: string, updates: Partial<UserProfile>) {
    const userRef = doc(db, 'users', uid);
    try {
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating profile fields:", error);
      throw error;
    }
  }
};
