import { ChevronDown } from 'lucide-react';
import type { AdminTab, AdminTabMeta } from './adminManagementTabs';

export function AdminSidebar({
  tabs,
  active,
  onChange,
}: {
  tabs: AdminTabMeta[];
  active: AdminTab;
  onChange: (id: AdminTab) => void;
}) {
  const activeTab = tabs.find((tab) => tab.id === active);
  const groupedTabs = tabs.reduce<Array<{ id: string; label: string; items: AdminTabMeta[] }>>((groups, tab) => {
    const label = tab.group || 'General';
    const groupId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const group = groups.find((item) => item.label === label);
    if (group) {
      group.items.push(tab);
    } else {
      groups.push({ id: groupId, label, items: [tab] });
    }
    return groups;
  }, []);

  return (
    <nav aria-label="Administration sections" className="w-full shrink-0 lg:sticky lg:top-24 lg:w-72">
      <div className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-1 lg:overflow-y-auto">
        {groupedTabs.map((group) => (
          <section key={group.id} aria-labelledby={`admin-group-${group.id}`}>
            <h2 id={`admin-group-${group.id}`} className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 first:mt-0">
              {group.label}
            </h2>
            <div className="space-y-1">
              {group.items.map((tab) => {
                const isActive = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`${tab.label}: ${tab.description}`}
                    className={`motion-interactive group relative flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                      isActive ? 'border-orange-200 bg-orange-50 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isActive && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[#FF6B00]" aria-hidden="true" />}
                    <div className={`rounded-lg p-2 transition-colors ${isActive ? 'bg-[#FF6B00] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'}`}>
                      <tab.icon className={`h-4 w-4 ${tab.iconClassName || ''}`} />
                    </div>
                    <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${isActive ? 'text-[#C2410C]' : 'text-slate-700 group-hover:text-slate-900'}`}>{tab.label}</span>
                    {tab.count !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-[#FF6B00] text-white' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="lg:hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label htmlFor="admin-section-select" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Administration section
        </label>
        <div className="relative">
          <select
            id="admin-section-select"
            value={active}
            onChange={(event) => onChange(event.target.value as AdminTab)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10"
          >
            {groupedTabs.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.items.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        </div>
        {activeTab?.description && (
          <p className="mt-2 px-1 text-xs leading-5 text-slate-500">
            {activeTab.description}
          </p>
        )}
      </div>
    </nav>
  );
}