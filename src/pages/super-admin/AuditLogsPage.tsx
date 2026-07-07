import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null; role: string | null; organization_id: string | null } | null;
  institution_name?: string | null;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-success/10 text-success border-success/30',
  insert: 'bg-success/10 text-success border-success/30',
  update: 'bg-info/10 text-info border-info/30',
  delete: 'bg-destructive/10 text-destructive border-destructive/30',
  login: 'bg-primary/10 text-primary border-primary/30',
  logout: 'bg-muted text-muted-foreground border-border',
};

const PAGE_SIZE = 25;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [institutions, setInstitutions] = useState<Record<string, string>>({});

  const fetchInstitutions = useCallback(async () => {
    const { data } = await supabase.from('institutions').select('id, name');
    const map: Record<string, string> = {};
    (data || []).forEach(i => { map[i.id] = i.name; });
    setInstitutions(map);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select('*, profiles(full_name, email, role, organization_id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterAction !== 'all') query = query.ilike('action', filterAction);
    if (filterEntity !== 'all') query = query.eq('entity_type', filterEntity);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const { data, count } = await query;
    setLogs(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, filterAction, filterEntity, dateFrom, dateTo]);

  useEffect(() => { fetchInstitutions(); }, [fetchInstitutions]);
  useEffect(() => { setPage(0); }, [filterAction, filterEntity, dateFrom, dateTo, search]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const entityTypes = ['student', 'profile', 'assessment', 'attendance', 'hifz_progress', 'certificate', 'institution', 'class', 'payment'];

  const filtered = search
    ? logs.filter(l =>
        l.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_type?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader title="Audit Logs" description="Platform-wide activity and change history">
        <Button variant="outline" onClick={fetchLogs} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by user, action, entity..." className="pl-9 px-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Entity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityTypes.map(e => <SelectItem key={e} value={e}>{e.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-muted-foreground shrink-0">From</span>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 flex-1 min-w-0" />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-muted-foreground shrink-0">To</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 flex-1 min-w-0" />
              </div>
              {(dateFrom || dateTo || filterAction !== 'all' || filterEntity !== 'all') && (
                <Button variant="outline" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setFilterAction('all'); setFilterEntity('all'); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Institution</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                  <TableHead className="whitespace-nowrap">Entity</TableHead>
                  <TableHead className="whitespace-nowrap">Entity ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No audit logs found</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium truncate max-w-[160px]">{log.profiles?.full_name || 'System'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{log.profiles?.email || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {log.profiles?.organization_id ? institutions[log.profiles.organization_id] || '—' : 'Platform'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={`text-xs capitalize ${ACTION_COLORS[log.action?.toLowerCase()] || 'bg-muted text-muted-foreground border-border'}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm capitalize">
                      {log.entity_type?.replace('_', ' ') || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {log.entity_id ? log.entity_id.slice(0, 8) + '...' : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} logs
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Page {page + 1} / {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
