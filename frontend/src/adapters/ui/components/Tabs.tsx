interface TabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
  tabs: string[];
}

export function Tabs({ activeTab, onChange, tabs }: TabsProps) {
  return (
    <div className="inline-flex rounded-full bg-slate-900/90 p-1 text-sm shadow-lg shadow-slate-900/10">
      {tabs.map((tab) => {
        const selected = tab === activeTab;

        return (
          <button
            key={tab}
            type="button"
            className={`rounded-full px-4 py-2 transition ${
              selected
                ? "bg-emerald-400 text-slate-900"
                : "text-slate-100 hover:bg-slate-800"
            }`}
            onClick={() => onChange(tab)}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

