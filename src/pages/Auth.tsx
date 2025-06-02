
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if credentials match the required ones
    if (username !== 'shahdeep' || password !== 'Deep@5085') {
      toast({
        title: "Invalid Credentials",
        description: "Username or password is incorrect.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Use a predefined email for the specific user
      const email = 'shahdeep@kbc.com';
      
      const { error } = await signIn(email, password);

      if (error) {
        // If user doesn't exist, we need to create them first
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "User Not Found",
            description: "Please contact the administrator to set up your account.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Successfully logged in!",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-millionaire-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-millionaire-secondary border-millionaire-accent">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/7a4ab7f7-1f17-4576-be09-22adf0ee4b13.png" 
              alt="KBC Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-millionaire-gold">KBC Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-millionaire-light mb-1">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-millionaire-primary text-millionaire-gold border-millionaire-accent"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-millionaire-light mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-millionaire-primary text-millionaire-gold border-millionaire-accent"
                placeholder="Enter password"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
