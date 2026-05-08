"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthLanguage } from "@/app/terminology/useAuthLanguage";
import { auth } from "@/app/terminology/language/auth";
import { apiService } from "@/services/api";
import PasswordRecoveryModal from "@/components/passwordRecoveryModal";
import NewPasswordModal from "@/components/newPasswordModal";

export default function RecuperarPage() {
  const { language, t } = useAuthLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t(auth.emailRequired));
      return;
    }

    setLoading(true);

    try {
      await apiService.post("/auth/request-password-reset", { email });
      setShowVerificationModal(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t(auth.loginError));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    await apiService.post("/auth/verify-reset-code", { email, code });
    setVerifiedCode(code);
    setShowVerificationModal(false);
    setShowNewPasswordModal(true);
  };

  const handleResendCode = async () => {
    await apiService.post("/auth/request-password-reset", { email });
  };

  const handleResetPassword = async (newPassword: string) => {
    await apiService.post("/auth/reset-password", {
      email,
      code: verifiedCode,
      newPassword,
    });

    setShowNewPasswordModal(false);
    router.push("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm p-12 md:p-12 w-full max-w-md md:max-w-lg min-h-96 space-y-8">
        <div className="flex flex-col items-center">
          <Image src="/logo.svg" alt="Logo" width={80} height={80} />
          <h1 className="mt-4 text-2xl font-semibold text-gray-800">
            {t(auth.recoveryTitle)}
          </h1>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {t(auth.recoveryDescription)}
          </p>
        </div>

        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(auth.email)}
            </label>
            <input
              type="email"
              placeholder={t(auth.emailPlaceholder)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-0"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="text-sm px-4 py-2 rounded-lg text-red-600 bg-red-50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t(auth.loading) : t(auth.sendRecoveryEmail)}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {t(auth.backToLogin)}
          </Link>
        </div>
      </div>

      <PasswordRecoveryModal
        isOpen={showVerificationModal}
        email={email}
        language={language}
        onVerify={handleVerifyCode}
        onResend={handleResendCode}
      />

      <NewPasswordModal
        isOpen={showNewPasswordModal}
        language={language}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
}
