// Từ điển giá trị dùng chung giữa backend và giao diện.
// Mã (key) giữ tiếng Anh đúng như đặc tả; nhãn (label) là tiếng Việt hiển thị cho cán bộ.

/** subject_type — quyết định bộ lọc ngữ cảnh động (Đặc tả IAM §2.2). */
export const SUBJECT_TYPE = {
  STUDENT: { label: 'Sinh viên', icon: 'school', chip: 'primary' },
  STAFF: { label: 'Cán bộ, giảng viên', icon: 'badge', chip: 'secondary' },
  CONTRACTOR: { label: 'Nhà thầu', icon: 'engineering', chip: 'neutral' },
  RESIDENT: { label: 'Cư dân KTX', icon: 'bed', chip: 'primary' },
  GUEST: { label: 'Khách', icon: 'person_pin', chip: 'neutral' },
};

/** Nguồn Face ID là thuộc tính của hồ sơ, không phải tab cố định (Đặc tả IAM §2.2). */
export const SOURCE = {
  APP: { label: 'App MyDaiNam', short: 'App', icon: 'smartphone', detail: (poses) => `${poses} tư thế` },
  CARD_DB: { label: 'Ảnh thẻ CSDL', short: 'Ảnh thẻ', icon: 'photo_library', detail: () => 'ảnh có sẵn' },
  COUNTER: { label: 'Đăng ký tại quầy', short: 'Tại quầy', icon: 'storefront', detail: (poses) => `Kiosk, ${poses} tư thế` },
};

/**
 * Năm chiều trạng thái độc lập (Đặc tả IAM §2.2, mục 4). Không gộp vào một cột status.
 * color: một trong status-active | status-pending | status-rejected | status-inactive.
 */
export const STATE = {
  collection: {
    title: 'Thu thập',
    values: {
      NOT_STARTED: { label: 'Chưa thu thập', color: 'status-inactive' },
      IN_PROGRESS: { label: 'Đang thu thập', color: 'status-pending' },
      COMPLETED: { label: 'Đã thu thập', color: 'status-active' },
      QUALITY_FAILED: { label: 'Lỗi chất lượng', color: 'status-rejected' },
    },
  },
  validity: {
    title: 'Hiệu lực',
    values: {
      NONE: { label: 'Chưa có', color: 'status-inactive' },
      PENDING_ACTIVATION: { label: 'Chờ kích hoạt', color: 'status-pending' },
      ACTIVE: { label: 'Đang hiệu lực', color: 'status-active' },
      EXPIRING: { label: 'Sắp hết hạn', color: 'status-pending' },
      LOCKED: { label: 'Đã khóa', color: 'status-rejected' },
      REVOKED: { label: 'Đã thu hồi', color: 'status-rejected' },
    },
  },
  request: {
    title: 'Yêu cầu',
    values: {
      NONE: { label: 'Không có', color: 'status-inactive' },
      OPEN: { label: 'Đang chờ duyệt', color: 'status-pending' },
      RESCAN_GRANTED: { label: 'Được chụp lại', color: 'status-active' },
    },
  },
  risk: {
    title: 'Rủi ro',
    values: {
      NONE: { label: 'Không có', color: 'status-inactive' },
      WATCH: { label: 'Cần theo dõi', color: 'status-pending' },
      HIGH: { label: 'Rủi ro cao', color: 'status-rejected' },
    },
  },
  consent: {
    title: 'Đồng ý',
    values: {
      ACTIVE: { label: 'Đã xác nhận', color: 'status-active' },
      PENDING: { label: 'Chờ xác nhận', color: 'status-pending' },
      WITHDRAWN: { label: 'Đã rút đồng ý', color: 'status-rejected' },
    },
  },
};

export const stateMeta = (dim, value) => STATE[dim].values[value] || { label: value, color: 'status-inactive' };

