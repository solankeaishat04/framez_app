// components/TestSupabase.tsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const TestSupabase = () => {
  useEffect(() => {
    const testConnection = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data, error } = await supabase.from('posts').select('*').limit(1);
        if (error) {
          console.error('❌ Supabase connection failed:', error);
        } else {
          console.log('✅ Supabase connected successfully!');
        }
      } catch (error) {
        console.error('❌ Supabase error:', error);
      }
    };
    
    testConnection();
  }, []);

  return null;
};