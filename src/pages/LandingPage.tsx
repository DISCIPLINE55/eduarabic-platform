/**
 * LandingPage — Public marketing page for DisciNet.
 * Sections: Header (3 variants) → Hero → Features → How It Works →
 *           Platform Showcase → Testimonials → Pricing → CTA → Footer
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DisciNetLogo } from '@/components/common/DisciNetLogo';
import {
  BookOpen, Brain, Users, BarChart3, School, Heart, CheckCircle2,
  Star, Menu, X, ArrowRight, Play, Globe, ShieldCheck, Smartphone,
  GraduationCap, MessageSquare, Award, Zap, ChevronRight,
} from 'lucide-react';

// ── Brand image URLs ───────────────────────────────────────────────────────
const ICON_URL  = 'https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260707/official_logo.png';
const IMG_KID   = 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a8dfe0e7-c9cc-4623-bb61-9bc76f7e88cd.jpg';
const IMG_MOSQUE = 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_7241cc6f-5257-4ae0-acbe-c33e3d3366ee.jpg';
const IMG_STUDENTS = 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_98d01a8b-9df7-4f88-b308-2fb79d5cec9a.jpg';
const IMG_TEACHER = 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_ec65325e-cea7-4aa4-b6b6-d768d67463cd.jpg';

const NAV_LINKS = ['Home', 'Courses', 'Quran', 'AI Tutor', 'Pricing', 'About'];

// ── Header component (white / gradient / dark variants) ───────────────────
type HeaderVariant = 'white' | 'gradient' | 'dark';
interface LandingHeaderProps {
  variant?: HeaderVariant;
  onLogin: () => void;
  onGetStarted: () => void;
}

function LandingHeader({ variant = 'white', onLogin, onGetStarted }: LandingHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isWhite    = variant === 'white';
  const isDark     = variant === 'dark';
  const isGradient = variant === 'gradient';

  const containerStyle: React.CSSProperties = isWhite
    ? { background: scrolled ? 'rgba(255,255,255,0.98)' : '#ffffff', boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,0.08)' : 'none' }
    : isDark
    ? { background: '#001B2A' }
    : { background: 'linear-gradient(135deg, #0EA5A0 0%, #4a9e6e 45%, #D4AF37 100%)' };

  const navColor = isWhite ? '#111827' : '#ffffff';
  const navHover = isWhite ? '#0EA5A0' : 'rgba(255,255,255,0.75)';

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300" style={containerStyle}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="shrink-0">
          <DisciNetLogo size={38} variant="full" theme={isWhite ? 'light' : 'dark'} />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(' ', '-')}`}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: navColor }}
              onMouseEnter={e => (e.currentTarget.style.color = navHover)}
              onMouseLeave={e => (e.currentTarget.style.color = navColor)}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* Login — outlined */}
          <button
            onClick={onLogin}
            className="px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200"
            style={isWhite
              ? { borderColor: '#0EA5A0', color: '#0EA5A0', background: 'transparent' }
              : { borderColor: 'rgba(255,255,255,0.75)', color: '#ffffff', background: 'transparent' }
            }
          >
            Login
          </button>
          {/* Get Started — filled */}
          <button
            onClick={onGetStarted}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={isWhite
              ? { background: '#0EA5A0', color: '#ffffff' }
              : isGradient
              ? { background: '#D4AF37', color: '#111827' }
              : { background: '#ffffff', color: '#001B2A' }
            }
          >
            Get Started
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-md"
          style={{ color: navColor }}
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 border-t" style={{ borderColor: isWhite ? '#E5E7EB' : 'rgba(255,255,255,0.15)', background: isWhite ? '#ffffff' : containerStyle.background }}>
          {NAV_LINKS.map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(' ', '-')}`}
              className="block py-2.5 text-sm font-medium border-b last:border-0"
              style={{ color: navColor, borderColor: isWhite ? '#F3F4F6' : 'rgba(255,255,255,0.1)' }}
              onClick={() => setMobileOpen(false)}
            >
              {link}
            </a>
          ))}
          <div className="flex gap-3 pt-4">
            <button onClick={onLogin} className="flex-1 py-2 rounded-lg text-sm font-semibold border-2" style={isWhite ? { borderColor: '#0EA5A0', color: '#0EA5A0' } : { borderColor: '#fff', color: '#fff' }}>
              Login
            </button>
            <button onClick={onGetStarted} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={isWhite ? { background: '#0EA5A0', color: '#fff' } : { background: '#D4AF37', color: '#111827' }}>
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Hero section ─────────────────────────────────────────────────────────
function HeroSection({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  return (
    <section
      id="home"
      className="relative overflow-hidden min-h-[92vh] flex items-center"
      style={{ background: 'linear-gradient(135deg, #001B2A 0%, #062a3f 60%, #0d3d55 100%)' }}
    >
      {/* Constellation background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {CONSTELLATION_LINES.map((l, i) => (
          <line key={i} x1={`${l.x1}%`} y1={`${l.y1}%`} x2={`${l.x2}%`} y2={`${l.y2}%`}
            stroke="rgba(14,165,160,0.15)" strokeWidth="0.8" />
        ))}
        {STAR_NODES.map((s, i) => (
          <circle key={i} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="rgba(255,255,255,0.6)" opacity={s.op} />
        ))}
        {/* Gold accent waves */}
        <path d="M0 85% Q25 75% 50 82% Q75 88% 100 78% L100 100% L0 100% Z" fill="rgba(212,175,55,0.08)" />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="flex flex-col gap-6">
            <Badge className="w-fit text-xs font-semibold px-3 py-1" style={{ background: 'rgba(14,165,160,0.15)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.3)' }}>
              ✦ Islamic EdTech Platform
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
              Intelligent Learning<br />
              <span style={{ color: '#0EA5A0' }}>for Every Mind.</span>
            </h1>

            <div className="flex items-center gap-2">
              <span className="block h-px w-8" style={{ background: '#D4AF37' }} />
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#D4AF37' }}>
                Knowledge. Faith. Innovation.
              </p>
              <span className="block h-px w-8" style={{ background: '#D4AF37' }} />
            </div>

            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
              DisciNet is the complete Islamic education platform — Quran memorisation tracking,
              AI-powered tutoring, course management, and multi-role dashboards for institutions,
              teachers, students and parents.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onGetStarted}
                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg hover:scale-105"
                style={{ background: '#0EA5A0', color: '#ffffff' }}
              >
                Get Started Free <ArrowRight size={16} />
              </button>
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.45)', color: '#ffffff' }}
              >
                <Play size={15} /> Watch Demo
              </button>
            </div>

            {/* Social proof stats */}
            <div className="flex flex-wrap gap-8 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {[['10,000+', 'Students'], ['500+', 'Institutions'], ['50+', 'Countries'], ['4.9★', 'Rating']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-xl font-bold" style={{ color: '#0EA5A0' }}>{val}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image with overlay */}
          <div className="relative hidden md:block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '4/3' }}>
              <img src={IMG_KID} alt="Student learning with DisciNet" className="w-full h-full object-cover" />
              {/* Teal overlay gradient */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(14,165,160,0.25) 0%, rgba(0,27,42,0.4) 100%)' }} />
              {/* Gold wave accent */}
              <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to right, rgba(212,175,55,0.4), transparent)' }} />

              {/* Floating stat card */}
              <div className="absolute top-4 right-4 rounded-xl p-3 shadow-xl backdrop-blur-sm" style={{ background: 'rgba(0,27,42,0.85)', border: '1px solid rgba(14,165,160,0.3)' }}>
                <p className="text-xs font-semibold" style={{ color: '#0EA5A0' }}>AI Tutor Active</p>
                <p className="text-xl font-bold text-white">2,400+</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>sessions today</p>
              </div>

              {/* DisciNet mini badge */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(0,27,42,0.85)', border: '1px solid rgba(14,165,160,0.3)' }}>
                <img src={ICON_URL} alt="DisciNet" width={28} height={28} className="object-contain" />
                <div>
                  <p className="text-xs font-bold text-white">DisciNet</p>
                  <p className="text-xs" style={{ color: '#D4AF37' }}>Learn. Grow. Inspire.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features section ──────────────────────────────────────────────────────
const FEATURES = [
  { icon: BookOpen,   title: 'Quran & Hifz Tracking',    desc: 'Track memorisation progress with Juz/Surah breakdown, audio submissions, and teacher review workflows.',  color: '#0EA5A0' },
  { icon: Brain,      title: 'AI-Powered Tutor',          desc: 'Personalised AI tutor that adapts to each student\'s level, answers questions and suggests content.',       color: '#D4AF37' },
  { icon: GraduationCap, title: 'Course Management',     desc: 'Create structured curricula with lessons, assignments, assessments and grade tracking per class.',          color: '#0EA5A0' },
  { icon: BarChart3,  title: 'Real-time Analytics',       desc: 'Institution-wide dashboards showing attendance, performance, finances and platform health at a glance.',   color: '#D4AF37' },
  { icon: Users,      title: 'Multi-Role Access',         desc: 'Five distinct portals: Super Admin, Institution Admin, Teacher, Student and Parent — each role-scoped.',   color: '#0EA5A0' },
  { icon: Heart,      title: 'Parent Portal',             desc: 'Parents monitor attendance, fees, Hifz progress and communicate directly with teachers in real time.',     color: '#D4AF37' },
  { icon: School,     title: 'Institution Management',    desc: 'Onboard unlimited institutions, manage subscriptions, invites, announcements and financial records.',       color: '#0EA5A0' },
  { icon: Smartphone, title: 'Works Everywhere',          desc: 'Fully responsive web platform — use on desktop, tablet or mobile. Offline sync for low-connectivity zones.',color: '#D4AF37' },
  { icon: ShieldCheck,title: 'Secure & Compliant',        desc: 'Row-level security, role-based access control, audit logs, and GDPR-aligned data handling.',              color: '#0EA5A0' },
];

function FeaturesSection() {
  return (
    <section id="courses" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <Badge className="mb-4 text-xs font-semibold px-3 py-1" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.25)' }}>
            Platform Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything an Islamic school needs
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            DisciNet combines traditional Islamic pedagogy with modern EdTech — one platform for every
            role in your institution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}18`, border: `1.5px solid ${f.color}30` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works section ──────────────────────────────────────────────────
