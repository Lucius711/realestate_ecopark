import Image from "next/image";
import { Icon } from "../Icons";
import BookingForm from "./BookingForm";
import { CONTACT } from "@/lib/contact";

/** Figma 157:3728 sticky "Agent card": call + Zalo, then "Đặt lịch xem nhà" form. */
export default function AgentCard({ propertyCode, source }: { propertyCode?: string; source?: string }) {
  return (
    <aside className="flex flex-col gap-3 self-start rounded-lg border border-lineL bg-white p-6 shadow-[0_10px_30px_rgba(51,38,26,0.08)] lg:sticky lg:top-[110px]">
      <div className="flex items-center gap-3 pb-1">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full">
          <Image src="/images/tuan-portrait.webp" alt="" fill sizes="56px" className="object-cover" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-[16px] font-bold text-esp">Nguyễn Tuấn</p>
          <p className="text-[12px] text-muted">Chuyên viên BĐS Ecopark · 8 năm</p>
          <p className="flex items-center gap-0.5 text-[11px] text-muted">
            {Array.from({ length: 5 }, (_, i) => (
              <Icon key={i} name="star" size={10} className="text-gold" />
            ))}
            <span className="ml-1">4.9 (120 đánh giá)</span>
          </p>
        </div>
      </div>
      <a href={`tel:${CONTACT.phoneTel}`} className="btn-gold justify-center">
        <Icon name="phone" size={15} /> GỌI {CONTACT.phone}
      </a>
      <a href={CONTACT.zalo} target="_blank" rel="noopener noreferrer" className="btn justify-center bg-zalo text-white hover:brightness-110">
        NHẮN ZALO
      </a>
      <div className="mt-2 flex flex-col gap-2.5 border-t border-lineL pt-4">
        <p className="text-[14px] font-bold text-esp">Đặt lịch xem nhà</p>
        <BookingForm propertyCode={propertyCode} source={source} />
      </div>
      <p className="text-[11px] text-soft">Phản hồi trong 15 phút · Miễn phí dẫn xem</p>
    </aside>
  );
}
