import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  or,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Friendship, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const socialService = {
  /**
   * Search for users by exact name (Firestore limitation for simple search)
   * or just list some users for recommendation
   */
  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    if (!searchTerm) return [];
    const path = 'users';
    try {
      const q = query(
        collection(db, path),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(p => p.userId !== auth.currentUser?.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return []; // unreachable but for TS
    }
  },

  async sendFriendRequest(receiver: UserProfile, requesterName: string) {
    const requesterId = auth.currentUser?.uid;
    if (!requesterId) return;

    const friendshipId = requesterId < receiver.userId 
      ? `${requesterId}_${receiver.userId}` 
      : `${receiver.userId}_${requesterId}`;

    const path = `friendships/${friendshipId}`;
    try {
      await setDoc(doc(db, 'friendships', friendshipId), {
        requesterId,
        receiverId: receiver.userId,
        status: 'pending',
        createdAt: serverTimestamp(),
        requesterName,
        receiverName: receiver.name
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getFriendships(): Promise<Friendship[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];

    const path = 'friendships';
    try {
      const q = query(
        collection(db, path),
        or(where('requesterId', '==', uid), where('receiverId', '==', uid))
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async acceptFriendRequest(friendshipId: string) {
    const path = `friendships/${friendshipId}`;
    try {
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'accepted'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async removeFriendship(friendshipId: string) {
    const path = `friendships/${friendshipId}`;
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getFriendProfile(friendId: string): Promise<UserProfile | null> {
    const path = `users/${friendId}`;
    try {
      const docRef = doc(db, 'users', friendId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async sendEncouragement(friendshipId: string) {
    const path = `friendships/${friendshipId}`;
    try {
      const friendshipRef = doc(db, 'friendships', friendshipId);
      const snap = await getDoc(friendshipRef);
      const data = snap.data();
      
      await updateDoc(friendshipRef, {
        lastEncouragementAt: serverTimestamp(),
        lastEncouragementBy: auth.currentUser?.uid,
        encouragementCount: (data?.encouragementCount || 0) + 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
