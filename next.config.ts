// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ ضروري لـ lucide-react
  transpilePackages: ["lucide-react"],

  // ✅ تفعيل الـ strict mode
  reactStrictMode: true,

  // ✅ إضافة turbopack config فارغة (لإيقاف التحذير)
  turbopack: {},
};

module.exports = nextConfig;