const STEPS = [
  { step: '01', title: 'Institution Onboards',     desc: 'Admin registers the institution, invites staff and configures roles, classes and subscription plan.',        icon: School },
  { step: '02', title: 'Teachers Create Content',  desc: 'Teachers build courses, upload Quran recitation assignments, run live assessments and track Hifz progress.', icon: BookOpen },
  { step: '03', title: 'Students Learn & Grow',    desc: 'Students access lessons, interact with the AI Tutor, submit audio reviews and track their own progress.',    icon: GraduationCap },
  { step: '04', title: 'Parents Stay Connected',   desc: 'Parents monitor attendance, fees, performance reports and communicate with teachers — all in one portal.',   icon: Heart },
];

function HowItWorksSection() {
  return (
    <section className="py-24" style={{ background: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <Badge className="mb-4 text-xs font-semibold px-3 py-1" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.25)' }}>
            How It Works
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple for every role
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From onboarding to daily learning — DisciNet is designed to be intuitive for institutions,
            teachers, students and parents alike.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative flex flex-col items-center text-center gap-4">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute top-8 left-[calc(50%+2rem)] right-0 h-px hidden lg:block" style={{ background: 'linear-gradient(to right, #0EA5A0, rgba(14,165,160,0.1))' }} />
              )}
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{ background: 'linear-gradient(135deg, #0EA5A0, #0C8F8A)' }}>
                <s.icon size={26} className="text-white" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ background: '#D4AF37' }}>{s.step}</span>
              </div>
              <h3 className="font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Platform Showcase (image gallery) ────────────────────────────────────
