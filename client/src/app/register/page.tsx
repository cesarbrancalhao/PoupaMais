'use client';

import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthLanguage } from "@/app/terminology/useAuthLanguage";
import { auth } from "@/app/terminology/language/auth";
import { verificationModal as verificationModalText } from "@/app/terminology/language/modals/verification";
import { authService } from "@/services/auth.service";
import { verificationService } from "@/services/verification.service";
import LanguageSelector from "@/components/LanguageSelector";
import VerificationModal from "@/components/verificationModal";
import type { Language as AuthLanguage } from "@/types/auth";
import type { Language } from "@/app/terminology/language/types";

const languageToAuthLanguageMap: Record<Language, AuthLanguage> = {
  pt: "portuguese",
  en: "english",
  es: "spanish",
};

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingData, setPendingData] = useState<{ name: string; email: string; password: string; language: AuthLanguage } | null>(null);
  const { register, isAuthenticated, setUser } = useAuth();
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

    if (!name || !email || !password || !confirmPassword) {
      setError(t(auth.fillAllFields));
      return;
    }

    if (name.trim().length < 2) {
      setError(t(auth.nameMinLength));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t(auth.invalidEmail));
      return;
    }

    if (password.length < 8) {
      setError(t(auth.passwordTooShort));
      return;
    }

    if (password !== confirmPassword) {
      setError(t(auth.passwordMismatch));
      return;
    }

    setLoading(true);

    try {
      const registerData = { name, email, password, language: languageToAuthLanguageMap[language] };
      await register(registerData);

      setPendingData(registerData);
      setPendingEmail(email);
      setShowVerificationModal(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message || t(auth.registerError));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    try {
      const response = await verificationService.verifyCode(pendingEmail, code);

      authService.setAuthDataFromVerification(response.access_token, response.user);
      setUser(response.user);

      router.push('/dashboard');
    } catch (err) {
      const error = err as Error;
      throw new Error(error.message || t(verificationModalText.invalidCode));
    }
  };

  const handleResendCode = async () => {
    if (!pendingData) {
      throw new Error("No pending registration");
    }

    try {
      await register(pendingData);
    } catch (err) {
      const error = err as Error;
      throw new Error(error.message || "Error resending code");
    }
  };

  return (
    <>
      <VerificationModal
        isOpen={showVerificationModal}
        email={pendingEmail}
        language={language}
        onVerify={handleVerifyCode}
        onResend={handleResendCode}
      />

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
            <h1 className="mt-4 text-2xl font-semibold text-gray-800">{t(auth.registerTitle)}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(auth.name)}
              </label>
              <input
                type="text"
                placeholder={t(auth.namePlaceholder)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-0 disabled:opacity-50"
                required
              />
            </div>

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
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">{t(auth.passwordMinLength)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(auth.confirmPasswordLabel)}
              </label>
              <input
                type="password"
                placeholder={t(auth.passwordPlaceholder)}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-0 disabled:opacity-50"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t(auth.registerLoading) : t(auth.registerButton)}
            </button>

            <p className="text-center text-sm text-gray-600">
              {t(auth.alreadyHaveAccount)}{" "}
              <Link href="/auth" className="text-indigo-500 hover:underline">
                {t(auth.loginHere)}
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
    </>
  );
}
