import { getEnquiryTopicBadgeConfig } from '../admin.utils';

export default function AdminContactStats({
  totalMessages = 0,
  topicCounts = {},
  selectedTopic = 'all',
  onSelectTopic,
}) {
  const categories = [
    { id: 'all', label: 'All Inquiries', count: totalMessages, color: 'var(--cyan)' },
    { id: 'support', label: 'Support', count: topicCounts.support || 0, color: 'var(--orange)' },
    { id: 'enterprise', label: 'Enterprise', count: topicCounts.enterprise || 0, color: '#a855f7' },
    { id: 'feature', label: 'Feature', count: topicCounts.feature || 0, color: 'var(--cyan)' },
    { id: 'billing', label: 'Billing', count: topicCounts.billing || 0, color: 'var(--green)' },
    { id: 'general', label: 'General', count: topicCounts.general || 0, color: 'var(--muted-2)' },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((cat) => {
        const isSelected = selectedTopic === cat.id;
        const badge = cat.id !== 'all' ? getEnquiryTopicBadgeConfig(cat.id) : null;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectTopic && onSelectTopic(cat.id)}
            className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
              isSelected
                ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] shadow-[var(--shadow-card)] ring-1 ring-[var(--cyan)]'
                : 'border-[var(--border-mid)] bg-[var(--surface)] hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[var(--muted-2)] uppercase tracking-wider font-['JetBrains_Mono',monospace]">
                {cat.label}
              </span>
              {badge && (
                <span className={`h-2 w-2 rounded-full ${badge.dotColor}`} />
              )}
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[var(--text)] font-['Outfit',sans-serif]">
              {cat.count.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-[var(--muted)]">
              {isSelected ? 'Active Filter' : 'Click to filter'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
