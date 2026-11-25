import React from 'react';
import { Icon } from './Icons';
import { Badge } from './Badge';

export function VipTabBar({ tabs = [], activeTab, onChange, ariaLabel = 'Navegación de sección' }) {
  if (!tabs.length) return null;

  return (
    <div className="vip-tabbar" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-current={tab.ariaCurrent && isActive ? 'page' : undefined}
            className={`vip-tab ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && (
              <Icon
                name={tab.icon}
                size={15}
                color={isActive ? '#0B0D12' : 'var(--color-gold)'}
              />
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`vip-tab-count ${isActive ? 'is-active' : ''}`}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <Badge variant={tab.badgeVariant || 'gold'} style={{ fontSize: '10px', marginLeft: '2px' }}>
                {tab.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default VipTabBar;