function ShowcaseSection() {
  const [active, setActive] = useState(0);
  const tabs = [
    { label: 'Quran Learning', img: IMG_KID,      desc: 'Track Hifz progress, submit audio recitations, and get instant feedback from AI and teachers.' },
    { label: 'Classrooms',     img: IMG_TEACHER,  desc: 'Teachers manage lessons, assessments, attendance and grades — all in one streamlined workspace.' },
    { label: 'Student Portal', img: IMG_STUDENTS, desc: 'Students access courses, chat with the AI Tutor, view progress dashboards and earn certificates.' },
    { label: 'Institution',    img: IMG_MOSQUE,   desc: 'Institution admins oversee enrolments, staff, finances and analytics across the entire school.' },
  ];
  return (
    <section id="ai-tutor" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 text-xs font-semibold px-3 py-1" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.25)' }}>
            Platform in Action
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            A portal for every role
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {tabs.map((t, i) => (
            <button key={t.label} onClick={() => setActive(i)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={i === active
                ? { background: '#0EA5A0', color: '#fff' }
                : { background: 'transparent', color: '#6B7280', border: '1.5px solid #E5E7EB' }
              }
            >{t.label}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: '16/10' }}>
            <img src={tabs[active].img} alt={tabs[active].label} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-5">
            <h3 className="text-2xl font-bold text-foreground">{tabs[active].label}</h3>
            <p className="text-muted-foreground text-base leading-relaxed">{tabs[active].desc}</p>
            <ul className="flex flex-col gap-2">
              {SHOWCASE_BULLETS[active].map(b => (
                <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 size={16} style={{ color: '#0EA5A0' }} className="shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
const SHOWCASE_BULLETS = [
  ['Juz & Surah memorisation tracker', 'Audio submission & teacher review', 'AI recitation feedback', 'Progress certificates'],
  ['Lesson builder with rich content', 'Attendance & grade management', 'Assessment & question bank', 'Hifz progress review'],
  ['AI Tutor 24/7 chat interface', 'Course progress dashboard', 'Assignment submission', 'Peer & self-assessment'],
  ['Multi-institution dashboard', 'Subscription & billing management', 'Staff invite & role assignment', 'Platform analytics'],
];

// ── Testimonials ──────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Sheikh Abdullah Al-Rashid', role: 'Principal, Al-Noor Islamic Academy', text: 'DisciNet transformed how we manage our 600-student school. The Hifz tracking alone is worth it — our teachers save hours every week.', rating: 5 },
  { name: 'Ustadha Fatima Hassan',     role: 'Quran Teacher, Dubai',               text: 'The AI Tutor helps my students continue learning between classes. Their retention and enthusiasm have improved remarkably.', rating: 5 },
  { name: 'Amir Siddiqui',            role: 'Parent of 2 students',               text: 'I can see my children\'s progress, pay fees and message their teachers in one app. DisciNet keeps our family connected to their education.', rating: 5 },
];

function TestimonialsSection() {
  return (
    <section className="py-24" style={{ background: 'linear-gradient(135deg, #001B2A 0%, #062a3f 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <Badge className="mb-4 text-xs font-semibold px-3 py-1" style={{ background: 'rgba(14,165,160,0.15)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.3)' }}>
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by educators worldwide</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }} className="max-w-xl mx-auto">
            Institutions across 50+ countries rely on DisciNet to deliver excellence in Islamic education.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="flex flex-col gap-4 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(14,165,160,0.2)' }}>
              <div className="flex gap-1">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} fill="#D4AF37" style={{ color: '#D4AF37' }} />)}</div>
              <p className="text-sm leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.8)' }}>"{t.text}"</p>
              <div className="flex items-center gap-3 mt-auto pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: '#0EA5A0' }}>
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs" style={{ color: '#0EA5A0' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing section ───────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter',    price: 'Free',    period: 'forever',
    desc: 'Perfect for small Quran circles and home-school groups.',
    features: ['Up to 30 students', 'Quran & Hifz tracking', 'Basic progress reports', 'Parent portal', 'Email support'],
    cta: 'Start Free', highlight: false,
  },
  {
    name: 'Professional', price: '$29', period: '/month',
    desc: 'For growing Islamic schools that need the full platform.',
    features: ['Up to 500 students', 'AI Tutor (unlimited)', 'Full course management', 'Advanced analytics', 'Certificates', 'Priority support'],
    cta: 'Start 14-day Trial', highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    desc: 'Multi-branch networks and large institutions.',
    features: ['Unlimited students', 'Multi-institution admin', 'Custom branding', 'API access', 'SSO / SAML', 'Dedicated CSM'],
    cta: 'Contact Sales', highlight: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <Badge className="mb-4 text-xs font-semibold px-3 py-1" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.25)' }}>
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free. Scale as your institution grows. No hidden fees.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map(p => (
            <div key={p.name} className={`relative flex flex-col gap-5 rounded-2xl p-7 border transition-all duration-300 ${p.highlight ? 'shadow-2xl scale-[1.02]' : 'hover:shadow-lg'}`}
              style={p.highlight
                ? { background: '#001B2A', border: '2px solid #0EA5A0' }
                : { background: 'var(--card)', border: '1.5px solid var(--border-color, #E5E7EB)' }
              }>
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: '#0EA5A0' }}>
                  Most Popular
                </div>
              )}
              <div>
                <p className="font-bold text-sm uppercase tracking-wider mb-1" style={{ color: p.highlight ? '#0EA5A0' : '#6B7280' }}>{p.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold" style={{ color: p.highlight ? '#ffffff' : 'var(--foreground)' }}>{p.price}</span>
                  <span className="text-sm" style={{ color: p.highlight ? 'rgba(255,255,255,0.5)' : '#6B7280' }}>{p.period}</span>
                </div>
                <p className="text-sm mt-2" style={{ color: p.highlight ? 'rgba(255,255,255,0.65)' : '#6B7280' }}>{p.desc}</p>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: p.highlight ? 'rgba(255,255,255,0.85)' : 'var(--foreground)' }}>
                    <CheckCircle2 size={15} style={{ color: '#0EA5A0' }} className="shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 mt-auto"
                style={p.highlight
                  ? { background: '#0EA5A0', color: '#ffffff' }
                  : { background: 'transparent', color: '#0EA5A0', border: '2px solid #0EA5A0' }
                }>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Quran Section ────────────────────────────────────────────────────────
