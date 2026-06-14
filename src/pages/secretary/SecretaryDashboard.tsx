import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ClipboardList, DollarSign, AlertCircle } from 'lucide-react';

export default function SecretaryDashboard() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [stats, setStats] = useState({ students: 0, todayAttendance: 0, pendingFees: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('date', today),
    ]).then(([{ count: students }, { count: attendance }]) => {
      setStats({ students: students || 0, todayAttendance: attendance || 0, pendingFees: 0 });
      setLoading(false);
    });
  }, [orgId]);

  return (
    <div>
      <PageHeader title="Secretary Dashboard" description={`Welcome, ${profile?.full_name || 'Secretary'}`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Students" value={loading ? '...' : stats.students} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard title="Today's Attendance" value={loading ? '...' : stats.todayAttendance} icon={<ClipboardList className="h-5 w-5" />} description="Records submitted today" />
        <StatCard title="Pending Fees" value="GHS 0" icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-primary" />Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Register New Student', desc: 'Add a new student to the system', path: '/secretary/register' },
              { label: 'Record Attendance', desc: "Mark today's attendance", path: '/secretary/attendance' },
              { label: 'Record Payment', desc: 'Log a fee payment', path: '/secretary/fees' },
            ].map(action => (
              <Link key={action.path} to={action.path}
                className="block p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                <p className="font-medium text-sm text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
