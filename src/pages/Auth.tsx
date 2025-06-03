
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-millionaire-dark flex items-center justify-center">
        <div className="text-millionaire-light">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
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