function QuranSection() {
  return (
    <section id="quran" className="py-24" style={{ background: 'linear-gradient(135deg, #F8FAFC, #ffffff)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: '4/3' }}>
            <img src={IMG_MOSQUE} alt="Islamic architecture — DisciNet" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-6">
            <Badge className="w-fit text-xs font-semibold px-3 py-1" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.25)' }}>
              Quran & Hifz
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              Rooted in faith,<br />
              <span style={{ color: '#0EA5A0' }}>powered by technology.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Quran module honours the tradition of Islamic scholarship while giving teachers digital tools
              to track every student's memorisation journey — verse by verse, Juz by Juz.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[['Hifz Progress', 'Juz/Surah/Ayah tracking'],['Audio Reviews', 'Teacher & AI feedback'],['Tajweed Hints', 'Built-in pronunciation guide'],['Certificates', 'Automated Hifz certificates']].map(([t,d]) => (
                <div key={t} className="flex gap-3 items-start">
                  <CheckCircle2 size={16} style={{ color: '#0EA5A0' }} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ─────────────────────────────────────────────────────────────
function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #001B2A 0%, #062a3f 70%, #0d3d55 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        {STAR_NODES.slice(0, 10).map((s, i) => (
          <div key={i} className="absolute rounded-full" style={{ width: s.r * 2, height: s.r * 2, top: `${s.cy}%`, left: `${s.cx}%`, background: 'rgba(255,255,255,0.4)', opacity: s.op * 0.6 }} />
        ))}
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center flex flex-col items-center gap-6">
        <img src={ICON_URL} alt="DisciNet" width={72} height={72} className="object-contain drop-shadow-xl" />
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Ready to transform your <span style={{ color: '#0EA5A0' }}>Islamic school?</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)' }} className="text-base max-w-xl">
          Join 500+ institutions already using DisciNet. Start free — no credit card required.
        </p>
        <button onClick={onGetStarted}
          className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-xl hover:scale-105 transition-all duration-200"
          style={{ background: '#0EA5A0', color: '#ffffff' }}>
          Get Started for Free <ChevronRight size={18} />
        </button>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>14-day free trial · No setup fees · Cancel anytime</p>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="about" className="py-12 border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2">
            <DisciNetLogo size={36} variant="full" theme="light" />
            <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Intelligent Learning for Every Mind. The complete Islamic education SaaS platform.
            </p>
            <p className="mt-3 text-xs font-semibold tracking-widest uppercase" style={{ color: '#D4AF37' }}>
              Knowledge. Faith. Innovation.
            </p>
          </div>
          {/* Links */}
          {[
            { heading: 'Platform',  links: ['Courses', 'Quran', 'AI Tutor', 'Analytics', 'Certificates'] },
            { heading: 'Roles',     links: ['Institution Admin', 'Teachers', 'Students', 'Parents', 'Super Admin'] },
            { heading: 'Company',   links: ['About', 'Pricing', 'Blog', 'Careers', 'Contact'] },
          ].map(col => (
            <div key={col.heading}>
              <p className="text-sm font-semibold text-foreground mb-3">{col.heading}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© 2026 DisciNet. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <a key={l} href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main LandingPage export ────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Sticky header — white variant (default) */}
      <LandingHeader
        variant="white"
        onLogin={() => navigate('/login')}
        onGetStarted={() => navigate('/login')}
      />

      <main>
        <HeroSection
          onGetStarted={() => navigate('/login')}
          onLogin={() => navigate('/login')}
        />
        <FeaturesSection />
        <HowItWorksSection />
        <QuranSection />
        <ShowcaseSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection onGetStarted={() => navigate('/login')} />
      </main>

      <Footer />
    </div>
  );
}

