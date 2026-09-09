// client/app/help/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  ShieldCheck,
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap,
  Lock,
  Crown,
  Gem,
  Settings,
  History,
  Scan,
  BarChart3,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Clock,
  Award,
  BookOpen,
  Video,
  MessageSquare,
  Headphones,
  Send,
  Copy,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function HelpPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const router = useRouter();

  // ✅ جلب بيانات المستخدم
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          setUser(res.data.user);
        }
      } catch {
        // المستخدم غير مسجل
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("hdayaaslam34@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+963 583 59 136");
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const faqs = [
    {
      question: "What is SecureLens?",
      answer:
        "SecureLens is a comprehensive security scanning platform that analyzes websites for vulnerabilities, security headers, SSL/TLS configurations, CORS policies, and more. It provides AI-powered remediation suggestions to help you secure your applications.",
    },
    {
      question: "How does the scan work?",
      answer:
        "Simply enter a domain or URL, and SecureLens will perform a thorough security audit. It checks HTTP headers, SSL certificates, cookie configurations, CORS policies, and other security best practices. Results are displayed with a score and actionable insights.",
    },
    {
      question: "What are the different plans?",
      answer:
        "SecureLens offers three plans: Free (5 scans/day, 7-day history), Pro (100 scans/day, 90-day history, AI fixes), and Extra (unlimited scans, 1-year history, all features). You can upgrade anytime through the subscription page.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes! All data is encrypted in transit and at rest. We use industry-standard security practices including HTTPS, secure cookies, and encrypted database storage. Your scan results are private to you.",
    },
    {
      question: "Can I export my scan reports?",
      answer:
        "Yes, you can export scan reports in both CSV and PDF formats. This feature is available on all plans, with automated exports available on Pro and Extra plans.",
    },
    {
      question: "What is a License Key and how do I use it?",
      answer:
        "A License Key is a code you can enter to upgrade your plan instantly. You can obtain a license key from the developer or admin. Enter it in the 'License' section of your settings to activate your subscription.",
    },
  ];

  const features = [
    {
      icon: Scan,
      title: "Security Scanning",
      description:
        "Comprehensive website security audit with actionable insights",
    },
    {
      icon: Sparkles,
      title: "AI Remediation",
      description:
        "Get AI-powered fix suggestions for identified vulnerabilities",
    },
    {
      icon: BarChart3,
      title: "Historical Comparison",
      description: "Track your security posture improvements over time",
    },
    {
      icon: Lock,
      title: "Deep Security Analysis",
      description: "SSL/TLS, CORS, Cookies, Headers and more",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-sky-400" />
            Help & Support
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Everything you need to know about SecureLens
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/20">
            <ShieldCheck className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Welcome to SecureLens Support
            </h2>
            <p className="text-sm text-slate-400">
              {user
                ? `Hello ${user.name || user.email}! We're here to help you secure your applications.`
                : "Sign in to access your scans and personalized support."}
            </p>
          </div>
          {!user && (
            <Link
              href="/login"
              className="ml-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition shadow-lg shadow-sky-600/20 whitespace-nowrap"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Quick Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="p-2 rounded-lg bg-sky-500/10 w-fit mb-2">
                <Icon className="h-5 w-5 text-sky-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sky-400" />
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
            >
              <h3 className="text-sm font-semibold text-white flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
                {faq.question}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Headphones className="h-5 w-5 text-amber-400" />
          Contact Support
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* WhatsApp */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-white">WhatsApp</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Chat with our support team on WhatsApp
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-slate-200">
                +963 583 59 136
              </span>
              <button
                onClick={handleCopyPhone}
                className="p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                {copiedPhone ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>
            <a
              href="https://wa.me/96358359136"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-600/20"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat on WhatsApp</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Email */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-sky-500/20">
                <Mail className="h-5 w-5 text-sky-400" />
              </div>
              <span className="text-sm font-semibold text-white">Email</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Send us an email and we'll get back to you
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-slate-200">
                hdayaaslam34@gmail.com
              </span>
              <button
                onClick={handleCopyEmail}
                className="p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                {copiedEmail ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>
            <a
              href="mailto:hdayaaslam34@gmail.com"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-lg shadow-sky-600/20"
            >
              <Mail className="h-4 w-4" />
              <span>Send Email</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Phone */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Phone className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-white">Phone</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Call us during business hours
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-slate-200">
                +963 583 59 136
              </span>
              <button
                onClick={handleCopyPhone}
                className="p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                {copiedPhone ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>
            <a
              href="tel:+96358359136"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-lg shadow-purple-600/20"
            >
              <Phone className="h-4 w-4" />
              <span>Call Now</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Settings,
            label: "Settings",
            href: "/settings",
            color: "text-sky-400",
            bg: "bg-sky-500/10",
          },
          {
            icon: History,
            label: "History",
            href: "/history",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            icon: Crown,
            label: "Subscription",
            href: "/subscription",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={index}
              href={item.href}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-[10px] text-slate-400">Go to {item.label}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 ml-auto group-hover:translate-x-1 transition" />
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>
            © {new Date().getFullYear()} SecureLens. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Support: 24/7
          </span>
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3 text-emerald-400" />
            SOC 2 Compliant
          </span>
        </div>
      </div>
    </div>
  );
}
