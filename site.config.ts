// ============================================================
//  CONFIGURACIÓN CENTRAL DEL SITIO
//  Cambia aquí y se refleja en toda la aplicación
// ============================================================

export const siteConfig = {
  // ── Identidad ──────────────────────────────────────────────
  name: "EduLink",
  tagline: "Tu comunidad escolar, conectada",
  description: "Red social educativa para estudiantes, docentes y colegios.",
  url: "https://edulink.vercel.app",
  logo: "/logo.svg",
  favicon: "/favicon.ico",

  // ── Contacto y soporte ─────────────────────────────────────
  supportEmail: "soporte@edulink.com",
  adminEmail: "admin@edulink.com",
  contactEmail: "contacto@edulink.com",

  // ── Redes sociales (opcional) ──────────────────────────────
  social: {
    twitter: "",
    instagram: "",
    facebook: "",
  },

  // ── Pagos (Yape / Plin - sin pasarela) ────────────────────
  payment: {
    yapeNumber: "999 999 999",
    plinNumber: "999 999 999",
    yapeAlias: "EduLink Soporte",
    qrImagePath: "/images/qr-yape.png", // sube tu QR aquí
    instructions:
      "Realiza el pago por Yape o Plin al número indicado. Envía el comprobante al correo de soporte con el asunto 'Activación de Plan' y tu correo registrado. El plan se activará en menos de 24 horas.",
  },

  // ── Planes ─────────────────────────────────────────────────
  plans: [
    {
      id: "free",
      name: "Gratuito",
      price: 0,
      currency: "S/",
      period: null,
      badge: null,
      color: "#6B7280",
      description: "Acceso completo a la comunidad",
      features: [
        "Publicar en Inicio y Comunidades",
        "Comentar e interactuar",
        "Unirse a foros públicos",
        "Foro Anónimo predeterminado",
        "Perfil personalizable",
      ],
      permissions: {
        canCreateAnonForum: false,
        maxAnonForums: 0,
        canPostAnonymously: false,
        hasFeedBadge: false,
        hasFeaturedPosts: false,
      },
    },
    {
      id: "anon_basic",
      name: "Anon Basic",
      price: 5,
      currency: "S/",
      period: "mes",
      badge: "⭐ Basic",
      color: "#3B82F6",
      description: "Para quienes quieren un espacio anónimo propio",
      features: [
        "Todo lo del plan Gratuito",
        "Crear 1 foro anónimo propio",
        "Badge exclusivo en tu perfil",
        "Soporte prioritario",
      ],
      permissions: {
        canCreateAnonForum: true,
        maxAnonForums: 1,
        canPostAnonymously: false,
        hasFeedBadge: true,
        hasFeaturedPosts: false,
      },
    },
    {
      id: "anon_pro",
      name: "Anon Pro",
      price: 10,
      currency: "S/",
      period: "mes",
      badge: "🔥 Pro",
      color: "#8B5CF6",
      description: "Máxima libertad y visibilidad en la plataforma",
      features: [
        "Todo lo del plan Anon Basic",
        "Hasta 2 foros anónimos propios",
        "Publicar anónimo en Inicio",
        "Publicar anónimo en Noticias",
        "Publicaciones destacadas en el feed",
        "Badge Pro exclusivo en tu perfil",
        "Soporte VIP",
      ],
      permissions: {
        canCreateAnonForum: true,
        maxAnonForums: 2,
        canPostAnonymously: true,
        hasFeedBadge: true,
        hasFeaturedPosts: true,
      },
    },
  ],

  // ── Foro anónimo predeterminado ────────────────────────────
  defaultAnonForum: {
    id: "anon-default",
    name: "Anónimo",
    description: "Publica sin que nadie sepa quién eres. Espacio libre y seguro.",
  },

  // ── Configuración de publicaciones ────────────────────────
  posts: {
    maxImageSizeMB: 5,
    maxFileSizeMB: 10,
    allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedFileTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxImagesPerPost: 4,
  },

  // ── Mensajes predeterminados de soporte ───────────────────
  emailTemplates: {
    planRequest: (planName: string, userEmail: string) =>
      `Hola equipo de ${siteConfig.name},%0A%0AQuisiera activar el plan ${planName}.%0A%0AMi correo registrado es: ${userEmail}%0A%0AAdjunto el comprobante de pago.%0A%0AGracias.`,
    support: () =>
      `Hola equipo de ${siteConfig.name},%0A%0ANecesito ayuda con...%0A%0AGracias.`,
  },

  // ── Roles del sistema ──────────────────────────────────────
  roles: {
    user: "user",
    manager: "manager",
    admin: "admin",
  } as const,

  // ── Secciones de la app ────────────────────────────────────
  sections: {
    home: { label: "Inicio", href: "/", icon: "Home" },
    news: { label: "Noticias", href: "/noticias", icon: "Newspaper" },
    communities: { label: "Comunidades", href: "/comunidades", icon: "Users" },
  },
} as const

export type Plan = (typeof siteConfig.plans)[number]
export type PlanId = "free" | "anon_basic" | "anon_pro"
export type Role = "user" | "manager" | "admin"

export default siteConfig
