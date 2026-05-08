"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/sidebar";
import PasswordModal from "@/components/passwordModal";
import { Settings, Check } from "lucide-react";
import { usersService } from "@/services/users.service";
import { Currency, Language as AuthLanguage } from "@/types/auth";
import { useLanguage } from "@/app/terminology/LanguageContext";
import { settings } from "@/app/terminology/language/settings";
import { common } from "@/app/terminology/language/common";

const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();

  const [currency, setCurrency] = useState<Currency>("real");
  const [userLanguage, setUserLanguage] = useState<AuthLanguage>("portuguese");
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isNameChanged, setIsNameChanged] = useState(false);

  useEffect(() => {
    if (!user) return;

    setCurrency((user.currency ?? "real") as Currency);
    setUserLanguage((user.language ?? "portuguese") as AuthLanguage);
    setEditedName(user.name);
  }, [user]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
    setIsNameChanged(e.target.value !== user?.name);
  };

  const updateName = async () => {
    if (!user || !editedName.trim()) return;
    try {
      const updatedUser = await usersService.updateProfile(editedName, user.email);
      setUser({ ...user, name: updatedUser.name });
      setIsNameChanged(false);
    } catch (err) {
      console.error("Error updating name:", err);
    }
  };

  const updateConfigs = async (newData: Partial<{ currency: Currency; language: AuthLanguage }>) => {
    try {
      const newCurrency = newData.currency ?? currency;
      const newLanguage = newData.language ?? userLanguage;

      const updatedUser = await usersService.updateSettings(
        newLanguage,
        newCurrency
      );

      if ("currency" in newData) {
        setCurrency(updatedUser.currency);
      }

      if ("language" in newData) {
        setUserLanguage(updatedUser.language);
      }

      setUser(updatedUser);
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  const accentColor = "bg-blue-600";
  const accentHover = "hover:bg-blue-700";

  const btnClass = (isActive: boolean, position?: "left" | "right") => {
    const base = "px-4 py-2 text-sm transition-colors";
    const rounded =
      position === "left"
        ? "rounded-l"
        : position === "right"
          ? "rounded-r"
          : "";
    const color = isActive
      ? `${accentColor} ${accentHover} text-white font-medium border-transparent`
      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300";
    return `${base} ${rounded} ${color}`;
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-gray-900">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 md:ml-64 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 text-center md:text-left">{t(settings.title)}</h1>
        </header>

        <div
          className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 md:p-10 max-w-6xl mx-auto w-full min-h-[85vh] flex flex-col"
        >

          <div className="flex flex-col sm:flex-row flex-wrap gap-8 sm:gap-12 mb-10">

            <div className="flex flex-col w-full sm:w-auto">
              <h2 className="font-medium mb-3 text-gray-700">{t(settings.currency)}</h2>
              <div className="flex">

                <button
                  className={btnClass(currency === "dollar", "left")}
                  disabled={currency === "dollar"}
                  onClick={() => currency !== "dollar" && updateConfigs({ currency: "dollar" })}
                >
                  {t(settings.dollarUSD)}
                </button>

                <button
                  className={btnClass(currency === "euro")}
                  disabled={currency === "euro"}
                  onClick={() => currency !== "euro" && updateConfigs({ currency: "euro" })}
                >
                  {t(settings.euroEUR)}
                </button>

                <button
                  className={btnClass(currency === "real", "right")}
                  disabled={currency === "real"}
                  onClick={() => currency !== "real" && updateConfigs({ currency: "real" })}
                >
                  {t(settings.realBRL)}
                </button>

              </div>
            </div>

            <div className="flex flex-col w-full sm:w-auto">
              <h2 className="font-medium mb-3 text-gray-700">{t(settings.language)}</h2>
              <div className="flex">

                <button
                  className={btnClass(userLanguage === "spanish", "left")}
                  disabled={userLanguage === "spanish"}
                  onClick={() => userLanguage !== "spanish" && updateConfigs({ language: "spanish" })}
                >
                  {t(settings.spanish)}
                </button>

                <button
                  className={btnClass(userLanguage === "english")}
                  disabled={userLanguage === "english"}
                  onClick={() => userLanguage !== "english" && updateConfigs({ language: "english" })}
                >
                  {t(settings.english)}
                </button>

                <button
                  className={btnClass(userLanguage === "portuguese", "right")}
                  disabled={userLanguage === "portuguese"}
                  onClick={() => userLanguage !== "portuguese" && updateConfigs({ language: "portuguese" })}
                >
                  {t(settings.portuguese)}
                </button>

              </div>
            </div>

          </div>


          <div className="flex flex-col gap-6 flex-grow">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col flex-1">
                <label className="block font-medium mb-2 text-gray-700">{t(settings.userName)}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={handleNameChange}
                    placeholder={t(settings.loading) || "..."}
                    className="w-fit bg-gray-100 rounded-lg px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                  {isNameChanged && (
                    <button
                      onClick={updateName}
                      className={`p-3 rounded-lg ${accentColor} ${accentHover} text-white shadow-sm transition-all hover:scale-105 active:scale-95`}
                      title={t(common.save)}
                    >
                      <Check size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col">
                  <label className="block font-medium mb-2 text-gray-700">{t(settings.userEmail)}</label>
                  <input
                    type="email"
                    value={user?.email || t(settings.loading) || "..."}
                    readOnly
                    disabled={true}
                    className="w-fit bg-gray-300/80 text-gray-600 rounded-lg px-3 py-3 text-sm"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="block font-medium mb-2 text-gray-700">{t(settings.password)}</label>
                  <button
                    onClick={() => setPasswordModalOpen(true)}
                    className={`px-4 py-3 rounded ${accentColor} ${accentHover} text-white text-sm font-medium flex items-center justify-center gap-2`}
                  >
                    <Settings size={16} />
                    {t(settings.changePassword)}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
};

export default SettingsPage;
