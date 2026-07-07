# EduArabic – Brand Guide

## Logo
**URL**: https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png

Usage:
- Always display on sidebar header and login page
- Minimum size: 32×32px
- Never stretch, recolor, or apply filters to the logo

## Color System

### Light Mode
| Token | HSL | Hex Approx | Usage |
|-------|-----|------------|-------|
| `--primary` | 0 100% 27% | #8B0000 | Primary actions, buttons, links |
| `--background` | 40 25% 97% | #F9F7F2 | Page background — warm parchment |
| `--card` | 0 0% 100% | #FFFFFF | Card surfaces |
| `--accent` | 38 52% 56% | #C5973A | AI highlights, achievement badges |
| `--sidebar-background` | 0 80% 22% | #660000 | Sidebar — deep maroon |
| `--sidebar-foreground` | 0 0% 95% | #F2F2F2 | Sidebar text |

### Dark Mode
| Token | Usage |
|-------|-------|
| `--primary`: 0 85% 45% | Brighter crimson for dark backgrounds |
| `--background`: 0 10% 8% | Near-black with warm undertone |
| `--card`: 0 8% 11% | Slightly lighter than background |

### Status Colors
| Status | Color | Usage |
|--------|-------|-------|
| Success | Green `--success` | Present, Paid, Memorized |
| Warning | Amber `--warning` | Excused, Pending, Needs Revision |
| Error | Red `--destructive` | Absent, Overdue, Failed |
| Info | Blue `--info` | Published, In Progress |

## Typography

### Font Families
- **Latin text**: Inter (300, 400, 500, 600, 700)
- **Arabic text**: Noto Sans Arabic (300, 400, 500, 600, 700)

### Scale
| Role | Size | Weight |
|------|------|--------|
| Page title | `text-2xl` | 700 |
| Section heading | `text-xl` | 600 |
| Card title | `text-lg` | 600 |
| Body | `text-sm`–`text-base` | 400 |
| Caption/label | `text-xs`–`text-sm` | 400–500 |

## Iconography
- **Library**: lucide-react exclusively
- **Size**: 16px (`h-4 w-4`) for inline, 20px for standalone, 24px for empty states
- No emojis in UI labels, buttons, or navigation

## Spacing
4px base unit: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96px`

## Component Style Patterns

### Cards
```
bg-card border border-border rounded-lg shadow-sm
```

### Primary Buttons
```
bg-primary text-primary-foreground hover:bg-primary/90
```

### Sidebar Items
```
text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
```

### Status Badges
All status badges use semantic color variables, never raw Tailwind colors like `bg-green-500`.

## Islamic Aesthetic Guidelines
- Use geometric patterns (stars, arabesques) sparingly as decorative accents
- Warm parchment background evokes aged manuscript / traditional Islamic book aesthetic
- Deep crimson/maroon echoes traditional Islamic academic regalia
- Gold/brass accent (`--accent`) evokes illuminated manuscripts and achievement
- Avoid overly modern "tech startup" aesthetics — maintain warmth and gravitas
