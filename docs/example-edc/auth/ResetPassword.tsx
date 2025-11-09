import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Password validation
  const passwordRequirements = {
    minLength: password.length >= 6,
    match: password === confirmPassword && password.length > 0,
  };

  const isFormValid = Object.values(passwordRequirements).every(Boolean);

  // Check for recovery session on mount
  useEffect(() => {
    const checkRecoverySession = async () => {
      if (!isSupabaseConfigured() || !supabase?.auth) {
        setIsValidSession(false);
        return;
      }

      try {
        // Check for error parameters first
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.log('❌ URL Error detected:', {
            error,
            errorCode,
            errorDescription: decodeURIComponent(errorDescription || '')
          });
          setIsValidSession(false);
          let errorMessage = 'El enlace de recuperación es inválido o ha expirado';
          
          if (errorCode === 'otp_expired') {
            errorMessage = 'El enlace de recuperación ha expirado. Por favor solicita un nuevo enlace.';
          } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription);
          }
          
          setErrorMsg(errorMessage);
          return;
        }

        // Check if we have a session from the recovery link
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Also check URL parameters for recovery tokens
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        console.log('🔍 Recovery session check:', {
          hasSession: !!session,
          sessionType: session?.user?.app_metadata?.provider,
          urlType: type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          sessionError: sessionError?.message
        });

        if (session || (accessToken && refreshToken && type === 'recovery')) {
          setIsValidSession(true);
          
          // If we have tokens in URL but no session, set the session
          if (!session && accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('❌ Error setting session:', sessionError);
              setIsValidSession(false);
              setErrorMsg('El enlace de recuperación es inválido o ha expirado');
            }
          }
        } else {
          setIsValidSession(false);
          setErrorMsg('El enlace de recuperación es inválido o ha expirado');
        }
      } catch (error: any) {
        console.error('❌ Error checking recovery session:', error);
        setIsValidSession(false);
        setErrorMsg('Error al verificar el enlace de recuperación');
      }
    };

    checkRecoverySession();
  }, [searchParams]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      setErrorMsg('');
      
      if (!isSupabaseConfigured() || !supabase?.auth) {
        throw new Error('Configuración de Supabase faltante');
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setSuccess(true);
      toast({ 
        title: 'Contraseña actualizada', 
        description: 'Tu contraseña ha sido restablecida exitosamente.' 
      });

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        navigate('/auth/sign-in', { replace: true });
      }, 3000);

    } catch (e: any) {
      const msg = e?.message || 'No se pudo actualizar la contraseña';
      setErrorMsg(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally { 
      setLoading(false); 
    }
  };

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Layer with Image and Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center [background-image:url('/backgrounds/login-bg.png')]"
        >
          <div className="absolute inset-0 backdrop-blur-sm bg-black/10"></div>
          <div 
            className="absolute inset-0 [background:linear-gradient(135deg,hsl(var(--primary)/0.08)_0%,hsl(var(--primary)/0.12)_50%,hsl(var(--primary)/0.10)_100%)]"
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-blue-50/80 [@supports(backdrop-filter:blur(0))]:hidden"></div>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full shadow-2xl backdrop-blur-sm bg-white/95 border-white/20 rounded-3xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">
                Verificando enlace de recuperación...
              </h1>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if invalid session
  if (isValidSession === false) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center [background-image:url('/backgrounds/login-bg.png')]"
        >
          <div className="absolute inset-0 backdrop-blur-sm bg-black/10"></div>
          <div 
            className="absolute inset-0 [background:linear-gradient(135deg,hsl(var(--primary)/0.08)_0%,hsl(var(--primary)/0.12)_50%,hsl(var(--primary)/0.10)_100%)]"
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-blue-50/80 [@supports(backdrop-filter:blur(0))]:hidden"></div>
        </div>

        {/* Error Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full shadow-2xl backdrop-blur-sm bg-white/95 border-white/20 rounded-3xl">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'color-mix(in oklab, var(--destructive) 20%, transparent)' }}>
                <AlertCircle className="w-8 h-8" style={{ color: 'var(--destructive)' }} />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-lg font-semibold text-foreground">
                  Enlace no válido
                </h1>
                <p className="text-sm text-muted-foreground">
                  {errorMsg || 'El enlace de recuperación es inválido o ha expirado'}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  asChild
                  className="w-full"
                >
                  <Link to="/auth/forgot-password">
                    Reenviar correo de recuperación
                  </Link>
                </Button>
                
                <Button 
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <Link to="/auth/sign-in">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al inicio de sesión
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Layer with Image and Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center [background-image:url('/backgrounds/login-bg.png')]"
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/10"></div>
        <div 
          className="absolute inset-0 [background:linear-gradient(135deg,hsl(var(--primary)/0.08)_0%,hsl(var(--primary)/0.12)_50%,hsl(var(--primary)/0.10)_100%)]"
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-blue-50/80 [@supports(backdrop-filter:blur(0))]:hidden"></div>
      </div>

      {/* Floating Card Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          <Card className="overflow-hidden shadow-2xl backdrop-blur-sm bg-white/95 border-white/20 rounded-3xl">
            <div className="grid min-h-[600px] lg:grid-cols-[40%_60%]">
              {/* Image Section - Left Column (40%) */}
              <div className="relative overflow-hidden lg:h-auto h-56">
                <img 
                  src="/backgrounds/login-left.webp" 
                  alt="Customer Experience Platform Background"
                  className="w-full h-full object-cover"
                />
                
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
                
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block"></div>
              </div>

              {/* Form Section - Right Column (60%) */}
              <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12 bg-white overflow-y-auto">
                <div className="w-full max-w-md mx-auto space-y-8">
                  {/* Title */}
                  <div className="text-center">
                    <h1 className="text-xl font-semibold text-foreground">
                      {success ? '¡Contraseña actualizada!' : 'Establecer nueva contraseña'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      {success 
                        ? 'Tu contraseña ha sido restablecida exitosamente'
                        : 'Elige una contraseña segura para tu cuenta'
                      }
                    </p>
                  </div>
                  
                  {/* Form Content */}
                  <div className="space-y-6">
                    {!success ? (
                      <form className="space-y-4" onSubmit={onSubmit}>
                        {/* Password Field */}
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-foreground">
                            Nueva contraseña
                          </Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"}
                              value={password} 
                              onChange={e => setPassword(e.target.value)} 
                              disabled={loading}
                              className="h-11 px-4 pr-11 border-input focus:border-primary focus:ring-primary"
                              placeholder="Mínimo 6 caracteres"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                            Confirmar contraseña
                          </Label>
                          <div className="relative">
                            <Input 
                              id="confirmPassword" 
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword} 
                              onChange={e => setConfirmPassword(e.target.value)} 
                              disabled={loading}
                              className="h-11 px-4 pr-11 border-input focus:border-primary focus:ring-primary"
                              placeholder="Confirma tu contraseña"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            <div className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-primary' : 'text-muted-foreground'}`}>
                              <CheckCircle className="w-3 h-3" />
                              Mínimo 6 caracteres
                            </div>
                            <div className={`flex items-center gap-2 ${passwordRequirements.match ? 'text-primary' : 'text-muted-foreground'}`}>
                              <CheckCircle className="w-3 h-3" />
                              Las contraseñas coinciden
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button 
                          className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md" 
                          type="submit" 
                          disabled={loading || !isFormValid}
                        >
                          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'color-mix(in oklab, var(--chart-4) 20%, transparent)' }}>
                          <CheckCircle className="w-8 h-8" style={{ color: 'var(--chart-4)' }} />
                        </div>
                        <p className="text-muted-foreground">
                          Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión en unos segundos.
                        </p>
                        <Button 
                          asChild
                          className="w-full"
                        >
                          <Link to="/auth/sign-in">
                            Ir al inicio de sesión
                          </Link>
                        </Button>
                      </div>
                    )}

                    {/* Error Message */}
                    {errorMsg && (
                      <div 
                        className="p-3 text-sm rounded-md" 
                        style={{ color: 'var(--destructive)', backgroundColor: 'color-mix(in oklab, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--destructive) 30%, transparent)' }}
                        role="alert" 
                        aria-live="polite"
                      >
                        {errorMsg}
                      </div>
                    )}

                    {/* Back to Sign In Link */}
                    {!success && (
                      <div className="text-center pt-4">
                        <Link 
                          to="/auth/sign-in" 
                          className="inline-flex items-center text-sm text-primary hover:text-primary/90 font-medium transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Volver al inicio de sesión
                        </Link>
                      </div>
                    )}
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
