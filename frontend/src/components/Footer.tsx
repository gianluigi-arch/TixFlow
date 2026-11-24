export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-slate-600 sm:flex-row sm:px-6 sm:text-left">
        <p className="font-semibold text-slate-800">
          TixFlow <span className="font-normal text-slate-500">— Campus Event Ticketing &amp; QR Access</span>
        </p>
        <p className="text-slate-500">
          Next.js, TypeScript, Tailwind CSS &amp; PostgreSQL Row-Level Locking
        </p>
      </div>
    </footer>
  );
}
