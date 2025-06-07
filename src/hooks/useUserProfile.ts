
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
        // Create user profile - if RLS fails, just log and continue
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'User'
          });

        if (error) {
          // Don't throw error, just log it - the app can work without user profiles
          console.log('User profile creation skipped due to RLS policy:', error.message);
        } else {
          console.log('User profile created successfully');
        }
      }
    } catch (error) {
      // Don't throw error, just log it - the app can work without user profiles
      console.log('User profile check/creation skipped:', error);
    }
  }, [user]);

  return { createUserProfile };
};
