import { useState } from 'react';
import { Banner, Chip, ChipToggleGroup, DataBoundary, Drawer, Icon, Select, Tabs } from '../components/ui';
import { useApp } from '../store';
import { RULES } from '../data/mock';
import { ALERT_KIND, ALERT_POLICIES, SEVERITY } from '../data/attendance';

const CHANNELS = ['Console An ninh', 'App bảo vệ (push)', 'Còi tại chỗ', 'Console', 'App MyDaiNam', 'Email tổng hợp', 'Email tổng hợp tuần', 'Email', 'Báo cáo tuần'];
const RECIPIENTS = ['Trực an ninh phụ trách zone', 'Đơn vị quản lý zone', 'Trưởng ca an ninh', 'Cố vấn học tập của lớp hành chính', 'Phòng Công tác sinh viên', 'Giảng viên (giải trình trước)', 'Trưởng khoa sau 48 giờ', 'Bộ phận Thiết bị', 'Quản trị hệ thống'];
const SECURITY_ONLY = ['Còi tại chỗ', 'App bảo vệ (push)', 'Console An ninh', 'Trực an ninh phụ trách zone', 'Trưởng ca an ninh'];

/** Chính sách cảnh báo: mức độ × người nhận × kênh × chống trùng × leo thang. Quy tắc chỉ tham chiếu tới đây. */
export default function AlertPolicies() {
  const { can, log, toast } = useApp();
  const [items, setItems] = useState(ALERT_POLICIES);
  const [kind, setKind] = useState('all');
  const [edit, setEdit] = useState(null);
  const rows = items.filter((a) => kind === 'all' || a.kind === kind);
  const usedBy = (id) => RULES.filter((r) => r.alert === id).map((r) => r.id);

  return (
    <div>
      <p className="text-body-sm text-text-secondary mb-space-sm">Ai nhận, qua kênh nào, gộp ra sao và leo thang khi chưa ai tiếp nhận. Trang An ninh & ngoại lệ chỉ nhận cảnh báo, không cấu hình ở đó.</p>
      <Banner className="mb-space-md" icon="rule" title="Hai luồng tách hẳn.">
        Sự kiện <b>an ninh</b> gửi bảo vệ của zone trong 2 giây. Sự kiện <b>học vụ</b> (đi muộn, vắng giữa giờ, ngoại lệ giảng dạy) không bao giờ gửi bảo vệ, không phát còi và không đẩy thông báo cho GV giữa giờ giảng: chỉ tổng hợp sau khi chốt tiết.
      </Banner>

      <DataBoundary name="alert-policies" label="chính sách cảnh báo" scopeNote="global">
      <div className="card overflow-hidden">
        <Tabs label="Loại cảnh báo" className="px-2 border-b border-border-subtle" value={kind} onChange={setKind} items={[
          { key: 'all', label: 'Tất cả', count: items.length },
          ...Object.entries(ALERT_KIND).map(([k, [, l]]) => ({ key: k, label: l, count: items.filter((a) => a.kind === k).length })),
        ]} />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Chính sách</th><th>Mức độ</th><th>Người nhận</th><th>Kênh</th><th>Chống trùng / gộp</th><th>Leo thang</th><th>Thời hạn</th><th>Quy tắc dùng</th><th /></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-surface-container-low align-top">
                  <td className="min-w-[220px] py-3"><div className="flex items-center gap-1.5 font-medium"><Icon name={ALERT_KIND[a.kind][0]} size={16} className="text-text-secondary" />{a.name}</div><div className="text-caption font-mono text-text-secondary">{a.id}</div></td>
                  <td className="py-3"><Chip color={SEVERITY[a.severity][0]} icon={SEVERITY[a.severity][2]}>{SEVERITY[a.severity][1]}</Chip></td>
                  <td className="min-w-[180px] py-3"><ul>{a.recipients.map((x) => <li key={x}>{x}</li>)}</ul></td>
                  <td className="min-w-[160px] py-3"><div className="flex flex-wrap gap-1">{a.channels.map((x) => <Chip key={x}>{x}</Chip>)}</div></td>
                  <td className="min-w-[150px] py-3">{a.cooldown}<div className="text-caption text-text-secondary">{a.quiet}</div></td>
                  <td className="min-w-[180px] py-3">{a.escalation.length ? <ol className="text-caption flex flex-col gap-0.5">{a.escalation.map((e) => <li key={e} className="flex gap-1"><Icon name="trending_up" size={14} className="text-status-pending mt-0.5" />{e}</li>)}</ol> : <span className="text-text-secondary">Không</span>}</td>
                  <td className="whitespace-nowrap py-3">{a.sla}</td>
                  <td className="py-3 font-mono text-caption">{usedBy(a.id).join(', ') || '—'}</td>
                  <td className="py-3"><button className="btn-outline btn-sm" onClick={() => setEdit({ ...a })}>{can('policy_write') ? 'Sửa' : 'Xem'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </DataBoundary>

      <Drawer open={!!edit} onClose={() => setEdit(null)} width={520}>
        {edit && (() => {
          const academic = edit.kind !== 'security';
          const bad = academic ? [...edit.recipients, ...edit.channels].filter((x) => SECURITY_ONLY.includes(x)) : [];
          const ro = !can('policy_write');
          return (
            <>
              <div className="p-space-md border-b border-border-subtle flex items-start justify-between gap-3">
                <div><h3 className="text-k-title-md">{edit.name}</h3><p className="text-caption text-text-secondary"><span className="font-mono">{edit.id}</span> • {ALERT_KIND[edit.kind][1]}</p></div>
                <button aria-label="Đóng" className="w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:bg-surface-container" onClick={() => setEdit(null)}><Icon name="close" size={20} /></button>
              </div>
              <div className="p-space-md flex flex-col gap-space-md overflow-y-auto flex-1">
                {ro && <Banner icon="lock">Chỉ Quản trị hệ thống được sửa.</Banner>}
                <label className="flex flex-col gap-1 text-label-md font-semibold">Mức độ
                  <Select label="Mức độ" disabled={ro} value={edit.severity} options={Object.entries(SEVERITY).map(([value, m]) => ({ value, label: m[1] }))} onChange={(v) => setEdit({ ...edit, severity: v })} />
                </label>
                <div className="flex flex-col gap-1.5"><span className="text-label-md font-semibold">Người nhận (theo vai trò và phạm vi)</span>
                  <ChipToggleGroup label="Người nhận" value={edit.recipients} onChange={(v) => !ro && setEdit({ ...edit, recipients: v })} options={RECIPIENTS.map((x) => ({ value: x, label: x }))} />
                </div>
                <div className="flex flex-col gap-1.5"><span className="text-label-md font-semibold">Kênh gửi</span>
                  <ChipToggleGroup label="Kênh gửi" value={edit.channels} onChange={(v) => !ro && setEdit({ ...edit, channels: v })} options={CHANNELS.map((x) => ({ value: x, label: x }))} />
                </div>
                {bad.length > 0 && <Banner tone="danger" title="Không lưu được.">Cảnh báo học vụ / vận hành không được gửi tới {bad.join(', ')}.</Banner>}
                <dl className="text-body-sm grid grid-cols-[150px_1fr] gap-y-2">
                  <dt className="text-text-secondary">Chống trùng / gộp</dt><dd>{edit.cooldown}</dd>
                  <dt className="text-text-secondary">Giờ yên lặng</dt><dd>{edit.quiet}</dd>
                  <dt className="text-text-secondary">Leo thang</dt><dd>{edit.escalation.join('; ') || 'Không'}</dd>
                  <dt className="text-text-secondary">Thời hạn phát</dt><dd>{edit.sla}</dd>
                  <dt className="text-text-secondary">Sự kiện cũ</dt><dd>{edit.kind === 'security' ? 'Sự kiện cũ hơn 5 phút (thiết bị mất mạng rồi gửi bù) chỉ ghi nhận, không phát còi.' : 'Chỉ gửi sau khi kết quả tiết được chốt.'}</dd>
                </dl>
              </div>
              <div className="p-space-md border-t border-border-subtle bg-surface-bright flex justify-end gap-2">
                <button className="btn-outline" onClick={() => setEdit(null)}>Đóng</button>
                {!ro && <button className="btn-primary" disabled={bad.length > 0 || !edit.recipients.length || !edit.channels.length} onClick={() => { setItems((xs) => xs.map((x) => (x.id === edit.id ? edit : x))); log(`Sửa chính sách cảnh báo ${edit.id}`, edit.id); toast('Đã lưu chính sách cảnh báo', edit.name, 'success'); setEdit(null); }}><Icon name="check" />Lưu</button>}
              </div>
            </>
          );
        })()}
      </Drawer>
    </div>
  );
}
