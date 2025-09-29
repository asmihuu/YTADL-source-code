import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Download" },
    { path: "/library", label: "Library" },
    { path: "/settings", label: "Settings" },
  ];

  return (
    <aside className="w-1/4 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col gap-4">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-left px-3 py-2 rounded-md transition ${
              location.pathname === item.path
                ? "bg-brown-500 text-white dark:bg-brown-400"
                : "hover:bg-brown-200 dark:hover:bg-brown-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
