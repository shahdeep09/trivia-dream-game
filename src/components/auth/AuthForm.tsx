
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PasswordChangeForm } from './PasswordChangeForm';

interface AuthFormProps {
  mode: 'login' | 'reset' | 'change-password';
  onModeChange: (mode: 'login' | 'reset' | 'change-password') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const { signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  // If user is authenticated and wants to change password, show the password change form
  if (mode === 'change-password' && user) {
    return <PasswordChangeForm />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Password reset email sent. Check your inbox.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'reset': return 'Reset Password';
      case 'change-password': return 'Change Password';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to your account to continue';
      case 'reset': return 'Enter your email to receive a password reset link';
      case 'change-password': return 'Enter your new password';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-millionaire-gold">
          {getTitle()}
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {mode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-millionaire-gold hover:bg-millionaire-gold/90"
            disabled={loading}
          >
            {loading ? 'Please wait...' : 
              mode === 'login' ? 'Sign In' : 
              'Send Reset Link'
            }
          </Button>

          <div className="text-center space-y-2">
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => onModeChange('reset')}
                className="text-sm text-millionaire-accent hover:underline"
              >
                Forgot your password?
              </button>
            )}

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className="text-sm text-millionaire-accent hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
