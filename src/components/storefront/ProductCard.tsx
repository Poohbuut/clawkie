import Link from 'next/link';

type Props = {
  href: string;
  name: string;
  price: string;
  label?: string;
  image?: string | null;
  cta: string;
  ctaHref: string;
};

export default function ProductCard({ href, name, price, label, image, cta, ctaHref }: Props) {
  return (
    <article className="group text-ink">
      <Link href={href} className="block overflow-hidden rounded-md bg-tan">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex aspect-square items-center justify-center text-6xl transition duration-300 group-hover:scale-110" aria-hidden="true">🍪</div>
        )}
      </Link>
      <div className="mt-3">
        {label && <p className="text-[11px] font-semibold uppercase tracking-wider opacity-50">{label}</p>}
        <h3 className="mt-0.5 text-[0.95rem] font-semibold leading-snug">
          <Link href={href} className="underline-offset-4 hover:underline">{name}</Link>
        </h3>
        <p className="mt-1 text-sm opacity-70">{price}</p>
        <Link href={ctaHref} className="mt-3 block rounded-md border border-ink py-2 text-center text-sm font-semibold transition-colors hover:bg-ink hover:text-cream">
          {cta}
        </Link>
      </div>
    </article>
  );
}