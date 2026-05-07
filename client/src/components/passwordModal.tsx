"use client";

import { useState } from "react";
import { useLanguage } from "@/app/terminology/LanguageContext";
import { passwordModal } from "@/app/terminology/language/modals/password";
import { usersService } from "@/services/users.service";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordModal({ isOpen, onClose }: PasswordModalProps) {
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(t(passwordModal.passwordTooShort || "A senha deve ter no mínimo 8 caracteres"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t(passwordModal.passwordMismatch));
      return;
    }

    try {
      await usersService.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao alterar a senha.");
      }
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-[#b9b9c2]/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-8 animate-fadeIn bg-white text-gray-900"
        onClick={handleModalClick}
      >
        <h2 className="text-center text-xl font-semibold mb-6 text-gray-900">
          {t(passwordModal.title)}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm block mb-2 text-gray-600">
              {t(passwordModal.currentPassword)}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-800 placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="text-sm block mb-2 text-gray-600">
              {t(passwordModal.newPassword)}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-800 placeholder-gray-500"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-sm block mb-2 text-gray-600">
              {t(passwordModal.confirmPassword)}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-800 placeholder-gray-500"
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
            className="w-full mt-4 py-2.5 rounded-xl font-medium transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {t(passwordModal.title)}
          </button>
        </form>
      </div>

      {success && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg animate-fadeIn bg-green-600 text-white">
          {t(passwordModal.passwordChanged)}
        </div>
      )}
    </div>
  );
}
