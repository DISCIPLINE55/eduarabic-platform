import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { streamLLM } from '@/lib/llm';
import {
  BookOpen, Users, BarChart3, Award, ClipboardList, BookMarked,
  Mic, Search, PlusCircle, ArrowRight, Sparkles, GraduationCap,
  BookText, Shield, Wifi, Bell, Send, Bot, User, MessageSquare
} from 'lucide-react';


const FEATURES = [
  { icon: BookOpen, title: 'Learning Center', description: 'Structured Islamic curriculum with lessons, PDFs, audio and video resources.', badge: 'Curriculum' },
  { icon: BookMarked, title: 'Hifz Tracker', description: 'Track Quran memorisation progress verse by verse with teacher feedback.', badge: 'Quran' },
  { icon: ClipboardList, title: 'Attendance', description: 'Real-time attendance tracking for students and classes with parent visibility.', badge: 'Tracking' },
  { icon: BarChart3, title: 'Analytics & Reports', description: 'Detailed performance analytics for admins, teachers, parents and students.', badge: 'Insights' },
  { icon: Award, title: 'Certificates', description: 'Auto-generate QR-verified completion certificates for your students.', badge: 'Achievements' },
  { icon: Mic, title: 'Audio Reviews', description: 'Teachers record and send personalised audio feedback on student recitations.', badge: 'Feedback' },
  { icon: BookText, title: 'Quran Viewer', description: 'Integrated Quran reader with Tafsir, verse navigation and bookmarks.', badge: 'Quran' },
  { icon: Bell, title: 'Announcements', description: 'Broadcast important news to students, parents and staff instantly.', badge: 'Communication' },
  { icon: Wifi, title: 'Offline Sync', description: 'Works offline — data syncs automatically when connection is restored.', badge: 'Reliability' },
];

const STATS = [
  { icon: Users, label: 'Active Users', value: '2,400+' },
  { icon: GraduationCap, label: 'Students Enrolled', value: '18,000+' },
  { icon: BookMarked, label: 'Hifz Sessions', value: '95,000+' },
  { icon: Shield, label: 'Institutions', value: '120+' },
];

const STEPS = [
  { step: '01', title: 'Explore as Guest', description: 'Browse institutions, preview features and understand how the platform works.' },
  { step: '02', title: 'Find Your Institution', description: 'Search for your Madrasa, Islamic school or learning centre on the platform.' },
  { step: '03', title: 'Submit Enrollment', description: 'Send an enrollment request with your preferred role (student, parent, teacher).' },
  { step: '04', title: 'Get Approved', description: 'Your institution admin reviews and approves your request — then you get full access.' },
];

export default function GuestDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden bg-primary px-6 py-10 md:px-12 md:py-14">
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge variant="secondary" className="text-xs font-medium gap-1.5">
            <Sparkles className="h-3 w-3" /> Guest Explorer
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground text-balance leading-tight">
            Welcome to DisciNet — Explore Islamic Education
          </h1>
          <p className="text-primary-foreground/80 text-sm md:text-base text-pretty">
            You're browsing as a guest. Discover institutions, explore features,
            and enroll when you're ready — no commitment needed.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => navigate('/guest/explore')}
            >
              <Search className="h-4 w-4" /> Browse Institutions
            </Button>
            <Button
              variant="ghost"
              className="border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
              onClick={() => navigate('/guest/enroll')}
            >
              <PlusCircle className="h-4 w-4" /> Request Enrollment
            </Button>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-primary-foreground/5 pointer-events-none" />
        <div className="absolute -right-4 bottom-0 w-32 h-32 rounded-full bg-primary-foreground/5 pointer-events-none" />
      </div>

      {/* Platform stats */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Platform at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="text-center">
              <CardContent className="pt-5 pb-4 space-y-1.5">
                <div className="flex justify-center">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature showcase */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Everything You Need</h2>
          <Badge variant="outline" className="text-xs">Full Feature Preview</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, badge }) => (
            <Card key={title} className="group hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{badge}</Badge>
                </div>
                <CardTitle className="text-sm font-semibold mt-2">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground text-pretty leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-5">How to Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(({ step, title, description }) => (
            <div key={step} className="relative">
              <Card className="h-full">
                <CardContent className="pt-5 space-y-2">
                  <span className="text-3xl font-bold text-primary/20">{step}</span>
                  <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                  <CardDescription className="text-xs text-pretty">{description}</CardDescription>
                </CardContent>
              </Card>
              {step !== '04' && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Ready to join your institution?</p>
              <p className="text-sm text-muted-foreground text-pretty">
                Find your Madrasa or Islamic school and send an enrollment request in under a minute.
              </p>
            </div>
            <Button className="shrink-0 gap-2" onClick={() => navigate('/guest/enroll')}>
              <PlusCircle className="h-4 w-4" /> Enroll Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {profile && (
        <p className="text-center text-xs text-muted-foreground">
          Logged in as <span className="font-medium">{profile.email}</span> — Guest Explorer
        </p>
      )}
    </div>
  );
}
