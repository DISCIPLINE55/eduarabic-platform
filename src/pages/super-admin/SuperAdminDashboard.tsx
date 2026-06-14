import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Activity, DollarSign, TrendingUp, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyRow { month: string; users: number }

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ institutions: 0, users: 0, activeInstitutions: 0 });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<MonthlyRow[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      // Build last-6-month labels
      const months: { label: string; gte: string; lt: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const gte = d.toISOString().split('T')[0];
        const next = new Date(d);
        next.setMonth(next.getMonth() + 1);
        const lt = next.toISOString().split('T')[0];
        months.push({
          label: d.toLocaleDateString('en', { month: 'short' }),
          gte,
          lt,
        });
      }

      const [
        { count: instCount },
        { count: userCount },
        { count: activeCount },
        ...monthCounts
      ] = await Promise.all([
        supabase.from('institutions').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('is_active', true),
        ...months.map(m =>
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', m.gte).lt('created_at', m.lt)
        ),
      ]);

      setStats({
        institutions: instCount || 0,
        users: userCount || 0,
        activeInstitutions: activeCount || 0,
      });

      setChartData(
        months.map((m, i) => ({
          month: m.label,
          users: (monthCounts[i] as any).count || 0,
        }))
      );

      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div>
      <PageHeader title="Super Admin Dashboard" description="Platform overview and management" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Institutions" value={loading ? '...' : stats.institutions}
          icon={<Building2 className="h-5 w-5" />} description="Registered institutions" />
        <StatCard title="Total Users" value={loading ? '...' : stats.users}
          icon={<Users className="h-5 w-5" />} description="Platform-wide accounts" />
        <StatCard title="Active Institutions" value={loading ? '...' : stats.activeInstitutions}
          icon={<Activity className="h-5 w-5" />} description="Currently active" />
        <StatCard title="Revenue (GHS)" value="—"
          icon={<DollarSign className="h-5 w-5" />} description="Multi-currency coming soon" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> New User Registrations (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="users" fill="hsl(var(--primary))" name="New Users" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Database', status: 'Operational' },
              { label: 'Authentication', status: 'Operational' },
              { label: 'Storage', status: 'Operational' },
              { label: 'Edge Functions', status: 'Operational' },
              { label: 'Realtime', status: 'Operational' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="text-sm font-medium text-success">{item.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
