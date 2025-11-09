import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db";
import { env } from "@/lib/config/env";
import { getActiveOrganization } from "@/lib/services/organizations";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: env.AUTH_SECRET,
  session: {
    strategy: "database",
  },
  // Usar trustHost: true para que NextAuth detecte automáticamente el host
  // Pero forzar el uso de AUTH_URL en el callback redirect para callbacks OAuth
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Forzar el uso de AUTH_URL para el redirect_uri en los callbacks OAuth
      // Esto asegura que siempre use https://app.hqhelios.com independientemente del dominio de acceso
      authorization: {
        params: {
          redirect_uri: `${env.AUTH_URL.replace(/\/$/, "")}/api/auth/callback/google`,
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Si la URL es relativa, construir la URL completa
      // Usar baseUrl del request para mantener compatibilidad, pero si viene de OAuth callback,
      // forzar el uso de AUTH_URL para asegurar que siempre use app.hqhelios.com
      const targetBaseUrl = env.AUTH_URL;
      
      if (url.startsWith("/")) {
        return `${targetBaseUrl}${url}`;
      }
      
      // Si la URL es absoluta, verificar si es del mismo origen que AUTH_URL
      try {
        const urlObj = new URL(url);
        const targetBaseUrlObj = new URL(targetBaseUrl);
        if (urlObj.origin === targetBaseUrlObj.origin) {
          return url;
        }
        // Si es de otro origen pero es relativo a nuestro dominio, usar AUTH_URL
        if (urlObj.pathname.startsWith("/")) {
          return `${targetBaseUrl}${urlObj.pathname}${urlObj.search}`;
        }
      } catch {
        // Si la URL no es válida, continuar con el default
      }
      
      // Por defecto, redirigir al dashboard usando AUTH_URL
      return `${targetBaseUrl}/dashboard`;
    },
    async session({ session, user }) {
      if (!session.user || !user?.id) {
        return session;
      }

      session.user.id = user.id;

      // Obtener la organización activa del usuario
      const activeOrganization = await getActiveOrganization(user.id);

      if (activeOrganization) {
        // Obtener el rol del usuario en esta organización
        const membership = await prisma.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: activeOrganization.id,
            },
          },
        });

        if (membership) {
          session.user.role = membership.role;
          session.organization = {
            id: activeOrganization.id,
            name: activeOrganization.name,
            slug: activeOrganization.slug,
            countryCode: activeOrganization.countryCode,
            defaultCurrency: activeOrganization.defaultCurrency,
          };
        }
      }

      return session;
    },
  },
});

