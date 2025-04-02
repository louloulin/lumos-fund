'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardTabsProps {
  defaultTab?: string;
  children: React.ReactNode;
  className?: string;
}

interface DashboardTabProps {
  value: string;
  children: React.ReactNode;
}

interface DashboardTabTriggerProps {
  value: string;
  children: React.ReactNode;
}

interface DashboardTabContentProps {
  value: string;
  children: React.ReactNode;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ children }) => {
  return <>{children}</>;
};

export const DashboardTabTrigger: React.FC<DashboardTabTriggerProps & { 
  active?: boolean;
  onClick?: () => void;
}> = ({ children, active, onClick }) => {
  return (
    <button 
      className={cn("tab-button", active && "active")}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const DashboardTabContent: React.FC<DashboardTabContentProps & { 
  active?: boolean;
}> = ({ children, active }) => {
  if (!active) return null;
  
  return (
    <div className="mt-6">
      {children}
    </div>
  );
};

export function DashboardTabs({ 
  defaultTab, 
  children, 
  className 
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || '');

  // 从子元素中提取TabTrigger和TabContent
  const triggers: React.ReactElement[] = [];
  const contents: React.ReactElement[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    
    if (child.type === DashboardTab) {
      // 处理Tab组件
      const tabProps = child.props as DashboardTabProps;
      const { children: tabChildren, value } = tabProps;
      
      // 设置默认活动标签
      if (activeTab === '' && value) {
        setActiveTab(value);
      }
      
      // 从Tab子元素中分别提取TabTrigger和TabContent
      React.Children.forEach(tabChildren, (tabChild) => {
        if (!React.isValidElement(tabChild)) return;
        
        if (tabChild.type === DashboardTabTrigger) {
          triggers.push(
            React.cloneElement(tabChild, { 
              ...tabChild.props,
              active: activeTab === value,
              onClick: () => setActiveTab(value),
            })
          );
        }
        
        if (tabChild.type === DashboardTabContent) {
          contents.push(
            React.cloneElement(tabChild, { 
              ...tabChild.props,
              active: activeTab === value,
            })
          );
        }
      });
    }
  });

  return (
    <div className={cn("space-y-6", className)}>
      <div className="tabs-container">
        {triggers}
      </div>
      <div>
        {contents}
      </div>
    </div>
  );
} 