import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from 'sonner';
import { Save, Loader2, CalendarDays } from 'lucide-react';
import type { AttendanceStatus } from '@/types/types';

export default function AttendancePage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('classes').select('id, name').eq('organization_id', orgId).is('deleted_at', null).order('name')
      .then(({ data }) => setClasses(data || []));
  }, [orgId]);

  useEffect(() => {
    if (!selectedClass || !orgId) return;
    setLoading(true);
    Promise.all([
      supabase.from('class_enrollments').select('student_id, students(id, full_name, student_id_code)')
        .eq('class_id', selectedClass).eq('status', 'active'),
      supabase.from('attendance').select('*')
        .eq('class_id', selectedClass).eq('date', selectedDate).eq('organization_id', orgId),
    ]).then(([{ data: enrollments }, { data: existing }]) => {
      const studentList = (enrollments || []).map((e: any) => e.students).filter(Boolean);
      setStudents(studentList);
      const attMap: Record<string, AttendanceStatus> = {};
      (existing || []).forEach((a: any) => { if (a.student_id) attMap[a.student_id] = a.status; });
      // Default all to present
      studentList.forEach((s: any) => { if (!attMap[s.id]) attMap[s.id] = 'present'; });
      setAttendance(attMap);
      setLoading(false);
    });
  }, [selectedClass, selectedDate, orgId]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedClass || !orgId) { toast.error('Please select a class'); return; }
    setSaving(true);
    // Delete existing records for this class/date
    await supabase.from('attendance').delete().eq('class_id', selectedClass).eq('date', selectedDate).eq('organization_id', orgId);
    const records = students.map(s => ({
      organization_id: orgId,
      class_id: selectedClass,
      student_id: s.id,
      date: selectedDate,
      status: attendance[s.id] || 'present',
      is_teacher: false,
      recorded_by: profile?.id,
      created_by: profile?.id,
    }));
    if (records.length > 0) {
      const { error } = await supabase.from('attendance').insert(records);
      if (error) { toast.error('Failed to save attendance'); setSaving(false); return; }
    }
    toast.success(`Attendance saved for ${records.length} students`);
    setSaving(false);
  };

  const statusCounts = students.reduce((acc, s) => {
    const st = attendance[s.id] || 'present';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <PageHeader title="Attendance" description="Record and manage daily attendance">
        <Button onClick={handleSave} disabled={saving || students.length === 0}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Attendance
        </Button>
      </PageHeader>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-sm font-normal text-foreground block mb-1.5">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-sm font-normal text-foreground block mb-1.5">Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </div>
          </div>
          {students.length > 0 && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-border">
              {(['present', 'absent', 'excused', 'late'] as const).map(s => (
                <div key={s} className="text-center">
                  <p className="text-lg font-bold text-foreground">{statusCounts[s] || 0}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No students enrolled in this class</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Student</TableHead>
                      <TableHead className="whitespace-nowrap">ID</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                              {s.full_name[0]}
                            </div>
                            <span className="text-sm font-medium">{s.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-sm text-muted-foreground">{s.student_id_code}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Select value={attendance[s.id] || 'present'} onValueChange={v => setStatus(s.id, v as AttendanceStatus)}>
                            <SelectTrigger className="w-32 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
