import Link from "next/link";

/** Figma: "Request CTA" band on listing pages. Sends visitors to the footer contact form. */
export default function RequestCta({ title = "Chưa thấy căn phù hợp?", sub = "Gửi nhu cầu, anh Tuấn lọc căn và gửi qua Zalo trong 24 giờ.", cta = "GỬI NHU CẦU" }) {
  return (
    <section className="gutter flex flex-wrap items-center justify-between gap-6 bg-esp py-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-[26px] font-extrabold text-white">{title}</h2>
        <p className="text-[14px] text-[#D8CDBE]">{sub}</p>
      </div>
      <Link href="#contact" className="btn-gold">
        {cta}
      </Link>
    </section>
  );
}
