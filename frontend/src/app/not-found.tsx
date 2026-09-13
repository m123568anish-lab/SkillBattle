import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-center text-white">
      <div>
        <Compass className="mx-auto h-14 w-14 text-cyan-400" />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">404</p>
        <h1 className="mt-3 text-4xl font-black">This arena does not exist</h1>
        <p className="mt-3 text-slate-400">The page may have moved or the link may be outdated.</p>
        <Link href="/" className="mt-7 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950">Return home</Link>
      </div>
    </main>
  );
}