import { useState } from 'react';
import Sentry from '@/sentry.client';
import { trackEvent, captureError } from '@/lib/observability';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Chrome, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { toast } = useToast();

  const onEmailPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      setErrorMsg('');
      if (!isSupabaseConfigured() || !supabase?.auth) throw new Error('Configuración de Supabase faltante');
      if (!email || !password) throw new Error('Completa email y contraseña');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error('No user');
      Sentry.setUser({ id: userId });
      trackEvent({ feature: 'login', action: 'email_password', status: 'success', extra: { user_id: userId } });
      navigate(`/app/tools`);
    } catch (e: any) {
      const msg = e?.message || 'No se pudo iniciar sesión';
      setErrorMsg(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      captureError(e, { feature: 'login', action: 'email_password', extra: { email_masked: !!email } });
    } finally { setLoading(false); }
  };

  const onMagicLink = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      if (!isSupabaseConfigured() || !supabase?.auth) throw new Error('Configuración de Supabase faltante');
      if (!email) throw new Error('Ingresa tu email');
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) throw error;
      toast({ title: 'Revisa tu correo', description: 'Te enviamos un enlace de acceso.' });
      trackEvent({ feature: 'login', action: 'magic_link', status: 'success' });
    } catch (e: any) {
      const msg = e?.message || 'No se pudo enviar el enlace';
      setErrorMsg(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      captureError(e, { feature: 'login', action: 'magic_link' });
    } finally { setLoading(false); }
  };

  const onGoogleSignIn = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      if (!isSupabaseConfigured() || !supabase?.auth) throw new Error('Configuración de Supabase faltante');
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      if (error) throw error;
      trackEvent({ feature: 'login', action: 'oauth_google', status: 'success' });
    } catch (e: any) {
      const msg = e?.message || 'No se pudo iniciar sesión con Google';
      setErrorMsg(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      captureError(e, { feature: 'login', action: 'oauth_google' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Layer with Image and Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center [background-image:url('/backgrounds/login-bg.png')]"
      >
        {/* Blur effect for browsers that support backdrop-filter */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/10"></div>
        
        {/* Blue brand overlay */}
        <div 
          className="absolute inset-0 [background:linear-gradient(135deg,hsl(var(--primary)/0.08)_0%,hsl(var(--primary)/0.12)_50%,hsl(var(--primary)/0.10)_100%)]"
        ></div>

        {/* Fallback overlay for browsers without backdrop-filter support */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-blue-50/80 [@supports(backdrop-filter:blur(0))]:hidden"></div>
      </div>

      {/* Floating Card Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          {/* Floating Card */}
          <Card className="overflow-hidden shadow-2xl backdrop-blur-sm bg-white/95 border-white/20 rounded-3xl">
            <div className="grid min-h-[600px] lg:grid-cols-[40%_60%]">
              {/* Image Section - Left Column (40%) */}
              <div className="relative overflow-hidden lg:h-auto h-56">
                {/* Full-bleed background image */}
                <img 
                  src="/backgrounds/login-left.webp" 
                  alt="Customer Experience Platform Background"
                  className="w-full h-full object-cover"
                />
                
                {/* Logo overlay */}
                <div className="absolute top-6 left-6">
                  <img 
                    src="/brand/logo.svg" 
                    alt="Helios Logo" 
                    className="h-8 w-auto"
                    style={{ backgroundColor: 'transparent' }}
                    aria-hidden="true"
                  />
                </div>
                
                {/* Separator line (only visible on desktop) */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block"></div>
              </div>

              {/* Form Section - Right Column (60%) */}
              <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12 bg-white overflow-y-auto">
                <div className="w-full max-w-md mx-auto space-y-8">
                  {/* Title */}
                  <div className="text-center">
                    <h1 className="text-xl font-semibold text-foreground">
                      Iniciar sesión
                    </h1>
                  </div>
                  
                  {/* Form Content */}
                  <div className="space-y-6">
                      <form className="space-y-4" onSubmit={onEmailPassword}>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-foreground">
                            Email
                          </Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            disabled={loading}
                            className="h-11 px-4 border-gray-200 focus:border-primary focus:ring-primary"
                            placeholder="Correo electrónico"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-foreground">
                            Contraseña
                          </Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? 'text' : 'password'} 
                              value={password} 
                              onChange={e => setPassword(e.target.value)} 
                              disabled={loading}
                              className="h-11 px-4 pr-10 border-gray-200 focus:border-primary focus:ring-primary"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setShowPassword(v => !v)}
                              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                              disabled={loading}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                          <Link 
                            to="/auth/forgot-password" 
                            className="text-sm text-primary hover:text-primary/90 font-medium transition-colors"
                          >
                            ¿Olvidaste tu contraseña?
                          </Link>
                        </div>

                        {/* Sign In Button */}
                        <Button 
                          className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md" 
                          type="submit" 
                          disabled={loading}
                        >
                          {loading ? 'Ingresando...' : 'Iniciar sesión'}
                        </Button>
                      </form>

                      {/* Divider */}
                      <div className="relative">
                        <Separator className="my-6" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-background px-3 text-sm text-muted-foreground">o</span>
                        </div>
                      </div>

                      {/* Magic Link Button */}
                      <Button 
                        className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200" 
                        variant="outline" 
                        onClick={onMagicLink} 
                        disabled={loading}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Magic Link
                      </Button>

                      {/* Google OAuth Button - Disabled */}
                      <Button 
                        className="w-full h-11 border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed font-medium" 
                        variant="outline" 
                        disabled={true}
                      >
                        <Chrome className="w-4 h-4 mr-2" />
                        Continuar con Google
                      </Button>

                      {/* Error Message */}
                      {errorMsg && (
                        <div 
                          className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md" 
                          role="alert" 
                          aria-live="polite"
                        >
                          {errorMsg}
                        </div>
                      )}

                      {/* Sign Up Link */}
                      <div className="text-center pt-4">
                        <span className="text-sm text-gray-600">
                          ¿No tienes cuenta?{' '}
                          <Link 
                            to="/auth/sign-up" 
                            className="text-primary hover:text-primary/90 font-medium transition-colors"
                          >
                            Crear cuenta
                          </Link>
                        </span>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        {/* Sponsored by Helios */}
        <div className="mt-6 flex flex-col items-center gap-2" aria-hidden="true">
          <span className="text-[12px] text-primary-foreground">Sponsored by</span>
          <img src="/brand/Logo Helios Greyscale.svg" alt="Helios" className="h-auto max-w-20" />
        </div>
      </div>
    </div>
  );
}


