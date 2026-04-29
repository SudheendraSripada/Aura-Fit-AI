import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  UserPlus, 
  UserCheck, 
  UserMinus, 
  Clock, 
  Target, 
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';
import { UserProfile, Friendship } from '../types';
import { socialService } from '../services/socialService';
import { cn } from '../lib/utils';
import { onSnapshot, collection, query, or, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { adminService } from '../services/adminService';

export default function Social({ profile }: { profile: UserProfile }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const uid = user.uid;
        const q = query(
          collection(db, 'friendships'),
          or(where('requesterId', '==', uid), where('receiverId', '==', uid))
        );

        const unsubSnapshot = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
          setFriendships(list);
        }, (error) => {
          console.error("Friendship snapshot error:", error);
          adminService.logError("Social Friendship List Error", error.stack || error.message, uid);
        });

        return () => unsubSnapshot();
      } else {
        setFriendships([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const results = await socialService.searchUsers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const getFriendStatus = (userId: string) => {
    const f = friendships.find(fs => fs.requesterId === userId || fs.receiverId === userId);
    if (!f) return 'none';
    return f.status;
  };

  const handleAddFriend = async (user: UserProfile) => {
    setActionLoading(user.userId);
    try {
      await socialService.sendFriendRequest(user, profile.name);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (fId: string) => {
    setActionLoading(fId);
    try {
      await socialService.acceptFriendRequest(fId);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (fId: string) => {
    setActionLoading(fId);
    try {
      await socialService.removeFriendship(fId);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const friends = friendships
    .filter(f => f.status === 'accepted')
    .map(f => {
      const isRequester = f.requesterId === auth.currentUser?.uid;
      return {
        friendshipId: f.id,
        userId: isRequester ? f.receiverId : f.requesterId,
        name: isRequester ? f.receiverName : f.requesterName
      };
    });

  const handleSendEncouragement = async (friendshipId: string) => {
    setActionLoading('encouragement');
    try {
      await socialService.sendEncouragement(friendshipId);
      // Small delay for UI effect
      setTimeout(() => setActionLoading(null), 1000);
    } catch (error) {
      console.error(error);
      setActionLoading(null);
    }
  };

  const pendingIncoming = friendships.filter(f => f.status === 'pending' && f.receiverId === auth.currentUser?.uid);
  const pendingOutgoing = friendships.filter(f => f.status === 'pending' && f.requesterId === auth.currentUser?.uid);

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h2 className="text-4xl font-bold tracking-tighter dark:text-[#EDEDED]">Aura Social</h2>
        <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium">Connect with friends, share goals, and track evolution together.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Search & Pending */}
        <div className="space-y-8">
          {/* User Search */}
          <div className="dark-card p-6 rounded-[2rem] shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2 dark:text-[#EDEDED]">
              <Search className="w-4 h-4 text-brand" />
              Find Friends
            </h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-grow bg-neutral-50 dark:bg-[#1E1E1E] border-none rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 ring-brand/20 dark:text-[#EDEDED]"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-brand text-white p-2 rounded-2xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="mt-6 space-y-3">
                {searchResults.map(user => {
                  const status = getFriendStatus(user.userId);
                  return (
                    <div key={user.userId} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#1E1E1E]/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">
                          {user.name[0]}
                        </div>
                        <span className="font-bold text-sm dark:text-[#EDEDED]">{user.name}</span>
                      </div>
                      {status === 'none' ? (
                        <button 
                          onClick={() => handleAddFriend(user)}
                          disabled={actionLoading === user.userId}
                          className="text-brand hover:bg-brand/10 p-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.userId ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                              <Clock className="w-5 h-5" />
                            </motion.div>
                          ) : (
                            <UserPlus className="w-5 h-5" />
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{status}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : searchTerm && !isSearching && (
              <div className="mt-6 text-center py-4">
                <p className="text-sm text-neutral-400 italic">No users found.</p>
              </div>
            )}
          </div>

          {/* Pending Requests */}
          {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
            <div className="dark-card p-6 rounded-[2rem] shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 dark:text-[#EDEDED]">
                <Clock className="w-4 h-4 text-orange-500" />
                Friend Requests
              </h3>
              
              {pendingIncoming.length > 0 && (
                <div className="mb-6 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Incoming</p>
                  {pendingIncoming.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#121212] border border-neutral-100 dark:border-[#2A2A2A]">
                      <span className="font-bold text-sm dark:text-[#EDEDED]">{f.requesterName}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleAccept(f.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors">
                          <UserCheck className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDecline(f.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
                          <UserMinus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingOutgoing.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Sent</p>
                  {pendingOutgoing.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#1E1E1E]/50">
                      <span className="font-bold text-sm dark:text-[#EDEDED]">{f.receiverName}</span>
                      <button onClick={() => handleDecline(f.id)} className="text-neutral-400 hover:text-rose-500 transition-colors">
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Friends List & Comparison */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
             {/* Friends List */}
            <div className="dark-card p-8 rounded-[2.5rem] shadow-sm">
              <h3 className="font-bold text-xl mb-6 dark:text-[#EDEDED]">My Friends</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-neutral-200 dark:text-[#2A2A2A] mx-auto mb-4" />
                    <p className="text-neutral-400 dark:text-[#A0A0A0] text-sm">No friends added yet.<br/>Search above to start connecting.</p>
                  </div>
                ) : (
                  friends.map(friend => (
                    <button 
                      key={friend.userId}
                      onClick={async () => {
                        const prof = await socialService.getFriendProfile(friend.userId);
                        setSelectedFriend(prof);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all border",
                        selectedFriend?.userId === friend.userId
                          ? "bg-brand/5 border-brand text-brand ring-4 ring-brand/5"
                          : "bg-neutral-50 dark:bg-[#1E1E1E]/50 border-transparent hover:border-neutral-200 dark:hover:border-[#2A2A2A]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#2A2A2A] flex items-center justify-center text-brand shadow-sm border border-neutral-100 dark:border-[#2A2A2A] font-black">
                          {friend.name?.[0]}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm dark:text-[#EDEDED]">{friend.name}</p>
                          <p className="text-[10px] font-bold text-neutral-400 dark:text-[#A0A0A0] uppercase tracking-widest">Active Member</p>
                        </div>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 transition-transform", selectedFriend?.userId === friend.userId && "rotate-90")} />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Friend Insight */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {selectedFriend ? (
                  <motion.div 
                    key={selectedFriend.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="dark-card p-8 rounded-[2.5rem] shadow-sm bg-brand/5 border-brand/20 h-full"
                  >
                    <div className="flex items-start justify-between mb-8">
                       <div>
                          <p className="text-brand font-black text-[10px] uppercase tracking-[0.2em] mb-2">Evolution Tracker</p>
                          <h3 className="text-3xl font-bold dark:text-[#EDEDED]">{selectedFriend.name.split(' ')[0]}</h3>
                       </div>
                       <Award className="text-brand w-10 h-10 opacity-50" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-white dark:bg-[#121212] p-4 rounded-3xl border border-neutral-100 dark:border-[#2A2A2A]">
                          <Target className="w-4 h-4 text-emerald-500 mb-2" />
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Goal</p>
                          <p className="text-xs font-bold dark:text-[#EDEDED] truncate capitalize">{selectedFriend.goal.replace('_', ' ')}</p>
                       </div>
                       <div className="bg-white dark:bg-[#121212] p-4 rounded-3xl border border-neutral-100 dark:border-[#2A2A2A]">
                          <TrendingUp className="w-4 h-4 text-blue-500 mb-2" />
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Level</p>
                          <p className="text-xs font-bold dark:text-[#EDEDED] truncate capitalize">{selectedFriend.activityLevel}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="p-4 rounded-3xl bg-neutral-900 border-none text-white relative overflow-hidden group">
                          <Zap className="absolute right-0 bottom-0 w-16 h-16 opacity-10 group-hover:scale-125 transition-transform" />
                          <div className="relative z-10">
                             <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-widest mb-1">Current Progress</p>
                             <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-2xl font-bold">
                                  {Math.floor(20 + (selectedFriend.userId.charCodeAt(0) % 70))}%
                                </span>
                                <span className="text-neutral-500 text-[10px] font-bold pb-1 underline decoration-brand decoration-2">TO MONTHLY GOAL</span>
                             </div>
                             <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div className="w-[78%] h-full bg-brand" style={{ width: `${Math.floor(20 + (selectedFriend.userId.charCodeAt(0) % 70))}%` }} />
                             </div>
                          </div>
                       </div>

                       <button 
                          onClick={() => {
                            const friendObj = friends.find(f => f.userId === selectedFriend.userId);
                            if (friendObj) handleSendEncouragement(friendObj.friendshipId);
                          }}
                          disabled={actionLoading === 'encouragement'}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-brand text-white font-bold text-sm shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                       >
                          {actionLoading === 'encouragement' ? (
                            <span className="flex items-center gap-2">
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                <Clock className="w-4 h-4" />
                              </motion.div>
                              Sending...
                            </span>
                          ) : (
                            <>
                              Send Encouragement
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                       </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="dark-card p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center opacity-50 h-full border-dashed">
                    <Users className="w-16 h-16 text-neutral-200 dark:text-[#2A2A2A] mb-4" />
                    <p className="font-bold text-neutral-400 dark:text-[#A0A0A0]">Select a friend to view<br/>their evolution stats.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
