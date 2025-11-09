import { useEffect, useState } from 'react';
import { trackEvent, captureError } from '@/lib/observability';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function SignOut() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(true);

  useEffect(() => {
    const signOut = async () => {
      try {
        // Clear the session
        await supabase.auth.signOut();
        trackEvent({ feature: 'login', action: 'signout', status: 'success' });
        
        // Wait a moment to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate to sign-in page directly
        navigate('/auth/sign-in', { replace: true });
      } catch (error) {
        captureError(error, { feature: 'login', action: 'signout' });
        // Even if there's an error, redirect to sign-in
        navigate('/auth/sign-in', { replace: true });
      } finally {
        setIsSigningOut(false);
      }
    };

    signOut();
  }, [navigate]);

  // Show loading state while signing out
  if (isSigningOut) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Cerrando sesión...</p>
        </div>
      </div>
    );
  }

  return null;
}


