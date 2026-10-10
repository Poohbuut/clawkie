import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="mt-4 bg-sage px-5 py-10 text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 text-sm sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold">Clawsette &amp; Cookie Cart</p>
          <p className="mt-2 opacity-65">Nail appointments and fresh-baked cookies.</p>
        </div>
        <nav aria-label="Shop" className="flex flex-col gap-2">
          <p className="font-semibold">Shop</p>
          <Link href="/nails" className="opacity-70 hover:underline">Nail designs</Link>
          <Link href="/nails/book" className="opacity-70 hover:underline">Book an appointment</Link>
          <Link href="/cookies" className="opacity-70 hover:underline">Order cookies</Link>
        </nav>
        <nav aria-label="Account" className="flex flex-col gap-2">
          <p className="font-semibold">Account</p>
          <Link href="/login" className="opacity-70 hover:underline">Log in</Link>
          <Link href="/account" className="opacity-70 hover:underline">Your orders &amp; bookings</Link>
        </nav>
      </div>
      <p className="mt-8 text-center text-xs opacity-50">&copy; {new Date().getFullYear()} Clawsette &amp; Cookie Cart</p>
    </footer>
  );
}