/** Nhãn đồng ý kèm phiên bản điều khoản, ví dụ "Đã xác nhận (v1.2)". */
export const consentLabel = (s) => (s.states.consent === 'ACTIVE' ? `Đã xác nhận (${s.consent_version})` : stateMeta('consent', s.states.consent).label);

/** request_type (Đặc tả IAM §2.3). */
export const REQUEST_TYPE = {
  RESCAN: { label: 'Chụp lại', icon: 'replay' },
  NEW_REGISTRATION: { label: 'Đăng ký mới', icon: 'person_add' },
  REVOKE: { label: 'Khóa, thu hồi', icon: 'block' },
  WITHDRAW_CONSENT: { label: 'Rút đồng ý', icon: 'gavel' },
  EXTEND: { label: 'Gia hạn', icon: 'event_repeat' },
};

/** Trạng thái hàng đợi: tab Chờ duyệt / Đã từ chối / Đã hoàn thành theo đặc tả, thêm Đã hủy cho yêu cầu người gửi tự hủy. */
export const REQUEST_STATUS = {
  pending: { label: 'Chờ duyệt', color: 'status-pending' },
  rejected: { label: 'Đã từ chối', color: 'status-rejected' },
  completed: { label: 'Đã hoàn thành', color: 'status-active' },
  cancelled: { label: 'Người gửi đã hủy', color: 'status-inactive' },
};

/** Hệ thống nhận sự kiện từ Policy Engine (Đặc tả Policy Engine §3). */
export const TRIGGER_TARGET = {
  ACADEMIC: { label: 'Hệ thống Đào tạo', icon: 'school' },
  ACCESS_CONTROL: { label: 'Kiểm soát ra vào', icon: 'door_sliding' },
  NOTIFICATION: { label: 'Thông báo (App, SMS, Email)', icon: 'notifications' },
};

export const TRIGGER_EVENT = {
  COLLECTION_COMPLETED: 'Thu thập Face ID hoàn tất (Trạng thái thu thập = Hoàn tất), không chờ duyệt hiệu lực',
  VALIDITY_CHANGED: 'Hồ sơ chuyển sang Đang hiệu lực, Đã khóa hoặc Đã thu hồi',
  RESCAN_DECIDED: 'Yêu cầu chụp lại được duyệt hoặc bị từ chối',
  RISK_FLAGGED: 'Hồ sơ bị gắn cờ rủi ro',
  CONTRACT_EXPIRING: 'Hợp đồng nhà thầu sắp hết hạn',
};

/** Kênh gửi sự kiện (Đặc tả Policy Engine §3: Kafka / RabbitMQ / Webhook). */
export const TRANSPORT = {
  KAFKA: { label: 'Kafka', dest: 'Topic', placeholder: 'faceid.access.sync' },
  RABBITMQ: { label: 'RabbitMQ', dest: 'Exchange/routing key', placeholder: 'security.events/risk.flagged' },
  WEBHOOK: { label: 'Webhook', dest: 'URL https', placeholder: 'https://…' },
};
export const transportLabel = (t) => TRANSPORT[t]?.label || t;

/** Tên ngắn cho từng loại sự kiện gửi ra ngoài. */
export const TRIGGER_SHORT = {
  ACADEMIC_VERIFIED: 'Báo Đào tạo khi đủ Face ID',
  ACCESS_SYNC: 'Cập nhật quyền tại cổng',
  NOTIFY_RESCAN: 'Báo kết quả chụp lại',
  NOTIFY_RISK: 'Báo cờ rủi ro',
  NOTIFY_CONTRACT: 'Báo hợp đồng sắp hết hạn',
  NOTIFY_DECISION: 'Báo kết quả duyệt',
  NOTIFY_RECONSENT: 'Mời xác nhận điều khoản',
};

