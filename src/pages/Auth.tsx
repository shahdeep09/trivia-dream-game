
import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState<'login' | 'reset' | 'change-password'>(() => {
    if (urlMode === 'change-password') return 'change-password';
    return 'login';
  });
  const { user, loading } = useAuth();

  useEffect(() => {
    if (urlMode === 'change-password') {
      setMode('change-password');
    }
  }, [urlMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-millionaire-dark flex items-center justify-center">
        <div className="text-millionaire-light">Loading...</div>
      </div>
    );
  }

  // If user is authenticated and not changing password, redirect to home
  if (user && mode !== 'change-password') {
    return <Navigate to="/" replace />;
  }

  // If user is not authenticated and trying to change password, redirect to login
  if (!user && mode === 'change-password') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-millionaire-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-millionaire-gold mb-2">
            Quiz Master
          </h1>
          <p className="text-millionaire-light">
            Create and manage your own quiz games
          </p>
        </div>
        <AuthForm mode={mode} onModeChange={setMode} />
      </div>
    </div>
  );
};

export default Auth;
