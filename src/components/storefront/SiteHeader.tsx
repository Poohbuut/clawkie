import Link from 'next/link';

export default function SiteHeader() {
  return (
    <>
      <div className="bg-sage px-4 py-2 text-center text-xs font-semibold tracking-wide text-ink">
        Nail appointments &amp; fresh-baked cookies
      </div>
      <header className="sticky top-0 z-30 border-b border-ink/15 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="font-display text-xl font-semibold text-ink">
            Clawsette &amp; Cookie Cart
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold text-ink sm:gap-5" aria-label="Main">
            <Link href="/nails" className="underline-offset-4 hover:underline">Nails</Link>
            <Link href="/cookies" className="underline-offset-4 hover:underline">Cookies</Link>
            <Link href="/login" className="underline-offset-4 hover:underline">Account</Link>
          </nav>
        </div>
      </header>
    </>
  );
}