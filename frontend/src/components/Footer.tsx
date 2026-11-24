export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-slate-600 sm:flex-row sm:px-6 sm:text-left">
        <p className="font-medium text-slate-700">
          TixFlow — Concurrent Campus Event Ticketing &amp; QR Access System
        </p>
        <p>Dibangun dengan Next.js, TypeScript, Tailwind CSS &amp; Express + PostgreSQL</p>
      </div>
    </footer>
  );
}
