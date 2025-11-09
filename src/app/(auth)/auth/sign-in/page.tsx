"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Chrome } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // For now, we only support Google OAuth
      // Email/password can be implemented later if needed
      setErrorMsg("Por favor, usa 'Continuar con Google' para iniciar sesión");
    } catch (error: any) {
      setErrorMsg(error?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (error: any) {
      setErrorMsg(error?.message || "No se pudo iniciar sesión con Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Layer with Image and Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/backgrounds/login-bg.png')",
        }}
      >
        {/* Blur effect for browsers that support backdrop-filter */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/10"></div>

        {/* Blue brand overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-blue-50/80 to-slate-50/80 [@supports(backdrop-filter:blur(0))]:bg-transparent"></div>

        {/* Fallback overlay for browsers without backdrop-filter support */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-blue-50/80 [@supports(backdrop-filter:blur(0))]:hidden"></div>
      </div>

      {/* Floating Card Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          {/* Floating Card */}
          <Card className="overflow-hidden shadow-2xl backdrop-blur-sm bg-white/95 border-white/20 rounded-3xl py-0">
            <div className="grid lg:grid-cols-[40%_60%] min-h-[300px] lg:min-h-[600px]">
              {/* Image Section - Left Column (40%) */}
              <div className="relative overflow-hidden min-h-[300px] lg:h-full lg:min-h-0">
                {/* Background image */}
                <Image
                  src="/backgrounds/login-left.webp"
                  alt="COBRA Platform Background"
                  fill
                  className="object-cover"
                  priority
                />

                {/* Logo overlay */}
                <div className="absolute top-6 left-6 z-10">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <Image
                      src="/brand/logo.svg"
                      alt="COBRA Logo"
                      width={48}
                      height={48}
                      className="h-12 w-auto"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </div>
                </div>

                {/* Separator line (only visible on desktop) */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block z-10"></div>
              </div>

              {/* Form Section - Right Column (60%) */}
              <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12 bg-white overflow-y-auto">
                <div className="w-full max-w-md mx-auto space-y-8">
                  {/* Logo and Title */}
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <Image
                        src="/brand/logo-texto.svg"
                        alt="COBRA"
                        width={0}
                        height={0}
                        className="h-20 w-auto"
                        style={{ backgroundColor: 'transparent' }}
                      />
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Iniciar sesión
                    </h1>
                  </div>

                  {/* Form Content */}
                  <div className="space-y-6">
                    {/* Google OAuth Button - Primary action */}
                    <Button
                      className="w-full h-11 border-gray-200 hover:bg-gray-50 font-bold transition-all duration-200"
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      style={{ color: '#38ca8b' }}
                    >
                      <Chrome className="w-4 h-4 mr-2" />
                      Continuar con Google
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                      <Separator className="my-6" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-background px-3 text-sm text-muted-foreground">o</span>
                      </div>
                    </div>

                    {/* Email/Password Form - Secondary option */}
                      <form className="space-y-4" onSubmit={handleEmailPassword}>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={true}
                            className="h-11 px-4 border-gray-200 focus:border-primary focus:ring-primary opacity-50 cursor-not-allowed"
                            placeholder="Correo electrónico"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                            Contraseña
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={true}
                              className="h-11 px-4 pr-10 border-gray-200 focus:border-primary focus:ring-primary opacity-50 cursor-not-allowed"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground opacity-50 cursor-not-allowed pointer-events-none"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                              disabled={true}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                          <Link
                            href="/auth/forgot-password"
                            className="text-sm text-muted-foreground hover:text-muted-foreground font-medium transition-colors opacity-50 pointer-events-none cursor-not-allowed"
                          >
                          ¿Olvidaste tu contraseña?
                        </Link>
                      </div>

                      {/* Sign In Button */}
                      <Button
                        className="w-full h-11 border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed font-medium"
                        variant="outline"
                        type="submit"
                        disabled={true}
                      >
                        Iniciar sesión
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

                    {/* Sign Up Link */}
                    <div className="text-center pt-4 opacity-50 pointer-events-none">
                      <span className="text-sm text-gray-400">
                        ¿No tienes cuenta?{" "}
                        <span className="text-gray-400 font-medium">
                          Crear cuenta
                        </span>
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
          <Image
            src="/brand/Logo Helios Greyscale.svg"
            alt="Helios"
            width={80}
            height={20}
            className="h-5 w-auto"
          />
        </div>
      </div>
    </div>
  );
}

