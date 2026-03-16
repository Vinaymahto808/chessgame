const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
export const API_BASE = domain ? `https://${domain}/api` : "/api";
