import { Sun, Moon } from "lucide-react";

export default function Topbar({ darkMode, setDarkMode }) {
  return (
    <header className="flex justify-between items-center px-6 py-3 border-b border-gray-300 dark:border-gray-700">
      <h1 className="text-lg font-semibold">YTADL</h1>
    </header>
  );
}
