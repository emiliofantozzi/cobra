import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { toast } = useToast();

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      setErrorMsg('');
      if (!isSupabaseConfigured() || !supabase?.auth) throw new Error('Configuración de Supabase faltante');
      if (!email) throw new Error('Ingresa tu email');
      
      const redirectTo = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });
      
      if (error) throw error;
      setSent(true);
      toast({ 
        title: 'Email enviado', 
        description: 'Revisa tu correo para restablecer tu contraseña.' 
      });
    } catch (e: any) {
      const msg = e?.message || 'No se pudo enviar el email';
      setErrorMsg(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally { 
      setLoading(false); 
    }
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
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
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
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <img 
                      src="/brand/logo.svg" 
                      alt="Helios Logo" 
                      className="h-8 w-auto"
                      aria-hidden="true"
                    />
                  </div>
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
                      ¿Olvidaste tu contraseña?
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      {sent 
                        ? 'Te hemos enviado un enlace de recuperación'
                        : 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña'
                      }
                    </p>
                  </div>
                  
                  {/* Form Content */}
                  <div className="space-y-6">
                      {!sent ? (
                        <form className="space-y-4" onSubmit={onSubmit}>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
                              required
                            />
                          </div>

                          {/* Submit Button */}
                          <Button 
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md" 
                            type="submit" 
                            disabled={loading}
                          >
                            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                          </Button>
                        </form>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Mail className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-gray-600">
                            Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => { setSent(false); setEmail(''); }}
                            className="w-full"
                          >
                            Enviar a otro email
                          </Button>
                        </div>
                      )}

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

                      {/* Back to Sign In Link */}
                      <div className="text-center pt-4">
                        <Link 
                          to="/auth/sign-in" 
                          className="inline-flex items-center text-sm text-primary hover:text-primary/90 font-medium transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                                                Volver al inicio de sesión
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