/** action_code của nhật ký kiểm toán (Đặc tả IAM §2.6). */
export const ACTION = {
  VIEW_ORIGINAL_IMAGE: 'Xem ảnh gốc',
  AUTO_APPROVE_FACE_ID: 'AI tự duyệt Face ID',
  APPROVE_REQUEST: 'Phê duyệt yêu cầu',
  APPROVE_STEP: 'Duyệt một bước',
  REJECT_RESCAN_REQUEST: 'Từ chối yêu cầu chụp lại',
  REJECT_REQUEST: 'Từ chối yêu cầu',
  CANCEL_REQUEST: 'Người gửi hủy yêu cầu',
  CREATE_REQUEST: 'Tạo yêu cầu',
  REVOKE_FIRST_CONFIRM: 'Xác nhận thu hồi (người thứ 1)',
  LOCK_PROFILE: 'Khóa hồ sơ',
  UNLOCK_PROFILE: 'Mở khóa hồ sơ',
  ACTIVATE_PROFILE: 'Kích hoạt hiệu lực',
  SEND_REMINDER: 'Gửi nhắc nhở',
  CONSENT_WITHDRAW_CONFIRMED: 'Xác nhận rút đồng ý',
  CONSENT_RECONFIRM_REQUESTED: 'Yêu cầu xác nhận lại điều khoản',
  CONSENT_SIGNED: 'Ký xác nhận đồng ý',
  DATA_ERASED: 'Xóa dữ liệu sinh trắc',
  POLICY_VERSION_CREATED: 'Lưu phiên bản chính sách',
  POLICY_ROLLBACK: 'Khôi phục phiên bản chính sách',
  POLICY_DRY_RUN: 'Chạy thử chính sách',
  TRIGGER_EMITTED: 'Gửi sự kiện sang hệ thống ngoài',
  SOURCE_SYNC: 'Đồng bộ nguồn dữ liệu',
  KIOSK_CAPTURE: 'Kiosk chụp ảnh',
  AUDIT_EXPORT_SIGNED: 'Xuất báo cáo có chữ ký',
  AUDIT_CHAIN_VERIFIED: 'Kiểm tra toàn vẹn nhật ký',
  RISK_FLAGGED: 'Gắn cờ rủi ro',
  RISK_CLEARED: 'Gỡ cờ rủi ro',
  JOB_CONTRACT_CHECK: 'Quét hợp đồng sắp hết hạn',
  SPACE_CREATED: 'Thêm khu vực',
  SPACE_APPROVED: 'Duyệt hạ tầng khu vực',
  SPACE_ZONE_CHANGED: 'Đổi loại khu vực',
  DEVICE_ASSIGNED: 'Gán thiết bị vào phòng',
  DEVICE_UNASSIGNED: 'Gỡ thiết bị khỏi phòng',
  ORG_UNIT_CREATED: 'Thêm đơn vị',
  ORG_UNIT_UPDATED: 'Sửa đơn vị',
  ORG_UNIT_DEACTIVATED: 'Ngừng dùng đơn vị',
  ORG_UNIT_ACTIVATED: 'Dùng lại đơn vị',
  ADMIN_ACTION: 'Thao tác quản trị',
  VIEW_SENSITIVE: 'Xem dữ liệu nhạy cảm',
  SYSTEM_EVENT: 'Sự kiện hệ thống',
};

/** Vai trò và quyền (phân quyền theo vai trò, Gói 6 Blueprint). */
export const ROLES = {
  ADMIN: { label: 'Quản trị hệ thống', can: ['*'] },
  AUDITOR: { label: 'Kiểm toán viên trưởng', can: ['view', 'audit', 'view_original', 'consent'] },
  REGISTRAR: { label: 'Cán bộ Phòng Đào tạo', can: ['view', 'approve', 'view_original', 'profile_write', 'consent'] },
  SECURITY: { label: 'Trực an ninh', can: ['view', 'security', 'lock'] },
};

export const can = (role, perm) => ROLES[role].can.includes('*') || ROLES[role].can.includes(perm);
