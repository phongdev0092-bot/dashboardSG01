/**
 * Danh sách Slide Quy Trình & Nghiệp Vụ Kỹ Thuật FPT Telecom (Mặc định)
 * Người dùng / Admin có thể tùy chỉnh thêm, sửa, xóa trực tiếp từ Trang Quản Trị Hệ Thống.
 */
export const DEFAULT_SOP_SLIDES = [
  {
    id: 1,
    tag: "CHẤT LƯỢNG (CLL)",
    category: "Kiểm Soát Ca Lặp",
    badgeColor: "#7c3aed",
    title: "Quy Trình Triệt Tiêu CLL30N & Lặp Ca Bảo Trì",
    target: "Chỉ tiêu: CLL30N <= 7.0% • CLPS 7N BT <= 3.0%",
    steps: [
      "1. Đo kiểm công suất quang đầu vào bằng máy OPM (Chuẩn đạt: -18 dBm đến -23 dBm).",
      "2. Vệ sinh sạch sẽ Fast Connector, Adapter quang, tránh để bụi bẩn gây suy hao cao.",
      "3. Kiểm tra toàn bộ đoạn cáp thuê bao, thay thế mối nối suy giảm, bấm lại đầu quang chuẩn.",
      "4. Khảo sát lại vị trí đặt Modem/Access Point, tư vấn khách hàng đặt nơi thông thoáng.",
      "5. Đo kiểm Speedtest thực tế tại phòng khách và các phòng ngủ trước khi ký biên bản."
    ],
    note: "💡 Bí quyết: Giải quyết tận gốc nguyên nhân gốc rễ, tuyệt đối không xử lý tạm thời để phát sinh lặp lại trong 30 ngày!",
    icon: "EngineeringOutlined",
    colorGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
  },
  {
    id: 2,
    tag: "TRIỂN KHAI (TK)",
    category: "Thi Công Chuẩn Mực",
    badgeColor: "#0284c7",
    title: "Quy Trình Triển Khai Mới & Cam Kết Đúng Hẹn",
    target: "Chỉ tiêu: Đúng Hẹn TK >= 97.2% • Thời gian RT-TK <= 18H",
    steps: [
      "1. Tiếp nhận phiếu trên Mobisale, liên hệ khách hàng hẹn giờ chuẩn xác trước 15 - 30 phút.",
      "2. Khảo sát tuyến cáp từ Hộp cáp (Tủ cáp/ODF) đến nhà khách hàng đảm bảo mỹ quan đô thị.",
      "3. Kéo cáp theo đúng lộ trình kỹ thuật, đóng bọ gọn gàng, hạn chế tối đa góc uốn cong gắt.",
      "4. Kích hoạt thiết bị (Modem Wi-Fi 6 / FPT Play Box / Camera) và cấu hình tối ưu 2 băng tần (2.4G / 5G).",
      "5. Hướng dẫn khách hàng cài đặt và trải nghiệm ứng dụng Hi-FPT để tự quản trị Wi-Fi."
    ],
    note: "⚡ Cam kết: 'Đúng giờ từng phút - Tận tâm từng việc' để mang lại ấn tượng đầu tiên tốt nhất cho khách hàng mới!",
    icon: "SpeedOutlined",
    colorGradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
  },
  {
    id: 3,
    tag: "AN TOÀN LAO ĐỘNG",
    category: "Tiêu Chuẩn G-Safe",
    badgeColor: "#ea580c",
    title: "Tuân Thủ Nghiêm Ngặt An Toàn Lao Động (G-Safe)",
    target: "Tiêu chí: 100% Phiếu thi công & bảo trì an toàn tuyệt đối",
    steps: [
      "1. Trang bị đầy đủ BHLĐ: Mũ bảo hiểm chuyên dụng có quai cài, găng tay, giày cách điện.",
      "2. Kiểm tra kỹ dây đai an toàn và móc khóa trước khi leo thang / trèo trụ viễn thông.",
      "3. Khi thi công dưới lòng đường, lề đường: Bắt buộc đặt cọc tiêu phản quang cảnh báo từ xa.",
      "4. Kiểm tra điện rò trên dây kéo, trụ điện lực bằng bút thử điện trước khi tác nghiệp.",
      "5. Tuyệt đối không leo trụ trong điều kiện trời mưa to, giông sét hoặc chập tối thiếu sáng."
    ],
    note: "🛡️ Ghi nhớ: 'An toàn của bạn là hạnh phúc của gia đình!' An toàn lao động luôn là ưu tiên hàng đầu số 1.",
    icon: "ShieldOutlined",
    colorGradient: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)"
  },
  {
    id: 4,
    tag: "TRẢI NGHIỆM KHÁCH HÀNG",
    category: "Văn Hóa Phục Vụ",
    badgeColor: "#059669",
    title: "Tác Phong Chuyên Nghiệp & Trải Nghiệm Khách Hàng Tuyệt Hảo",
    target: "Mục tiêu: Đánh giá dịch vụ 5 sao từ 100% khách hàng",
    steps: [
      "1. Đồng phục FPT Telecom chỉnh tề, gọn gàng, đeo thẻ nhân viên đúng quy định khi tới nhà KH.",
      "2. Chủ động đeo bọc giày khi bước vào sàn nhà của khách hàng để giữ gìn vệ sinh chung.",
      "3. Lắng nghe cẩn thận phản ánh của khách hàng với thái độ cầu thị, lịch thiệp và tôn trọng.",
      "4. Dọn dẹp sạch sẽ toàn bộ mẩu cáp vụn, vỏ ốc, dây thít sau khi hoàn tất công việc.",
      "5. Bàn giao thiết bị, gửi lại danh thiếp hỗ trợ và hướng dẫn số tổng đài khi cần hỗ trợ gấp."
    ],
    note: "🌟 Phương châm: Mỗi kỹ thuật viên là một đại sứ thương hiệu mang lại sự tin cậy tuyệt đối cho FPT Telecom.",
    icon: "SentimentSatisfiedAltOutlined",
    colorGradient: "linear-gradient(135deg, #059669 0%, #047857 100%)"
  },
  {
    id: 5,
    tag: "MẸO SỬ DỤNG HỆ THỐNG",
    category: "Khai Thác Dashboard KPI",
    badgeColor: "#d97706",
    title: "Mẹo Khai Thác Nhanh Dữ Liệu & Báo Cáo Trên Hệ Thống",
    target: "Tiện ích: Tra cứu tức thì - Điều hành chủ động",
    steps: [
      "1. Sử dụng thanh Lọc Nhanh (Đầu tháng, Hôm nay, Hôm qua, 7 ngày) để xem báo cáo theo chu kỳ mong muốn.",
      "2. Lọc theo Đội Trưởng hoặc Block để kiểm tra sát sao hiệu suất của từng nhóm địa bàn phụ trách.",
      "3. Nhấp đúp hoặc bấm nút 'Xem Chi Tiết' tại từng nhân viên để xem danh sách toàn bộ phiếu TK và BT.",
      "4. Tận dụng bảng 'Lịch Trực' để theo dõi nhân sự trực ca, đảm bảo tỷ lệ trực và kiểm soát tồn ca tồn khoán.",
      "5. Xuất báo cáo Excel với đầy đủ chỉ số RT, CLL30N và Tỷ lệ đúng hẹn chỉ bằng 1 cú nhấp chuột."
    ],
    note: "📊 Dữ liệu là sức mạnh: Theo dõi chỉ số hàng ngày giúp bạn luôn chủ động bứt phá mọi mục tiêu KPI!",
    icon: "TipsAndUpdatesOutlined",
    colorGradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
  }
];
