'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/devices');
      } else {
        router.push('/signin');
      }
    }
  }, [user, isLoading, router]);

  // Show a loading state while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  );
}
