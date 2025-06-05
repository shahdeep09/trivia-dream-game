
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleChangePassword = () => {
    navigate('/auth?mode=change-password');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-millionaire-accent">
          <User size={16} className="mr-2" />
          {user.email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleChangePassword}>
          <Key size={16} className="mr-2" />
          Change Password
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
