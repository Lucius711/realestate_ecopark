/** Keyless Google Maps embed, lazy-loaded so it costs nothing until scrolled into view. */
export default function MapEmbed({ query, title, className = "h-[340px]" }: { query: string; title: string; className?: string }) {
  const q = encodeURIComponent(query);
  return (
    <div className={`relative overflow-hidden rounded-lg border border-lineL bg-cream ${className}`}>
      <iframe title={title} src={`https://maps.google.com/maps?q=${q}&z=14&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 size-full border-0" />
      <a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 left-3 rounded bg-white px-3 py-1.5 text-[12px] font-semibold text-esp shadow">
        Mở Google Maps ↗
      </a>
    </div>
  );
}
