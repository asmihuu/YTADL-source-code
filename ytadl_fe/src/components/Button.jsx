export default function Button({ children, variant = "primary" }) {
  const base =
    "px-4 py-2 rounded-md font-semibold transition-colors focus:outline-none";
  const styles = {
    primary:
      "bg-brown-500 text-white hover:bg-brown-600 dark:bg-brown-400 dark:hover:bg-brown-500",
    secondary:
      "bg-gray-300 text-gray-900 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
  };

  return <button className={`${base} ${styles[variant]}`}>{children}</button>;
}
