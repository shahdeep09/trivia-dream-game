
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useUserProfile = () => {
  const { user } = useAuth();

  const createUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create user profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'User'
          });

        if (error) {
          console.error('Error creating user profile:', error);
        } else {
          console.log('User profile created successfully');
        }
      }
    } catch (error) {
      console.error('Error checking/creating user profile:', error);
    }
  }, [user]);

  return { createUserProfile };
};
