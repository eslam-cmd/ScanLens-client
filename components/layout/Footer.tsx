// client/components/layout/Footer.tsx
"use client";

import Link from "next/link";
import {
  Shield,
  Lock,
  Mail,
  Heart,
  Zap,
  Globe,
  ExternalLink,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: "Features", href: "/#features" },
      { label: "Security", href: "/#security" },
      { label: "Pricing", href: "/subscription" },
      { label: "Changelog", href: "/#changelog" },
    ],
    Company: [
      { label: "About", href: "/#about" },
      { label: "Blog", href: "/#blog" },
      { label: "Careers", href: "/#careers" },
      { label: "Contact", href: "/#contact" },
    ],
    Resources: [
      { label: "Documentation", href: "/help" },
      { label: "API Reference", href: "/#api" },
      { label: "Guides", href: "/help" },
      { label: "Community", href: "/#community" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/#privacy" },
      { label: "Terms of Service", href: "/#terms" },
      { label: "Cookie Policy", href: "/#cookies" },
      { label: "GDPR", href: "/#gdpr" },
    ],
  };

  const socialLinks = [
    { icon: Mail, href: "mailto:hello@securelens.dev", label: "Email" },
  ];

  const techBadges = [
    { icon: Shield, label: "256-bit SSL" },
    { icon: Lock, label: "Secure by Design" },
    { icon: Zap, label: "Powered by Gemini AI" },
    { icon: Globe, label: "Global CDN" },
  ];

  return (
    <footer className="relative border-t border-slate-800 bg-slate-950/90 backdrop-blur-sm text-slate-400 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-sky-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pb-8 sm:pb-12 border-b border-slate-800/50">
          {/* Brand Section */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full" />
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-sky-400 relative z-10" />
              </div>
              <span className="text-base sm:text-lg font-bold text-white">
                SecureLens
              </span>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                v2.0
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mb-4">
              Defensive Security Posture Monitoring. Scan, analyze, and secure
              your web applications with AI-powered insights.
            </p>

            <div className="flex flex-wrap gap-2">
              {techBadges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/50 border border-slate-800/50 text-[9px] sm:text-[10px] text-slate-400"
                  >
                    <Icon className="h-3 w-3 text-emerald-400" />
                    {badge.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200 hover:translate-x-0.5 inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              Made with <Heart className="h-3.5 w-3.5 text-rose-400" /> by the
              SecureLens team
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-500">
              © {currentYear} SecureLens. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800/50 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-200 hover:scale-110"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/30 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] sm:text-xs">SOC 2 Compliant</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] sm:text-xs">GDPR Ready</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#status"
              className="flex items-center gap-1.5 hover:text-slate-300 transition"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>All systems operational</span>
            </a>
            <span className="text-slate-700">|</span>
            <a
              href="#support"
              className="hover:text-slate-300 transition flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              <span>Support</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
