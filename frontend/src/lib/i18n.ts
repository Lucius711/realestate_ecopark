export type Lang = "vi" | "en";

// Copy for shared chrome and the homepage. Vietnamese is the source; English mirrors the Figma "Homepage EN" frame.
export const dict = {
  vi: {
    nav: {
      login: "ĐĂNG NHẬP",
      account: "TÀI KHOẢN CỦA TÔI",
      properties: "BẤT ĐỘNG SẢN",
      about: "VỀ TÔI",
      ecopark: "VỀ ECOPARK",
      contact: "LIÊN HỆ",
      cats: [
        {
          slug: "for-rent",
          title: "Nhà cho thuê",
          desc: "Căn hộ, biệt thự cho thuê dài hạn, vào ở ngay",
          img: "/images/towers-bougainvillea.webp",
        },
        {
          slug: "resale",
          title: "Nhà chuyển nhượng",
          desc: "Căn đã có sổ, chủ nhà bán lại",
          img: "/images/evening-street.webp",
        },
        {
          slug: "projects",
          title: "Hàng dự án",
          desc: "Mua trực tiếp từ chủ đầu tư, chính sách mới nhất",
          img: "/images/aerial-park.webp",
        },
      ],
      available: (n: number) => `${n} căn đang có`,
    },
    hero: {
      title: "AN CƯ GIỮA MIỀN XANH",
      sub: "Đồng hành cùng bạn tìm ngôi nhà lý tưởng và cơ hội đầu tư bền vững tại khu đô thị Ecopark.",
      cta: "XEM CĂN ĐANG CÓ",
    },
    meet: {
      title: "Chào mừng bạn đến Ecopark",
      body: "Mình là Tuấn. Mình là chuyên viên bất động sản sống và làm việc tại Ecopark hơn 7 năm. Mình hiểu từng phân khu, từng tòa nhà và nhịp sống của cư dân nơi đây. Với Tuấn, mỗi giao dịch không chỉ là mua bán — đó là giúp một gia đình tìm được nơi để gắn bó lâu dài, nơi có giá trị sống tuyệt vời với sự tận tâm, minh bạch và hỗ trợ trọn vẹn đến ngày bàn giao.",
      values: [
        "Tư vấn\nchân thực",
        "Giải pháp\ntối ưu",
        "Đầu tư\nhiệu quả",
        "Hỗ trợ\ntận tâm",
      ],
      cta: "TÌM HIỂU THÊM VỀ TÔI",
    },
    slider: {
      eyebrow: "DỰ ÁN",
      title: "ĐANG MỞ BÁN",
      note: "Cập nhật quỹ căn & chính sách mới nhất",
      badge: "ĐANG MỞ BÁN",
      cta: "XEM DỰ ÁN",
      empty: "Hiện chưa có dự án nào đang mở bán.",
    },
    feed: {
      eyebrow: "THEO DÕI",
      title: "Cập nhật mới nhất trên",
      followers: "NGƯỜI THEO DÕI",
      follow: "Follow",
      followBtn: "THEO DÕI @THEGREENNEST77",
      empty: "Chưa có video nào.",
    },
    search: {
      tabs: ["CHO THUÊ", "CHUYỂN NHƯỢNG", "HÀNG DỰ ÁN"],
      keyword: "Khu vực, dự án, mã căn",
      min: "Giá từ",
      max: "Giá đến",
      beds: "Phòng ngủ",
      baths: "Phòng tắm",
    },
    featured: {
      eyebrow: "NỔI BẬT",
      title: "BẤT ĐỘNG SẢN",
      seeAll: "XEM TẤT CẢ",
      empty: "Chưa có căn nào trong mục này.",
      cats: [
        {
          type: "rent",
          title: "NHÀ CHO THUÊ",
          sub: "Căn hộ & biệt thự cho thuê dài hạn, vào ở ngay",
        },
        {
          type: "resale",
          title: "NHÀ CHUYỂN NHƯỢNG",
          sub: "Căn đã có sổ, chủ nhà bán lại",
        },
        {
          type: "project",
          title: "HÀNG DỰ ÁN",
          sub: "Mua trực tiếp từ chủ đầu tư, chính sách mới nhất",
        },
      ],
      eco: {
        badge: "DỰ ÁN MỚI",
        cta: "KHÁM PHÁ DỰ ÁN",
      },
    },
    testi: {
      eyebrow: "TRAO CHÂN TÌNH",
      title: "NHẬN TÌNH YÊU",
      handover: "KHOẢNH KHẮC BÀN GIAO NHÀ",
      more: "XEM THÊM ĐÁNH GIÁ",
      empty: "Chưa có đánh giá nào.",
    },
    footer: {
      title: "LIÊN HỆ VỚI TÔI",
      name: "Họ và tên",
      email: "Email",
      phone: "Số điện thoại",
      message: "Lời nhắn",
      consent:
        "Tôi đồng ý nhận cuộc gọi / tin nhắn Zalo tư vấn từ Nguyễn Tuấn.",
      send: "GỬI",
      address: "Khu đô thị Ecopark, Văn Giang, Hưng Yên",
      links: [
        "ĐỊNH GIÁ NHÀ CỦA TÔI?",
        "HỖ TRỢ CHUYỂN ĐẾN",
        "TÌM NGÔI NHÀ MƠ ƯỚC",
        "TÌM KIẾM NHANH",
      ],
      copyright:
        "© 2026 Nguyễn Tuấn Ecopark. Bảo lưu mọi quyền.  ·  Chính sách bảo mật  ·  Sitemap",
      follow: "THEO DÕI",
    },
    modal: {
      title: "Đã gửi yêu cầu!",
      body: "Anh Tuấn sẽ liên hệ lại qua Zalo / điện thoại trong 24 giờ.",
      close: "ĐÓNG",
      error: "Chưa gửi được. Vui lòng gọi trực tiếp hoặc nhắn Zalo.",
    },
  },
  en: {
    nav: {
      login: "SIGN IN",
      account: "MY ACCOUNT",
      properties: "PROPERTIES",
      about: "ABOUT ME",
      ecopark: "ABOUT ECOPARK",
      contact: "CONTACT",
      cats: [
        {
          slug: "for-rent",
          title: "For rent",
          desc: "Long-term apartments & villas, ready to move in",
          img: "/images/towers-bougainvillea.webp",
        },
        {
          slug: "resale",
          title: "Resale",
          desc: "Titled homes sold by their owners",
          img: "/images/evening-street.webp",
        },
        {
          slug: "projects",
          title: "New projects",
          desc: "Buy direct from the developer, latest offers",
          img: "/images/aerial-park.webp",
        },
      ],
      available: (n: number) => `${n} homes available`,
    },
    hero: {
      title: "A GREEN PLACE TO CALL HOME",
      sub: "Helping you find your ideal home and lasting investment opportunities in Ecopark township.",
      cta: "VIEW AVAILABLE HOMES",
    },
    meet: {
      title: "Welcome to Ecopark",
      body: "I'm Tuan, a real estate specialist who has lived and worked in Ecopark for over 7 years. I know every district, every building and the daily rhythm of its residents. For me, every deal is more than a transaction — it is helping a family find a place to settle down, with dedication, transparency and full support until handover.",
      values: [
        "Honest\nadvice",
        "Optimal\nsolutions",
        "Smart\ninvestment",
        "Dedicated\nsupport",
      ],
      cta: "MORE ABOUT ME",
    },
    slider: {
      eyebrow: "PROJECTS",
      title: "NOW SELLING",
      note: "Latest inventory & sales policies",
      badge: "NOW SELLING",
      cta: "VIEW PROJECT",
      empty: "No projects on sale right now.",
    },
    feed: {
      eyebrow: "FOLLOW",
      title: "Latest on",
      followers: "FOLLOWERS",
      follow: "Follow",
      followBtn: "FOLLOW @THEGREENNEST77",
      empty: "No videos yet.",
    },
    search: {
      tabs: ["FOR RENT", "RESALE", "NEW PROJECTS"],
      keyword: "Area, project, listing code",
      min: "Min price",
      max: "Max price",
      beds: "Beds",
      baths: "Baths",
    },
    featured: {
      eyebrow: "FEATURED",
      title: "PROPERTIES",
      seeAll: "VIEW ALL",
      empty: "No listings in this category yet.",
      cats: [
        {
          type: "rent",
          title: "FOR RENT",
          sub: "Long-term apartments & villas, ready to move in",
        },
        {
          type: "resale",
          title: "RESALE HOMES",
          sub: "Titled homes resold by their owners",
        },
        {
          type: "project",
          title: "NEW PROJECTS",
          sub: "Buy direct from the developer, latest offers",
        },
      ],
      eco: {
        badge: "NEW PROJECT",
        cta: "EXPLORE PROJECT",
      },
    },
    testi: {
      eyebrow: "MY CLIENTS",
      title: "WHAT THEY SAY",
      handover: "HANDOVER MOMENTS",
      more: "MORE REVIEWS",
      empty: "No reviews yet.",
    },
    footer: {
      title: "CONTACT ME",
      name: "Full name",
      email: "Email",
      phone: "Phone number",
      message: "Message",
      consent: "I agree to receive calls / Zalo messages from Nguyen Tuan.",
      send: "SEND",
      address: "Ecopark Township, Van Giang, Hung Yen",
      links: [
        "WHAT'S MY HOME WORTH?",
        "HELP ME RELOCATE",
        "FIND MY DREAM HOME",
        "QUICK SEARCH",
      ],
      copyright:
        "© 2026 Nguyen Tuan Ecopark. All rights reserved.  ·  Privacy Policy  ·  Sitemap",
      follow: "FOLLOW",
    },
    modal: {
      title: "Request sent!",
      body: "Tuan will get back to you via Zalo / phone within 24 hours.",
      close: "CLOSE",
      error: "Could not send. Please call or message on Zalo.",
    },
  },
};

export type Dict = (typeof dict)["vi"];
