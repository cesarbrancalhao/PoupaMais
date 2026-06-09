'use client';

import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthLanguage } from "@/app/terminology/useAuthLanguage";
import { auth } from "@/app/terminology/language/auth";
import LanguageSelector from "@/components/LanguageSelector";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const { language, setLanguage, t } = useAuthLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t(auth.emailRequired) + " e " + t(auth.passwordRequired));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t(auth.invalidCredentials));
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
    } catch (err) {
      const error = err as Error;
      setError(error.message || t(auth.loginError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:basis-[30%] flex flex-col justify-center items-center px-8 bg-white relative">
        <div className="absolute top-4 right-4">
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        </div>
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center">
            <Image src="/logo.svg" alt="Logo" width={90} height={90} />
            <h1 className="mt-4 text-2xl font-semibold text-gray-800">{t(auth.loginTitle)}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(auth.email)}
              </label>
              <input
                type="email"
                placeholder={t(auth.emailPlaceholder)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-0 disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(auth.password)}
              </label>
              <input
                type="password"
                placeholder={t(auth.passwordPlaceholder)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-0 disabled:opacity-50"
                required
              />
              <div className="text-right mt-1">
                <Link href="/recover" className="text-xs text-indigo-500 hover:underline">
                  {t(auth.forgotPassword)}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t(auth.loading) || "..." : t(auth.loginButton)}
            </button>

            <p className="text-center text-sm text-gray-600">
              {t(auth.noAccount)}{" "}
              <Link href="/register" className="text-indigo-500 hover:underline">
                {t(auth.registerHere)}
              </Link>
            </p>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex lg:basis-[70%] bg-gray-50 justify-center items-center">
        <Image
          src="/illustration.svg"
          alt="Illustration"
          width={500}
          height={500}
          priority
        />
      </div>
    </div>
  );
}
