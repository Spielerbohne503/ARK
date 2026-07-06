/** Dezenter Lade-Zustand mit rotierendem Ring und Text. */
export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-green-400"
      />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
