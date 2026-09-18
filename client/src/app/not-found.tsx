import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--canvas)] p-6 text-[var(--ink)]">
      <section className="max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center bg-teal-700 text-white"><Compass size={21} /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-teal-700">404 / Route not found</p>
        <h1 className="mt-3 text-3xl font-semibold">This flow goes nowhere.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">The page you requested does not exist or has moved back to the workspace.</p>
        <Link className="button button-dark mt-7 rounded-md" href="/"><ArrowLeft size={15} /> Back home</Link>
      </section>
    </main>
  );
}
