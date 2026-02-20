"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingAnimation from '../components/LoadingAnimation';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to devices page
    if (user && !isLoading) {
      router.push('/devices');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-background">
      <LoadingAnimation onSignIn={() => {}} />
    </div>
  );
} 