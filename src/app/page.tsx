"use client";

import { Database, ListFilter, BarChart3, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Database stats cards type
type StatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
};

// Tab component
const Tab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    className={`px-4 py-2 text-sm rounded-md transition-colors ${active ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
    onClick={onClick}
  >
    {label}
  </button>
);

// Database stats card component
const StatCard = ({ title, value, description, icon: Icon }: StatCardProps) => (
  <div className="db-card">
    <div className="db-card-title">
      <span>{title}</span>
      <Icon className="h-5 w-5" />
    </div>
    <div className="db-card-value">{value}</div>
    <div className="db-card-description">{description}</div>
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Database Overview</h1>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
          Monitor your database statistics and performance metrics.
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '1rem' }} 
           className="md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="SQLite Tables" 
          value={12} 
          description="Transaction-based storage" 
          icon={ListFilter} 
        />
        <StatCard 
          title="DuckDB Tables" 
          value={8} 
          description="Analytics-optimized storage" 
          icon={ListFilter} 
        />
        <StatCard 
          title="Vector Collections" 
          value={5} 
          description="AI-powered vector storage" 
          icon={Database} 
        />
        <StatCard 
          title="Active Queries" 
          value={3} 
          description="Currently running queries" 
          icon={Search} 
        />
      </div>
      
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', borderRadius: '0.5rem', backgroundColor: 'hsla(var(--secondary), 0.3)', width: 'fit-content' }}>
        <Tab 
          label="Overview" 
          active={activeTab === "overview"} 
          onClick={() => setActiveTab("overview")} 
        />
        <Tab 
          label="Analytics" 
          active={activeTab === "analytics"} 
          onClick={() => setActiveTab("analytics")} 
        />
        <Tab 
          label="Recent Queries" 
          active={activeTab === "queries"} 
          onClick={() => setActiveTab("queries")} 
        />
      </div>
      
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 500 }}>Database Health</h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
            System metrics and performance insights
          </p>
        </div>
        
        <div style={{ 
          padding: '4rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'hsl(var(--card))', 
          borderRadius: '0.5rem', 
          border: '1px solid #e2e8f0', 
          marginTop: '1rem' 
        }}>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Performance metrics visualization will appear here</p>
        </div>
      </div>
    </div>
  );
}
