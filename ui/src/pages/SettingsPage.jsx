// src/pages/SettingsPage.jsx
import { Moon, Sun, SlidersHorizontal } from "lucide-react";

export default function SettingsPage({ darkMode, setDarkMode }) {
  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SlidersHorizontal size={24} className="text-pastel-brown" />
        Settings
      </h1>

      <div className="space-y-6">

        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div>
            <h2 className="font-semibold">Will be updated later.</h2>
          </div>
        </div>
      </div>
    </div>
  );
}