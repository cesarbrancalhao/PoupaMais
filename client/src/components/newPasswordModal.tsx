"use client";

import { useState } from "react";
import { passwordRecoveryModal } from "@/app/terminology/language/modals/passwordRecovery";
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_MIN_LENGTH,
} from "@/utils/password";

interface NewPasswordModalProps {
  isOpen: boolean;
  language: "pt" | "en" | "es";
  onResetPassword: (newPassword: string) => Promise<void>;
}

export default function NewPasswordModal({
  isOpen,
  language,
  onResetPassword
}: NewPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const t = (key: { pt: string; en: string; es: string }) => key[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError(t(passwordRecoveryModal.passwordRequired));
      return;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(t(passwordRecoveryModal.passwordTooShort));
      return;
    }

    if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
      setError(PASSWORD_COMPLEXITY_MESSAGE);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t(passwordRecoveryModal.passwordMismatch));
      return;
    }

    setLoading(true);

    try {
      await onResetPassword(newPassword);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t(passwordRecoveryModal.invalidCode));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleModalClick}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-8 animate-fadeIn bg-white text-gray-900"
        onClick={handleModalClick}
      >
        <h2 className="text-center text-xl font-semibold mb-4 text-gray-900">
          {t(passwordRecoveryModal.newPasswordTitle)}
        </h2>

        <p className="text-center text-sm text-gray-600 mb-6">
          {t(passwordRecoveryModal.newPasswordDescription)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(passwordRecoveryModal.newPassword)}
            </label>
            <input
              type="password"
              placeholder={t(passwordRecoveryModal.newPasswordPlaceholder)}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-800 placeholder-gray-500"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(passwordRecoveryModal.confirmPassword)}
            </label>
            <input
              type="password"
              placeholder={t(passwordRecoveryModal.confirmPasswordPlaceholder)}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-800 placeholder-gray-500"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          {error && (
            <div className="text-sm px-4 py-2 rounded-lg text-red-600 bg-red-50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full mt-4 py-2.5 rounded-xl font-medium transition-all bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t(passwordRecoveryModal.resetting) : t(passwordRecoveryModal.resetPassword)}
          </button>
        </form>
      </div>
    </div>
  );
}
