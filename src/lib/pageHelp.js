// Hướng dẫn nhanh cho từng trang, hiện khi bấm nút (!) cạnh tiêu đề.
// Khóa là tiêu đề trang (prop title của PageHeader). Thêm trang mới thì thêm một mục ở đây.
// purpose: trang dùng để làm gì • who: ai dùng • steps: các bước thường làm • note: lưu ý quan trọng (tùy chọn).

export const PAGE_HELP = {
  'Tổng quan': {
    purpose: 'Màn hình đầu ngày: xem nhanh tình hình Face ID toàn trường và những việc đang cần người xử lý.',
    who: 'Mọi cán bộ vận hành.',
    steps: [
      'Xem 4 chỉ số trên cùng; bấm vào chỉ số để mở danh sách chi tiết tương ứng.',
      'Bảng "Tỷ lệ phủ" xếp từ thấp đến cao: đơn vị tô vàng là nơi cần đôn đốc thu thập.',
      'Mục "Cần xử lý" ở cuối trang là danh sách việc gấp; bấm từng dòng để đi tới đúng trang xử lý.',
    ],
    note: 'Đổi đơn vị ở thanh trên cùng để xem số liệu của riêng một khoa, phòng.',
  },
  'Hồ sơ định danh': {
    purpose: 'Danh sách mọi người có (hoặc sắp có) Face ID: sinh viên, cán bộ, nhà thầu, cư dân KTX, khách. Mỗi hồ sơ có 5 trạng thái riêng: đồng ý, thu thập, hiệu lực, yêu cầu, rủi ro.',
    who: 'Phòng Đào tạo, cán bộ quản lý hồ sơ.',
    steps: [
      'Dùng các tab (Chưa thu thập, Chưa có đồng ý, Có cờ rủi ro…) hoặc ô tìm kiếm để lọc.',
      'Bấm một dòng để mở chi tiết: xem ảnh, lịch sử yêu cầu, khóa / mở khóa, tạo yêu cầu chụp lại hoặc thu hồi.',
      'Tích chọn nhiều hồ sơ để thao tác hàng loạt (nhắc thu thập, yêu cầu chụp lại, khóa).',
    ],
    note: 'Hồ sơ chưa có đồng ý hợp lệ thì mọi thao tác sinh trắc bị khóa. Xem ảnh gốc phải nêu lý do và được ghi nhật ký.',
  },
  'Hộp yêu cầu': {
    purpose: 'Hàng đợi duyệt mọi yêu cầu về Face ID: đăng ký mới, chụp lại, gia hạn, thu hồi, rút đồng ý.',
    who: 'Người duyệt theo từng bước: Phòng Đào tạo, Trưởng đơn vị, HCQT, cán bộ bảo vệ dữ liệu.',
    steps: [
      'Tab "Chờ duyệt" xếp theo hạn xử lý; yêu cầu sắp quá hạn hiện chữ đỏ.',
      'Chọn một yêu cầu, xem lý do người gửi, kết quả kiểm tra của AI và chuỗi phê duyệt.',
      'Bấm Duyệt (kèm ghi chú) hoặc Từ chối (bắt buộc nêu lý do; lý do được gửi về App cho người gửi).',
    ],
    note: 'Mỗi bước chỉ vai trò được giao mới duyệt được. Thu hồi cần 2 cán bộ khác nhau. Không được từ chối yêu cầu rút đồng ý.',
  },
  'Bảo vệ dữ liệu cá nhân': {
    purpose: 'Theo dõi việc tuân thủ luật bảo vệ dữ liệu cá nhân: ai đã đồng ý cho xử lý khuôn mặt, theo điều khoản nào, cho mục đích gì, lưu bao lâu, và xóa dữ liệu khi có người rút đồng ý.',
    who: 'Cán bộ bảo vệ dữ liệu, Kiểm toán viên, Phòng Đào tạo.',
    steps: [
      'Tab "Trạng thái đồng ý": xem tỷ lệ; gửi lời mời xác nhận điều khoản mới cho người còn ở điều khoản cũ.',
      'Khung "Quyền được lãng quên": theo dõi tiến độ xóa dữ liệu của người đã rút đồng ý, bấm "Thực hiện bước tiếp".',
      'Tab "Mục đích xử lý" và "Lưu trữ & DPIA": kiểm tra mục đích nào đã có căn cứ pháp lý trước khi bật quy tắc mới.',
    ],
    note: 'Không có đồng ý hợp lệ thì hệ thống không xử lý sinh trắc của người đó.',
  },
  'Chính sách & quy tắc': {
    purpose: 'Nơi cấu hình cách hệ thống vận hành cho từng loại đối tượng: nhận ảnh từ đâu, ngưỡng chất lượng, ai duyệt, được vào khu vực nào; cùng các quy tắc phát hiện sự kiện và người nhận cảnh báo.',
    who: 'Quản trị hệ thống, Phòng Đào tạo.',
    steps: [
      'Tab "Chính sách sinh trắc": bấm Chỉnh sửa để mở trình sửa từng bước; có thể chạy thử trước khi lưu.',
      'Tab "Quy tắc sự kiện": tạo quy tắc từ mẫu, cho chạy bóng để so sánh, rồi gửi duyệt bật thật.',
      'Tab "Nhận cảnh báo": chọn ai nhận, qua kênh nào và leo thang khi chưa ai tiếp nhận.',
    ],
    note: 'Mỗi lần lưu tạo một phiên bản mới, không ghi đè; có thể khôi phục phiên bản cũ.',
  },
  'Đơn vị tổ chức': {
    purpose: 'Cây khoa, phòng ban, đơn vị thuê ngoài. Dùng để khoanh phạm vi chính sách và lọc số liệu theo đơn vị.',
    who: 'Quản trị hệ thống.',
    steps: [
      'Đơn vị đồng bộ từ Hệ thống Nhân sự hoặc Cổng Nhà thầu chỉ xem được, muốn sửa thì sửa ở hệ thống nguồn.',
      'Bấm "Thêm đơn vị" để khai báo nhóm hoặc đơn vị chưa có trong nguồn.',
    ],
  },
  'Không gian & khu vực': {
    purpose: 'Sơ đồ Tòa → Tầng → Phòng, loại khu vực (công khai, hạn chế, cấm) và thiết bị gắn ở từng phòng.',
    who: 'Phòng Hành chính - Quản trị, Quản trị hệ thống.',
    steps: [
      'Chọn phòng trên cây để xem loại khu vực và thiết bị đang gắn.',
      'Phòng mới phải được "Duyệt hạ tầng" trước khi gán thiết bị và đưa vào chính sách.',
      'Tab "Quyền ra vào": cấp hoặc từ chối quyền vào khu vực cho từng nhóm người.',
    ],
  },
  'Thiết bị': {
    purpose: 'Danh sách camera, cổng xoay, đầu ghi, thiết bị mạng: đang ở đâu, còn kết nối không, đồng bộ giờ chưa.',
    who: 'Bộ phận kỹ thuật.',
    steps: [
      'Lọc "Mất kết nối" để thấy thiết bị cần kiểm tra ngay.',
      'Bấm "Khai báo thiết bị" khi lắp mới, sau đó gán vào phòng ở trang Không gian & khu vực.',
    ],
    note: 'Thiết bị chỉ gán được vào phòng đã duyệt hạ tầng.',
  },
  'Nguồn dữ liệu & tích hợp': {
    purpose: 'Theo dõi dữ liệu đi vào (Đào tạo, Nhân sự, KTX, Nhà thầu, Chấm công) và sự kiện SACIP gửi sang hệ thống khác (cổng ra vào, thông báo, Đào tạo).',
    who: 'Bộ phận kỹ thuật, Quản trị hệ thống.',
    steps: [
      'Tab "Nguồn đầu vào": nguồn báo lỗi (chấm đỏ trên menu) là dữ liệu đang cũ, cần liên hệ hệ thống nguồn.',
      'Tab "Sự kiện gửi đi": sự kiện "Đang thử lại" nghĩa là hệ thống nhận chưa phản hồi; có thể gửi lại thủ công.',
    ],
  },
  'Lịch học & điểm danh': {
    purpose: 'Điểm danh theo từng tiết học dựa trên lịch của Hệ thống Đào tạo, cùng các ngoại lệ học vụ (dạy thay, khiếu nại điểm danh).',
    who: 'Phòng Đào tạo, giảng viên.',
    steps: [
      'Tab "Lịch học": chọn ngày, bấm Chi tiết để xem kết quả từng sinh viên trong một tiết.',
      'Tab "Ngoại lệ & khiếu nại": duyệt buổi dạy thay chưa đăng ký, xử lý khiếu nại điểm danh của sinh viên.',
      'Tab "Báo cáo hiện diện": xem tỷ lệ có mặt theo khoa và sinh viên sắp vượt ngưỡng vắng; đẩy kết quả đã chốt về Hệ thống Đào tạo.',
    ],
    note: '"Không xác định" không tính là vắng. Kết quả chỉ chốt sau khi GV xác nhận và hết hạn khiếu nại.',
  },
  'Sự cố an ninh': {
    purpose: 'Bàn trực an ninh: sự cố cần người xử lý ngay như vào sai khu vực, nghi giả mạo khuôn mặt, thiết bị an ninh hỏng.',
    who: 'Trực an ninh.',
    steps: [
      'Sự cố mới nằm đầu danh sách; bấm "Tiếp nhận" để báo cho người khác biết bạn đang xử lý.',
      'Cần thì bấm "Xem minh chứng" (phải nêu lý do) để xem video.',
      'Xử lý xong bấm "Đóng sự cố" và ghi lại đã làm gì.',
    ],
    note: 'Khuôn mặt luôn được làm mờ. Chấm đỏ trên menu nghĩa là còn sự cố nghiêm trọng chưa ai tiếp nhận.',
  },
  'Lượt ra vào khu vực': {
    purpose: 'Ghi lại mỗi lần một người đi qua ranh giới một khu vực có camera (ai, khu nào, vào hay ra, lúc nào), giống trạm camera giao thông ghi biển số.',
    who: 'Trực an ninh (gửi tra cứu), Kiểm toán viên (duyệt tra cứu).',
    steps: [
      'Tab "Luồng ghi nhận" và "Lưu lượng theo zone": xem tổng quan, danh tính luôn bị che.',
      'Muốn xem hành trình của một người: gửi yêu cầu tra cứu kèm mã sự cố và lý do.',
      'Một người khác (Kiểm toán viên) duyệt thì mới bấm "Xem hành trình" được.',
    ],
    note: 'Không dùng để kiểm tra chuyên cần hay chấm công. Mọi lượt tra cứu đều ghi vào Nhật ký truy vết.',
  },
  'Giám sát AI': {
    purpose: 'Kiểm tra bộ máy AI có chạy tốt và công bằng không: tốc độ, độ chính xác, tỷ lệ tự duyệt, ảnh bị loại vì sao, AI có chấm lệch cho một nhóm nào không.',
    who: 'Bộ phận kỹ thuật, Kiểm toán viên.',
    steps: [
      'Xem các chỉ số so với mục tiêu ghi bên dưới mỗi số.',
      'Khung "Cảnh báo lệch chuẩn": tìm nguyên nhân (ánh sáng, thiết bị…), xử lý xong bấm "Đóng cảnh báo".',
      'Bấm "Nghi giả mạo đang mở" để chuyển sang Sự cố an ninh xem từng vụ.',
    ],
  },
  'Nhật ký truy vết': {
    purpose: 'Ghi lại ai đã làm gì trên hệ thống, lúc nào, với hồ sơ nào. Dùng để trả lời câu hỏi "ai đã làm việc này?" khi có khiếu nại, sự cố hoặc thanh tra.',
    who: 'Kiểm toán viên, cán bộ bảo vệ dữ liệu.',
    steps: [
      'Tìm theo tên người, mã hồ sơ hoặc lọc theo loại hành động (ví dụ "Xem ảnh gốc").',
      'Bấm "Kiểm tra toàn vẹn" để chắc chắn không dòng nào bị sửa hay xóa.',
      'Bấm "Xuất kèm mã băm" để lấy tệp làm bằng chứng gửi cơ quan thanh tra.',
    ],
    note: 'Nhật ký không sửa, không xóa được, kể cả với Quản trị. Dòng tô vàng là thao tác nhạy cảm.',
  },
};
