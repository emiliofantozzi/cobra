import { useState } from 'react';
import Sentry from '@/sentry.client';
import { trackEvent, captureError } from '@/lib/observability';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      setErrorMsg('');
      if (!isSupabaseConfigured() || !supabase?.auth) throw new Error('Configuración de Supabase faltante');
      if (!email || !password) throw new Error('Completa email y contraseña');
      if (!companyName.trim()) throw new Error('Ingresa el nombre de tu empresa');
      if (!jobRole) throw new Error('Selecciona tu cargo');
      if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden');
      if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          emailRedirectTo: redirectTo,
          data: { company_name: companyName, job_role: jobRole }
        } 
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) {
        toast({ title: 'Revisa tu correo', description: 'Te enviamos un enlace para confirmar la cuenta.' });
        trackEvent({ feature: 'login', action: 'signup', status: 'success', extra: { confirmed: false } });
        return;
      }
      // Persist profile details immediately when available (in setups without email confirmation)
      try {
        await supabase.from('profiles').upsert({
          user_id: userId,
          company_name: companyName,
          job_role: jobRole
        }, { onConflict: 'user_id' });
      } catch {}
      Sentry.setUser({ id: userId });
      trackEvent({ feature: 'login', action: 'signup', status: 'success', extra: { confirmed: true } });
      navigate(`/app/tools`);
    } catch (e: any) {
      const msg = e?.message || 'No se pudo registrar';
      setErrorMsg(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      captureError(e, { feature: 'login', action: 'signup' });
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
                      Crear cuenta
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      Regístrate para comenzar a mejorar la experiencia de tus clientes
                    </p>
                  </div>
                  
                  {/* Form Content */}
                  <div className="space-y-6">
                      <form className="space-y-4" onSubmit={onSubmit}>
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
                            required
                          />
                        </div>
                        
                        {/* Company Name */}
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-sm font-medium text-foreground">
                            Empresa
                          </Label>
                          <Input 
                            id="company" 
                            type="text" 
                            value={companyName} 
                            onChange={e => setCompanyName(e.target.value)} 
                            disabled={loading}
                            className="h-11 px-4 border-gray-200 focus:border-primary focus:ring-primary"
                            placeholder="Ej. Acme S.A."
                            required
                          />
                        </div>

                        {/* Job Role */}
                        <div className="space-y-2">
                          <Label htmlFor="jobRole" className="text-sm font-medium text-foreground">
                            Cargo
                          </Label>
                          <Select value={jobRole} onValueChange={setJobRole}>
                            <SelectTrigger id="jobRole" className="h-11">
                              <SelectValue placeholder="Selecciona tu cargo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner_partner_founder">Dueño / Socio / Fundador</SelectItem>
                              <SelectItem value="ceo">Director General / CEO</SelectItem>
                              <SelectItem value="c_level">Vicepresidente / C-Level (CFO, COO, CMO, CTO, etc.)</SelectItem>
                              <SelectItem value="manager">Gerente</SelectItem>
                              <SelectItem value="lead_coordinator">Jefe / Coordinador</SelectItem>
                              <SelectItem value="professional_specialist">Profesional / Especialista</SelectItem>
                              <SelectItem value="assistant_operator_intern">Asistente / Operativo / Practicante</SelectItem>
                            </SelectContent>
                          </Select>
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
                              required
                              minLength={6}
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

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                            Confirmar contraseña
                          </Label>
                          <div className="relative">
                            <Input 
                              id="confirmPassword" 
                              type={showConfirmPassword ? 'text' : 'password'} 
                              value={confirmPassword} 
                              onChange={e => setConfirmPassword(e.target.value)} 
                              disabled={loading}
                              className="h-11 px-4 pr-10 border-gray-200 focus:border-primary focus:ring-primary"
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setShowConfirmPassword(v => !v)}
                              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                              disabled={loading}
                            >
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="text-xs text-muted-foreground">
                          La contraseña debe tener al menos 6 caracteres
                        </div>

                        {/* Sign Up Button */}
                        <Button 
                          className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md" 
                          type="submit" 
                          disabled={loading}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                        </Button>
                      </form>

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

                      {/* Sign In Link */}
                      <div className="text-center pt-4">
                        <span className="text-sm text-muted-foreground">
                          ¿Ya tienes cuenta?{' '}
                          <Link 
                            to="/auth/sign-in" 
                            className="text-primary hover:text-primary/90 font-medium transition-colors"
                          >
                                                    Inicia sesión
                      </Link>
                    </span>
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


