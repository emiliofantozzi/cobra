import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function Callback() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      // Supabase processes the hash automatically on load
      const { data: { user } } = await supabase.auth.getUser();
      try {
        // If we have metadata, persist to profiles table
        if (user?.id) {
          const companyName = (user.user_metadata as any)?.company_name;
          const jobRole = (user.user_metadata as any)?.job_role;
          if (companyName || jobRole) {
            await supabase.from('profiles').upsert({
              user_id: user.id,
              company_name: companyName ?? null,
              job_role: jobRole ?? null
            }, { onConflict: 'user_id' });
          }
        }
      } catch {}
      if (user?.id) navigate(`/app/tools`, { replace: true });
      else navigate('/auth/sign-in', { replace: true });
    })();
  }, [navigate]);
  return null;
}


