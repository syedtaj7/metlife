'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/pages/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/pages/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-light">Welcome to Table25</h1>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h2 className="text-xl font-medium mb-2">User Information</h2>
              <div className="space-y-2 text-slate-300">
                <p><span className="font-medium text-white">Email:</span> {user.email}</p>
                <p><span className="font-medium text-white">Display Name:</span> {user.displayName || 'Not provided'}</p>
                <p><span className="font-medium text-white">User ID:</span> {user.uid}</p>
                <p><span className="font-medium text-white">Email Verified:</span> {user.emailVerified ? 'Yes' : 'No'}</p>
                <p><span className="font-medium text-white">Sign-in Method:</span> {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email/Password'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Dashboard</h2>
            <p className="text-slate-300 mb-4">
              You have successfully signed in! This is your dashboard where you can manage your account and access all features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-4">
                <h3 className="font-medium text-purple-300 mb-2">Profile</h3>
                <p className="text-sm text-slate-400">Manage your profile information and settings</p>
              </div>
              <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
                <h3 className="font-medium text-blue-300 mb-2">Settings</h3>
                <p className="text-sm text-slate-400">Configure your account preferences</p>
              </div>
              <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
                <h3 className="font-medium text-green-300 mb-2">Activity</h3>
                <p className="text-sm text-slate-400">View your recent activity and history</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}