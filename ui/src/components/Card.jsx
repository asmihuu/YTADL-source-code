export default function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col gap-3">
      <h3 className="text-lg font-bold">{title}</h3>
      {children}
    </div>
  );
}