// ── Constellation data ─────────────────────────────────────────────────────
const STAR_NODES = [
  { cx: 8,  cy: 12, r: 1.5, op: 0.7 }, { cx: 18, cy: 7,  r: 1.2, op: 0.5 },
  { cx: 30, cy: 15, r: 1.0, op: 0.6 }, { cx: 22, cy: 28, r: 1.3, op: 0.4 },
  { cx: 70, cy: 8,  r: 1.5, op: 0.7 }, { cx: 82, cy: 18, r: 1.2, op: 0.5 },
  { cx: 75, cy: 30, r: 1.4, op: 0.55}, { cx: 90, cy: 10, r: 1.0, op: 0.45},
  { cx: 92, cy: 35, r: 1.2, op: 0.4 }, { cx: 55, cy: 5,  r: 1.0, op: 0.5 },
  { cx: 45, cy: 20, r: 1.3, op: 0.35}, { cx: 5,  cy: 40, r: 1.0, op: 0.3 },
  { cx: 15, cy: 55, r: 1.2, op: 0.3 }, { cx: 88, cy: 55, r: 1.0, op: 0.3 },
];
const CONSTELLATION_LINES = [
  { x1: 8, y1: 12, x2: 18, y2: 7  }, { x1: 18, y1: 7,  x2: 30, y2: 15 },
  { x1: 30, y1: 15, x2: 22, y2: 28 }, { x1: 8,  y1: 12, x2: 22, y2: 28 },
  { x1: 70, y1: 8,  x2: 82, y2: 18 }, { x1: 82, y1: 18, x2: 75, y2: 30 },
  { x1: 70, y1: 8,  x2: 90, y2: 10 }, { x1: 90, y1: 10, x2: 92, y2: 35 },
  { x1: 55, y1: 5,  x2: 45, y2: 20 }, { x1: 45, y1: 20, x2: 30, y2: 15 },
];
