import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col md:flex-row">
      <Link
        href="/nails"
        className="group flex flex-1 flex-col items-center justify-center bg-cream px-6 py-20 text-nails transition-[flex] duration-500 hover:flex-[1.15]"
      >
        <div className="max-w-sm text-center">
          <p className="mb-3 text-xs font-bold tracking-widest opacity-65">Nail studio</p>
          <h1 className="mb-4 font-serif text-5xl font-medium leading-tight md:text-6xl">Clawsette</h1>
          <p className="mb-8 font-medium opacity-80">Book a nail appointment and bring your inspiration photo.</p>
          <span className="inline-flex rounded-full border border-current px-6 py-3 text-sm font-bold transition-colors group-hover:bg-nails group-hover:text-cream">
            Book an appointment
          </span>
        </div>
      </Link>

      <div className="z-10 flex justify-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 max-md:-my-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-black/5 bg-white font-serif text-2xl italic shadow-lg shadow-black/5">
          &amp;
        </span>
      </div>

      <Link
        href="/cookies"
        className="group flex flex-1 flex-col items-center justify-center bg-cream px-6 py-20 text-cookie transition-[flex] duration-500 hover:flex-[1.15]"
      >
        <div className="max-w-sm text-center">
          <p className="mb-3 text-xs font-bold tracking-widest opacity-65">Home bakery</p>
          <h1 className="mb-4 font-display text-5xl font-semibold leading-tight md:text-6xl">Cookie Cart</h1>
          <p className="mb-8 font-medium opacity-80">Order fresh-baked cookies for pick-up or delivery.</p>
          <span className="inline-flex rounded-full border border-current px-6 py-3 text-sm font-bold transition-colors group-hover:bg-cookie group-hover:text-cream">
            Order cookies
          </span>
        </div>
      </Link>
    </main>
  );
}
