import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--canvas)] text-[var(--ink)]">
      <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
        <LoaderCircle className="animate-spin text-teal-700" size={18} />
        Opening your workspace
      </div>
    </main>
  );
}
