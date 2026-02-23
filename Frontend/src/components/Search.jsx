export default function Search({ value, onChange, onSubmit, placeholder = "Search events..." }) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <button
        type="submit"
        className="px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
      >
        Search
      </button>
    </form>
  );
}
