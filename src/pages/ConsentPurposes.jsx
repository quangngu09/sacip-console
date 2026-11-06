import { Banner, Chip, Icon } from '../components/ui';
import { useRules } from '../data/rulesStore';
import { DPIA, OPT_OUT_RULES, PURPOSES, RETENTION } from '../data/attendance';
import { fmtNumber, fmtPercent } from '../lib/format';

/** Mục đích xử lý: đồng ý riêng cho từng mục đích (Luật 91/2025, Đ.9). Quy tắc chỉ bật được khi mục đích đã có đồng ý. */
export function PurposesTab() {
  const [RULES] = useRules();
  const drafts = PURPOSES.filter((p) => p.status === 'draft').length;
  return (
    <div className="flex flex-col gap-space-md">
      <Banner tone="warn" icon="gavel" title={`${drafts} mục đích mới chưa có căn cứ.`}>
        Điều khoản v1.2 chỉ gồm điểm danh lớp học, ra vào cổng / KTX / phòng thí nghiệm và phát hành thẻ. Theo dõi có mặt trong tiết, nhận diện giảng viên, ghi hình bài giảng và an ninh khu hạn chế cần <b>DPIA cập nhật</b> và <b>điều khoản v1.3 tách từng mục đích</b> trước khi bật quy tắc thật. Đồng ý cũ chỉ dùng được trong phạm vi mục đích cũ (Luật 91/2025, Đ.39).
      </Banner>
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Mục đích</th><th>Điều khoản</th><th>Căn cứ</th><th>Đã đồng ý</th><th>Quy tắc dùng</th><th>Ghi chú</th></tr></thead>
          <tbody>
            {PURPOSES.map((p) => {
              const rules = RULES.filter((r) => r.purpose === p.id).map((r) => r.id);
              return (
                <tr key={p.id} className="align-top hover:bg-surface-container-low">
                  <td className="py-3 min-w-[240px]"><div className="font-medium">{p.name}</div><div className="text-caption font-mono text-text-secondary">{p.id}</div></td>
                  <td className="py-3 whitespace-nowrap">{p.status === 'active' ? <Chip color="status-active" icon="verified">{p.terms}</Chip> : <Chip color="status-pending" icon="pending">{p.terms}</Chip>}</td>
                  <td className="py-3 min-w-[180px]">{p.basis}</td>
                  <td className="py-3 tabular-nums whitespace-nowrap">{p.consented == null ? '—' : `${fmtNumber(p.consented)} / ${fmtNumber(p.total)} (${fmtPercent((p.consented / p.total) * 100)})`}</td>
                  <td className="py-3 font-mono text-caption">{rules.join(', ') || '—'}</td>
                  <td className="py-3 text-caption text-text-secondary min-w-[220px]">{p.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <section className="card p-space-md">
        <h2 className="text-headline-md flex items-center gap-2"><Icon name="face_retouching_off" className="text-primary-container" />Người không đồng ý Face ID</h2>
        <p className="text-caption text-text-secondary mb-3">Ví dụ lớp 30 SV có 5 SV không đồng ý: 25 SV điểm danh bằng Face ID, 5 SV bằng QR động, chung một bảng kết quả.</p>
        <ol className="grid grid-cols-2 gap-x-space-lg gap-y-3">
          {OPT_OUT_RULES.map(([t, d], i) => (
            <li key={t} className="flex gap-2.5">
              <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary-container text-caption font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
              <div><div className="text-label-md font-semibold">{t}</div><div className="text-caption text-text-secondary">{d}</div></div>
            </li>
          ))}
        </ol>
        <p className="text-caption text-status-pending mt-3 flex items-start gap-1"><Icon name="gavel" size={14} className="mt-0.5" />Việc camera phát hiện rồi loại bỏ khuôn mặt của người không đồng ý vẫn là một thao tác xử lý tức thời. Cần nêu trong DPIA, biển báo tại lớp và điều khoản v1.3; pháp chế xác nhận.</p>
      </section>
      <p className="text-caption text-text-secondary">Người không đồng ý một mục đích dùng phương thức thay thế không bất lợi (QR, RFID, GV điểm danh tay). Với GV / CBNV, phần quản lý giờ dạy cần đưa vào nội quy lao động và tham khảo ý kiến công đoàn; đồng ý của người lao động khó coi là tự nguyện.</p>
    </div>
  );
}

/** Thời hạn lưu theo từng loại dữ liệu và trạng thái hồ sơ đánh giá tác động (DPIA). */
export function RetentionTab() {
  return (
    <div className="flex flex-col gap-space-md">
      <section className="card p-space-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-headline-md flex items-center gap-2"><Icon name="assignment" className="text-primary-container" />Đánh giá tác động xử lý dữ liệu (DPIA)</h2>
            <p className="text-caption text-text-secondary">{DPIA.form} • lập lần cuối {DPIA.last} • người phụ trách bảo vệ dữ liệu: {DPIA.dpo}</p>
          </div>
          <Chip color="status-pending" icon="warning">{DPIA.status}</Chip>
        </div>
        <p className="text-body-sm mt-2">Phải cập nhật <b>trước khi bật</b> các mục đích mới:</p>
        <ul className="mt-1 flex flex-wrap gap-1.5">{DPIA.pending.map((x) => <li key={x}><Chip color="status-pending">{x}</Chip></li>)}</ul>
        <p className="text-caption text-text-secondary mt-2">Nội dung tối thiểu: mục đích, loại dữ liệu, so sánh với phương án ít xâm phạm hơn (QR / RFID), thời hạn lưu, người được truy cập, rủi ro nhận diện sai, biện pháp giảm thiểu. Nên mời công đoàn và Hội SV tham gia.</p>
      </section>
      <section>
        <h2 className="text-headline-md mb-2">Thời hạn lưu theo loại dữ liệu</h2>
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Loại dữ liệu</th><th>Thời hạn lưu</th><th>Căn cứ</th><th>Ghi chú</th></tr></thead>
            <tbody>
              {RETENTION.map((r) => (
                <tr key={r.kind} className="align-top">
                  <td className="py-3 font-medium min-w-[260px]">{r.kind}</td>
                  <td className="py-3 min-w-[200px]">{r.keep}</td>
                  <td className="py-3 text-caption min-w-[200px]">{r.basis}</td>
                  <td className="py-3 text-caption text-text-secondary">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-caption text-text-secondary mt-1.5">Chỉ xử lý trong khung tiết đã có lịch và tại phòng của tiết đó; không ghép vết di chuyển giữa các phòng. "Mọi log được lưu" nghĩa là lưu và truy vết được, không phải ai cũng xem được: mỗi lượt xem timeline có mặt đều ghi nhật ký kiểm toán.</p>
      </section>
    </div>
  );
}
