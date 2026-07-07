import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { Building2, Search, MapPin, Users, PlusCircle, GraduationCap, ArrowRight } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  type: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  contact_email: string | null;
  logo_url: string | null;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  madrasa: 'bg-primary/10 text-primary border-primary/20',
  school: 'bg-success/10 text-success border-success/20',
  university: 'bg-info/10 text-info border-info/20',
  institute: 'bg-warning/10 text-warning border-warning/20',
};

export default function GuestExplorePage() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filtered, setFiltered] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    supabase
      .from('institutions')
      .select('id, name, type, country, city, description, contact_email, logo_url, created_at')
      .order('name')
      .then(({ data }) => {
        setInstitutions(data || []);
        setFiltered(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = institutions;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.country || '').toLowerCase().includes(q) ||
        (i.city || '').toLowerCase().includes(q) ||
        (i.type || '').toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') {
      result = result.filter(i => i.type === typeFilter);
    }
    setFiltered(result);
  }, [search, typeFilter, institutions]);

  const types = ['all', ...Array.from(new Set(institutions.map(i => i.type).filter(Boolean) as string[]))];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Explore Institutions"
        description="Browse Islamic schools, Madrasas and learning centres on DisciNet."
      />

      {/* Search + filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 px-9"
            placeholder="Search by name, city or country…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          {types.map(t => (
            <Button
              key={t}
              size="sm"
              variant={typeFilter === t ? 'default' : 'outline'}
              className="capitalize text-xs h-9"
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'All Types' : t}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Showing <strong className="text-foreground">{filtered.length}</strong> of {institutions.length} institutions</span>
        </div>
      )}

      {/* Institution grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No institutions found</p>
            <p className="text-sm text-muted-foreground">Try a different search term or filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(inst => (
            <Card key={inst.id} className="group hover:shadow-md transition-shadow h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {inst.logo_url ? (
                      <img src={inst.logo_url} alt={inst.name} className="w-8 h-8 rounded object-contain" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{inst.name}</CardTitle>
                    {inst.type && (
                      <Badge variant="outline" className={`text-[10px] mt-1 capitalize ${TYPE_COLORS[inst.type] || ''}`}>
                        {inst.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                {(inst.city || inst.country) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{[inst.city, inst.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {inst.description && (
                  <CardDescription className="text-xs text-pretty line-clamp-2 flex-1">
                    {inst.description}
                  </CardDescription>
                )}
                <div className="mt-auto pt-2">
                  <Button
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => navigate(`/guest/enroll?institution_id=${inst.id}&institution_name=${encodeURIComponent(inst.name)}`)}
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Request to Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <Card className="border-dashed border-border bg-muted/40">
        <CardContent className="py-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="font-medium text-sm">Can't find your institution?</p>
            <p className="text-xs text-muted-foreground">Contact your admin to get the platform set up, or ask them to send you an invite link.</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => navigate('/login')}>
            Sign In <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
