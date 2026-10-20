import { useRef } from 'react';

import { Icon } from './Icon.jsx';

/**
 * Accessible tabs following the WAI-ARIA Authoring Practices pattern:
 * only the active tab is in the Tab order, and the arrow keys, Home, and
 * End move between tabs.
 */
export function Tabs({ tabs, active, onChange, label }) {
  const buttons = useRef({});

  function handleKeyDown(event, index) {
    const moves = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in moves)) return;

    event.preventDefault();
    const next = tabs[moves[event.key]];
    onChange(next.id);
    buttons.current[next.id]?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(element) => {
            buttons.current[tab.id] = element;
          }}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          className="tabs__tab"
          aria-selected={active === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {tab.icon ? <Icon name={tab.icon} size={18} /> : null}
          {tab.label}
          {tab.count ? <span className="tabs__count">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, active, children }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={!active} className="tab-panel">
      {active ? children : null}
    </div>
  );
}
