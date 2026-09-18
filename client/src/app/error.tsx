"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--canvas)] p-6 text-[var(--ink)]">
      <section className="max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center bg-amber-100 text-amber-700"><TriangleAlert size={21} /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-amber-700">Something interrupted the flow</p>
        <h1 className="mt-3 text-3xl font-semibold">That was unexpected.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">Try the page again. Your saved pipelines are safe in the workspace.</p>
        <div className="mt-7 flex justify-center gap-2">
          <button className="button button-dark rounded-md" type="button" onClick={() => reset()}><RotateCcw size={15} /> Try again</button>
          <Link className="button button-light rounded-md" href="/"><ArrowLeft size={15} /> Home</Link>
        </div>
      </section>
    </main>
  );
}
