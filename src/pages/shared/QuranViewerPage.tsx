import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { colorizeAyah, TAJWEED_COLORS, TAJWEED_LABELS, TAJWEED_EXPLANATIONS, type TajweedRule } from '@/lib/tajweed';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Play, Pause, Square, SkipBack, SkipForward, Repeat, Search,
  BookOpen, Volume2, ChevronLeft, ChevronRight, Loader2,
  ListMusic, SkipForward as AutoNext, Settings2, AlignJustify,
} from 'lucide-react';

// ── Static Quran metadata (all 114 surahs) ────────────────────────────────────
interface SurahMeta {
  number: number;
  name: string;         // Arabic
  englishName: string;  // Transliteration
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

const SURAHS: SurahMeta[] = [
  { number: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 2, name: 'البقرة', englishName: 'Al-Baqarah', englishNameTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan' },
  { number: 3, name: 'آل عمران', englishName: 'Aal-E-Imran', englishNameTranslation: 'The Family of Imran', numberOfAyahs: 200, revelationType: 'Medinan' },
  { number: 4, name: 'النساء', englishName: 'An-Nisa', englishNameTranslation: 'The Women', numberOfAyahs: 176, revelationType: 'Medinan' },
  { number: 5, name: 'المائدة', englishName: 'Al-Maidah', englishNameTranslation: 'The Table Spread', numberOfAyahs: 120, revelationType: 'Medinan' },
  { number: 6, name: 'الأنعام', englishName: 'Al-Anam', englishNameTranslation: 'The Cattle', numberOfAyahs: 165, revelationType: 'Meccan' },
  { number: 7, name: 'الأعراف', englishName: 'Al-Araf', englishNameTranslation: 'The Heights', numberOfAyahs: 206, revelationType: 'Meccan' },
  { number: 8, name: 'الأنفال', englishName: 'Al-Anfal', englishNameTranslation: 'The Spoils of War', numberOfAyahs: 75, revelationType: 'Medinan' },
  { number: 9, name: 'التوبة', englishName: 'At-Tawbah', englishNameTranslation: 'The Repentance', numberOfAyahs: 129, revelationType: 'Medinan' },
  { number: 10, name: 'يونس', englishName: 'Yunus', englishNameTranslation: 'Jonah', numberOfAyahs: 109, revelationType: 'Meccan' },
  { number: 11, name: 'هود', englishName: 'Hud', englishNameTranslation: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan' },
  { number: 12, name: 'يوسف', englishName: 'Yusuf', englishNameTranslation: 'Joseph', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 13, name: 'الرعد', englishName: 'Ar-Rad', englishNameTranslation: 'The Thunder', numberOfAyahs: 43, revelationType: 'Medinan' },
  { number: 14, name: 'ابراهيم', englishName: 'Ibrahim', englishNameTranslation: 'Abraham', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 15, name: 'الحجر', englishName: 'Al-Hijr', englishNameTranslation: 'The Rocky Tract', numberOfAyahs: 99, revelationType: 'Meccan' },
  { number: 16, name: 'النحل', englishName: 'An-Nahl', englishNameTranslation: 'The Bee', numberOfAyahs: 128, revelationType: 'Meccan' },
  { number: 17, name: 'الإسراء', englishName: 'Al-Isra', englishNameTranslation: 'The Night Journey', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 18, name: 'الكهف', englishName: 'Al-Kahf', englishNameTranslation: 'The Cave', numberOfAyahs: 110, revelationType: 'Meccan' },
  { number: 19, name: 'مريم', englishName: 'Maryam', englishNameTranslation: 'Mary', numberOfAyahs: 98, revelationType: 'Meccan' },
  { number: 20, name: 'طه', englishName: 'Ta-Ha', englishNameTranslation: 'Ta-Ha', numberOfAyahs: 135, revelationType: 'Meccan' },
  { number: 21, name: 'الأنبياء', englishName: 'Al-Anbiya', englishNameTranslation: 'The Prophets', numberOfAyahs: 112, revelationType: 'Meccan' },
  { number: 22, name: 'الحج', englishName: 'Al-Hajj', englishNameTranslation: 'The Pilgrimage', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 23, name: 'المؤمنون', englishName: 'Al-Muminun', englishNameTranslation: 'The Believers', numberOfAyahs: 118, revelationType: 'Meccan' },
  { number: 24, name: 'النور', englishName: 'An-Nur', englishNameTranslation: 'The Light', numberOfAyahs: 64, revelationType: 'Medinan' },
  { number: 25, name: 'الفرقان', englishName: 'Al-Furqan', englishNameTranslation: 'The Criterion', numberOfAyahs: 77, revelationType: 'Meccan' },
  { number: 26, name: 'الشعراء', englishName: 'Ash-Shuara', englishNameTranslation: 'The Poets', numberOfAyahs: 227, revelationType: 'Meccan' },
  { number: 27, name: 'النمل', englishName: 'An-Naml', englishNameTranslation: 'The Ant', numberOfAyahs: 93, revelationType: 'Meccan' },
  { number: 28, name: 'القصص', englishName: 'Al-Qasas', englishNameTranslation: 'The Stories', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 29, name: 'العنكبوت', englishName: 'Al-Ankabut', englishNameTranslation: 'The Spider', numberOfAyahs: 69, revelationType: 'Meccan' },
  { number: 30, name: 'الروم', englishName: 'Ar-Rum', englishNameTranslation: 'The Romans', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 31, name: 'لقمان', englishName: 'Luqman', englishNameTranslation: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan' },
  { number: 32, name: 'السجدة', englishName: 'As-Sajdah', englishNameTranslation: 'The Prostration', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 33, name: 'الأحزاب', englishName: 'Al-Ahzab', englishNameTranslation: 'The Combined Forces', numberOfAyahs: 73, revelationType: 'Medinan' },
  { number: 34, name: 'سبأ', englishName: 'Saba', englishNameTranslation: 'Sheba', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 35, name: 'فاطر', englishName: 'Fatir', englishNameTranslation: 'Originator', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 36, name: 'يس', englishName: 'Ya-Sin', englishNameTranslation: 'Ya-Sin', numberOfAyahs: 83, revelationType: 'Meccan' },
  { number: 37, name: 'الصافات', englishName: 'As-Saffat', englishNameTranslation: 'Those who set the Ranks', numberOfAyahs: 182, revelationType: 'Meccan' },
  { number: 38, name: 'ص', englishName: 'Sad', englishNameTranslation: 'The Letter Sad', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 39, name: 'الزمر', englishName: 'Az-Zumar', englishNameTranslation: 'The Troops', numberOfAyahs: 75, revelationType: 'Meccan' },
  { number: 40, name: 'غافر', englishName: 'Ghafir', englishNameTranslation: 'The Forgiver', numberOfAyahs: 85, revelationType: 'Meccan' },
  { number: 41, name: 'فصلت', englishName: 'Fussilat', englishNameTranslation: 'Explained in Detail', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 42, name: 'الشورى', englishName: 'Ash-Shuraa', englishNameTranslation: 'The Consultation', numberOfAyahs: 53, revelationType: 'Meccan' },
  { number: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', englishNameTranslation: 'The Ornaments of Gold', numberOfAyahs: 89, revelationType: 'Meccan' },
  { number: 44, name: 'الدخان', englishName: 'Ad-Dukhan', englishNameTranslation: 'The Smoke', numberOfAyahs: 59, revelationType: 'Meccan' },
  { number: 45, name: 'الجاثية', englishName: 'Al-Jathiyah', englishNameTranslation: 'The Crouching', numberOfAyahs: 37, revelationType: 'Meccan' },
  { number: 46, name: 'الأحقاف', englishName: 'Al-Ahqaf', englishNameTranslation: 'The Wind-Curved Sandhills', numberOfAyahs: 35, revelationType: 'Meccan' },
  { number: 47, name: 'محمد', englishName: 'Muhammad', englishNameTranslation: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan' },
  { number: 48, name: 'الفتح', englishName: 'Al-Fath', englishNameTranslation: 'The Victory', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 49, name: 'الحجرات', englishName: 'Al-Hujurat', englishNameTranslation: 'The Rooms', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 50, name: 'ق', englishName: 'Qaf', englishNameTranslation: 'The Letter Qaf', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 51, name: 'الذاريات', englishName: 'Adh-Dhariyat', englishNameTranslation: 'The Winnowing Winds', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 52, name: 'الطور', englishName: 'At-Tur', englishNameTranslation: 'The Mount', numberOfAyahs: 49, revelationType: 'Meccan' },
  { number: 53, name: 'النجم', englishName: 'An-Najm', englishNameTranslation: 'The Star', numberOfAyahs: 62, revelationType: 'Meccan' },
  { number: 54, name: 'القمر', englishName: 'Al-Qamar', englishNameTranslation: 'The Moon', numberOfAyahs: 55, revelationType: 'Meccan' },
  { number: 55, name: 'الرحمن', englishName: 'Ar-Rahman', englishNameTranslation: 'The Beneficent', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 56, name: 'الواقعة', englishName: 'Al-Waqiah', englishNameTranslation: 'The Inevitable', numberOfAyahs: 96, revelationType: 'Meccan' },
  { number: 57, name: 'الحديد', englishName: 'Al-Hadid', englishNameTranslation: 'The Iron', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 58, name: 'المجادلة', englishName: 'Al-Mujadila', englishNameTranslation: 'The Pleading Woman', numberOfAyahs: 22, revelationType: 'Medinan' },
  { number: 59, name: 'الحشر', englishName: 'Al-Hashr', englishNameTranslation: 'The Exile', numberOfAyahs: 24, revelationType: 'Medinan' },
  { number: 60, name: 'الممتحنة', englishName: 'Al-Mumtahanah', englishNameTranslation: 'She that is to be Examined', numberOfAyahs: 13, revelationType: 'Medinan' },
  { number: 61, name: 'الصف', englishName: 'As-Saf', englishNameTranslation: 'The Ranks', numberOfAyahs: 14, revelationType: 'Medinan' },
  { number: 62, name: 'الجمعة', englishName: 'Al-Jumuah', englishNameTranslation: 'Friday', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 63, name: 'المنافقون', englishName: 'Al-Munafiqun', englishNameTranslation: 'The Hypocrites', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 64, name: 'التغابن', englishName: 'At-Taghabun', englishNameTranslation: 'The Mutual Disillusion', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 65, name: 'الطلاق', englishName: 'At-Talaq', englishNameTranslation: 'The Divorce', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 66, name: 'التحريم', englishName: 'At-Tahrim', englishNameTranslation: 'The Prohibition', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 67, name: 'الملك', englishName: 'Al-Mulk', englishNameTranslation: 'The Sovereignty', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 68, name: 'القلم', englishName: 'Al-Qalam', englishNameTranslation: 'The Pen', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 69, name: 'الحاقة', englishName: 'Al-Haqqah', englishNameTranslation: 'The Reality', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 70, name: 'المعارج', englishName: "Al-Ma'arij", englishNameTranslation: 'The Ascending Stairways', numberOfAyahs: 44, revelationType: 'Meccan' },
  { number: 71, name: 'نوح', englishName: 'Nuh', englishNameTranslation: 'Noah', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 72, name: 'الجن', englishName: 'Al-Jinn', englishNameTranslation: 'The Jinn', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 73, name: 'المزمل', englishName: 'Al-Muzzammil', englishNameTranslation: 'The Enshrouded One', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 74, name: 'المدثر', englishName: 'Al-Muddaththir', englishNameTranslation: 'The Cloaked One', numberOfAyahs: 56, revelationType: 'Meccan' },
  { number: 75, name: 'القيامة', englishName: 'Al-Qiyamah', englishNameTranslation: 'The Resurrection', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 76, name: 'الانسان', englishName: 'Al-Insan', englishNameTranslation: 'The Human', numberOfAyahs: 31, revelationType: 'Medinan' },
  { number: 77, name: 'المرسلات', englishName: 'Al-Mursalat', englishNameTranslation: 'The Emissaries', numberOfAyahs: 50, revelationType: 'Meccan' },
  { number: 78, name: 'النبأ', englishName: "An-Naba", englishNameTranslation: 'The Tidings', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 79, name: 'النازعات', englishName: "An-Naziat", englishNameTranslation: 'Those who drag forth', numberOfAyahs: 46, revelationType: 'Meccan' },
  { number: 80, name: 'عبس', englishName: 'Abasa', englishNameTranslation: 'He Frowned', numberOfAyahs: 42, revelationType: 'Meccan' },
  { number: 81, name: 'التكوير', englishName: 'At-Takwir', englishNameTranslation: 'The Overthrowing', numberOfAyahs: 29, revelationType: 'Meccan' },
  { number: 82, name: 'الإنفطار', englishName: 'Al-Infitar', englishNameTranslation: 'The Cleaving', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', englishNameTranslation: 'The Defrauding', numberOfAyahs: 36, revelationType: 'Meccan' },
  { number: 84, name: 'الإنشقاق', englishName: 'Al-Inshiqaq', englishNameTranslation: 'The Sundering', numberOfAyahs: 25, revelationType: 'Meccan' },
  { number: 85, name: 'البروج', englishName: 'Al-Buruj', englishNameTranslation: 'The Mansions of the Stars', numberOfAyahs: 22, revelationType: 'Meccan' },
  { number: 86, name: 'الطارق', englishName: 'At-Tariq', englishNameTranslation: 'The Nightcommer', numberOfAyahs: 17, revelationType: 'Meccan' },
  { number: 87, name: 'الأعلى', englishName: 'Al-Ala', englishNameTranslation: 'The Most High', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 88, name: 'الغاشية', englishName: 'Al-Ghashiyah', englishNameTranslation: 'The Overwhelming', numberOfAyahs: 26, revelationType: 'Meccan' },
  { number: 89, name: 'الفجر', englishName: 'Al-Fajr', englishNameTranslation: 'The Dawn', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 90, name: 'البلد', englishName: 'Al-Balad', englishNameTranslation: 'The City', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 91, name: 'الشمس', englishName: 'Ash-Shams', englishNameTranslation: 'The Sun', numberOfAyahs: 15, revelationType: 'Meccan' },
  { number: 92, name: 'الليل', englishName: 'Al-Lail', englishNameTranslation: 'The Night', numberOfAyahs: 21, revelationType: 'Meccan' },
  { number: 93, name: 'الضحى', englishName: 'Ad-Duhaa', englishNameTranslation: 'The Morning Hours', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 94, name: 'الشرح', englishName: 'Ash-Sharh', englishNameTranslation: 'The Relief', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 95, name: 'التين', englishName: 'At-Tin', englishNameTranslation: 'The Fig', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 96, name: 'العلق', englishName: 'Al-Alaq', englishNameTranslation: 'The Clot', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 97, name: 'القدر', englishName: 'Al-Qadr', englishNameTranslation: 'The Power', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 98, name: 'البينة', englishName: 'Al-Bayyinah', englishNameTranslation: 'The Clear Proof', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 99, name: 'الزلزلة', englishName: 'Az-Zalzalah', englishNameTranslation: 'The Earthquake', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 100, name: 'العاديات', englishName: 'Al-Adiyat', englishNameTranslation: 'The Courser', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 101, name: 'القارعة', englishName: 'Al-Qariah', englishNameTranslation: 'The Calamity', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 102, name: 'التكاثر', englishName: 'At-Takathur', englishNameTranslation: 'The Rivalry in World Increase', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 103, name: 'العصر', englishName: 'Al-Asr', englishNameTranslation: 'The Declining Day', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 104, name: 'الهمزة', englishName: 'Al-Humazah', englishNameTranslation: 'The Traducer', numberOfAyahs: 9, revelationType: 'Meccan' },
  { number: 105, name: 'الفيل', englishName: 'Al-Fil', englishNameTranslation: 'The Elephant', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 106, name: 'قريش', englishName: 'Quraysh', englishNameTranslation: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 107, name: 'الماعون', englishName: "Al-Ma'un", englishNameTranslation: 'The Small Kindnesses', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 108, name: 'الكوثر', englishName: 'Al-Kawthar', englishNameTranslation: 'A River in Paradise', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 109, name: 'الكافرون', englishName: 'Al-Kafirun', englishNameTranslation: 'The Disbelievers', numberOfAyahs: 6, revelationType: 'Meccan' },
  { number: 110, name: 'النصر', englishName: 'An-Nasr', englishNameTranslation: 'The Divine Support', numberOfAyahs: 3, revelationType: 'Medinan' },
  { number: 111, name: 'المسد', englishName: 'Al-Masad', englishNameTranslation: 'The Palm Fibre', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', englishNameTranslation: 'The Sincerity', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 113, name: 'الفلق', englishName: 'Al-Falaq', englishNameTranslation: 'The Daybreak', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 114, name: 'الناس', englishName: 'An-Nas', englishNameTranslation: 'The Mankind', numberOfAyahs: 6, revelationType: 'Meccan' },
];


// ── Reciters (everyayah.com CDN — all verified) ───────────────────────────────
interface Reciter {
  id: string;
  name: string;
  folder: string;
  style?: string;
}
const RECITERS: Reciter[] = [
  { id: 'alafasy',    name: 'Mishary Rashid Alafasy',    folder: 'Alafasy_128kbps',                        style: 'Murattal' },
  { id: 'abdulsamad', name: 'Abdul Basit Abd us-Samad',  folder: 'Abdul_Basit_Murattal_192kbps',           style: 'Murattal' },
  { id: 'mujawwad',   name: 'Abdul Basit (Mujawwad)',    folder: 'Abdul_Basit_Mujawwad_128kbps',           style: 'Mujawwad' },
  { id: 'maher',      name: 'Maher Al-Muaiqly',          folder: 'MaherAlMuaiqly128kbps',                  style: 'Murattal' },
  { id: 'ghamadi',    name: 'Saad Al-Ghamdi',            folder: 'Ghamadi_40kbps',                         style: 'Murattal' },
  { id: 'minshawi',   name: 'Mohamed Siddiq Al-Minshawi',folder: 'Minshawy_Murattal_128kbps',               style: 'Murattal' },
  { id: 'tablaway',   name: 'Mohammad Al-Tablaway',      folder: 'Mohammad_al_Tablaway_128kbps',            style: 'Murattal' },
  { id: 'hudhaify',   name: 'Ali Al-Hudhaify',           folder: 'Hudhaify_128kbps',                       style: 'Murattal' },
  { id: 'sudais',     name: 'Abdur-Rahman As-Sudais',    folder: 'Abdurrahmaan_As-Sudais_192kbps',         style: 'Murattal' },
  { id: 'shuraym',    name: 'Saud Al-Shuraym',           folder: 'Saud_ash-Shuraym_128kbps',               style: 'Murattal' },
  { id: 'ajamy',      name: 'Ahmed Al-Ajamy',            folder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah', style: 'Murattal' },
  { id: 'ibrahim',    name: 'Ibrahim Al-Akhdar',         folder: 'Ibrahim_Akhdar_128kbps',                 style: 'Murattal' },
  { id: 'husary',     name: 'Mahmoud Khalil Al-Husary',  folder: 'Husary_128kbps',                         style: 'Murattal' },
  { id: 'basfar',     name: 'Abdullah Basfar',           folder: 'Abdullah_Basfar_192kbps',                style: 'Murattal' },
];

// ── Audio URL (everyayah.com) ─────────────────────────────────────────────────
function audioUrl(surahNo: number, ayahNo: number, folder: string): string {
  const s = String(surahNo).padStart(3, '0');
  const a = String(ayahNo).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

// ── Page image URL — Islamic Network CDN (most reliable, CORS-open) ──────────
// Primary: cdn.islamic.network  Fallback: tanzil.net  Final: qurancdn.com
// ── Page start lookup (surah → first page) ────────────────────────────────────
const SURAH_FIRST_PAGE: Record<number, number> = {
  1:1,2:2,3:50,4:77,5:106,6:128,7:151,8:177,9:187,10:208,11:221,12:235,
  13:249,14:255,15:262,16:267,17:282,18:293,19:305,20:312,21:322,22:332,
  23:342,24:350,25:359,26:367,27:377,28:385,29:396,30:404,31:411,32:415,
  33:418,34:428,35:434,36:440,37:446,38:453,39:458,40:467,41:477,42:483,
  43:489,44:496,45:499,46:502,47:507,48:511,49:515,50:518,51:520,52:523,
  53:526,54:528,55:531,56:534,57:537,58:542,59:545,60:549,61:551,62:553,
  63:554,64:556,65:558,66:560,67:562,68:564,69:566,70:568,71:570,72:572,
  73:574,74:575,75:577,76:578,77:580,78:582,79:583,80:585,81:586,82:587,
  83:587,84:589,85:590,86:591,87:591,88:592,89:593,90:594,91:595,92:595,
  93:596,94:596,95:597,96:597,97:598,98:598,99:599,100:599,101:600,102:601,
  103:601,104:602,105:602,106:602,107:603,108:603,109:603,110:603,111:604,
  112:604,113:604,114:604,
};

function formatTime(sec: number) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Persistent Mini-Player (shown in page view while audio is active) ─────────
interface MiniPlayerProps {
  surah: SurahMeta;
  ayah: number;
  totalAyahs: number;
  isPlaying: boolean;
  audioLoading: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (v: number[]) => void;
  onSwitchToAudio: () => void;
}
function MiniPlayer({ surah, ayah, totalAyahs, isPlaying, audioLoading, progress, duration, currentTime,
  onTogglePlay, onPrev, onNext, onSeek, onSwitchToAudio }: MiniPlayerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg px-4 py-3">
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{surah.englishName} — Ayah {ayah}/{totalAyahs}</p>
            <Slider min={0} max={100} step={0.1} value={[progress]} onValueChange={onSeek} className="mt-1" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}><SkipBack className="h-4 w-4" /></Button>
            <Button size="icon" className="h-9 w-9 rounded-full" onClick={onTogglePlay} disabled={audioLoading}>
              {audioLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}><SkipForward className="h-4 w-4" /></Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSwitchToAudio}><Volume2 className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Full Player</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
// ── Component ─────────────────────────────────────────────────────────────────
export default function QuranViewerPage() {
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(null);
  const [view, setView] = useState<'list' | 'page' | 'audio'>('list');

  // Page viewer
  const [currentPage, setCurrentPage] = useState(1);

  // ── Audio state — each has a matching ref to avoid stale closures ──────────
  const [currentAyahS, setCurrentAyahS] = useState(1);
  const [selectedSurahS, setSelectedSurahS] = useState<SurahMeta | null>(null);
  const [isPlayingS, setIsPlayingS] = useState(false);
  const [autoAdvanceS, setAutoAdvanceS] = useState(true);
  const [useRangeS, setUseRangeS] = useState(false);
  const [rangeStartS, setRangeStartS] = useState(1);
  const [rangeEndS, setRangeEndS] = useState(1);
  const [isRepeatS, setIsRepeatS] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showJumpList, setShowJumpList] = useState(false);

  // Refs that mirror state — used inside audio callbacks to avoid stale closures
  const currentAyah     = useRef(1);
  const activeSurah     = useRef<SurahMeta | null>(null);
  const isPlaying       = useRef(false);
  const autoAdvance     = useRef(true);
  const useRange        = useRef(false);
  const rangeStart      = useRef(1);
  const rangeEnd        = useRef(1);
  const isRepeat        = useRef(false);
  const speedRef        = useRef(1);
  const reciterRef      = useRef<Reciter>(RECITERS[0]);

  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const ayahListRef = useRef<HTMLDivElement | null>(null);

  // Sync state → refs
  const setCurrentAyah = (v: number | ((p: number) => number)) => {
    const next = typeof v === 'function' ? v(currentAyah.current) : v;
    currentAyah.current = next;
    setCurrentAyahS(next);
  };
  const setIsPlaying = (v: boolean) => { isPlaying.current = v; setIsPlayingS(v); };
  const setAutoAdvance = (v: boolean) => { autoAdvance.current = v; setAutoAdvanceS(v); };
  const setUseRange = (v: boolean) => { useRange.current = v; setUseRangeS(v); };
  const setRangeStart = (v: number) => { rangeStart.current = v; setRangeStartS(v); };
  const setRangeEnd = (v: number) => { rangeEnd.current = v; setRangeEndS(v); };
  const setIsRepeat = (fn: (p: boolean) => boolean) => {
    const next = fn(isRepeat.current);
    isRepeat.current = next;
    setIsRepeatS(next);
  };
  const setActiveSurah = (s: SurahMeta | null) => { activeSurah.current = s; setSelectedSurahS(s); };
  const setReciter = (r: Reciter) => { reciterRef.current = r; setSelectedReciter(r); };
  const setSpeed2 = (s: number) => { speedRef.current = s; setSpeed(s); };

  // ── Quran text for page view ──────────────────────────────────────────────
  const [pageVerses, setPageVerses] = useState<{ number: number; numberInSurah: number; text: string; surahName: string; surahNumber: number }[]>([]);
  const [pageTextLoading, setPageTextLoading] = useState(false);
  const [showTajweed, setShowTajweed] = useState(true);
  const [beginnerMode, setBeginnerMode] = useState(false);
  // ref map: "surahNum-ayahNum" → DOM element for scroll-to-highlight
  const verseRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // ── Reading progress ──────────────────────────────────────────────────────
  const { user } = useAuth();
  const [readingProgress, setReadingProgress] = useState<Record<number, { pagesVisited: number[]; ayahsRead: number; totalAyahs: number }>>({});
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load reading progress on mount
  useEffect(() => {
    if (!user) return;
    supabase.from('quran_reading_progress').select('surah_number,pages_visited,ayahs_read,total_ayahs')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: typeof readingProgress = {};
        data.forEach(r => { map[r.surah_number] = { pagesVisited: r.pages_visited, ayahsRead: r.ayahs_read, totalAyahs: r.total_ayahs }; });
        setReadingProgress(map);
      });
  }, [user]);

  /** Mark current page as visited for the active surah (debounced 3 s) */
  const recordPageVisit = useCallback((surahNum: number, page: number, totalAyahs: number) => {
    if (!user) return;
    setReadingProgress(prev => {
      const existing = prev[surahNum] ?? { pagesVisited: [], ayahsRead: 0, totalAyahs };
      if (existing.pagesVisited.includes(page)) return prev;
      const updated = { ...existing, pagesVisited: [...existing.pagesVisited, page] };
      // debounce DB write
      if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
      progressSaveTimer.current = setTimeout(() => {
        supabase.from('quran_reading_progress').upsert({
          user_id: user.id,
          surah_number: surahNum,
          pages_visited: updated.pagesVisited,
          ayahs_read: updated.ayahsRead,
          total_ayahs: totalAyahs,
          last_read_at: new Date().toISOString(),
        }, { onConflict: 'user_id,surah_number' }).then(() => {});
      }, 3000);
      return { ...prev, [surahNum]: updated };
    });
  }, [user]);

  /** Helper: fetch page number for a given surah:ayah from alquran.cloud */
  const fetchPageForAyah = useCallback(async (surahNum: number, ayahNum: number): Promise<number> => {
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}`);
      const json = await res.json();
      return json?.data?.page ?? (SURAH_FIRST_PAGE[surahNum] || 1);
    } catch {
      return SURAH_FIRST_PAGE[surahNum] || 1;
    }
  }, []);

  const filtered = SURAHS.filter(s =>
    s.englishName.toLowerCase().includes(search.toLowerCase()) ||
    s.name.includes(search) ||
    String(s.number).includes(search)
  );

  useEffect(() => {
    if (view !== 'page' || !currentPage) return;
    setPageTextLoading(true);
    setPageVerses([]);
    fetch(`https://api.alquran.cloud/v1/page/${currentPage}/quran-uthmani`)
      .then(r => r.json())
      .then(data => {
        const verses = (data?.data?.ayahs || []).map((a: any) => ({
          number: a.number,
          numberInSurah: a.numberInSurah,
          text: a.text,
          surahName: a.surah?.englishName || '',
          surahNumber: a.surah?.number || 0,
        }));
        setPageVerses(verses);
        // Record page visit for the primary surah on this page
        if (verses.length > 0) {
          const primarySurah = verses[0].surahNumber;
          const surahMeta = SURAHS.find(s => s.number === primarySurah);
          if (surahMeta) recordPageVisit(primarySurah, currentPage, surahMeta.numberOfAyahs);
        }
      })
      .catch(() => setPageVerses([]))
      .finally(() => setPageTextLoading(false));
  }, [view, currentPage, recordPageVisit]);

  const openSurah = async (surah: SurahMeta, mode: 'page' | 'audio') => {
    setActiveSurah(surah);
    setSelectedSurah(surah);
    setCurrentAyah(1);
    setRangeStart(1);
    setRangeEnd(surah.numberOfAyahs);
    setCurrentPage(SURAH_FIRST_PAGE[surah.number] || 1);
    setView(mode);
    setIsPlaying(false);
  };

  // ── Audio engine ─────────────────────────────────────────────────────────
  const loadAndPlay = useCallback((surah: SurahMeta, ayah: number, playAfterLoad: boolean) => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.src = audioUrl(surah.number, ayah, reciterRef.current.folder);
    el.playbackRate = speedRef.current;
    setAudioLoading(true);
    setProgress(0);
    setDuration(0);
    setCurrentTime(0);
    if (playAfterLoad) {
      isPlaying.current = true;
      setIsPlayingS(true);
    }
  }, []);

  // Trigger load when surah/reciter changes OR when view first opens.
  // NOTE: currentAyahS is intentionally NOT in deps — auto-advance calls loadAndPlay
  // directly from handleEnded to avoid the stale-closure/double-call issue.
  useEffect(() => {
    if (view !== 'list' && selectedSurahS) {
      loadAndPlay(selectedSurahS, currentAyah.current, isPlaying.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedSurahS, selectedReciter, loadAndPlay]);

  // Sync playback rate on speed change
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Auto-scroll jump list
  useEffect(() => {
    if (ayahListRef.current) {
      const active = ayahListRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentAyahS]);

  // Auto-scroll + highlight active verse in page reading view
  // Also auto-flip page when the active ayah is NOT in current page verses
  useEffect(() => {
    if (view !== 'page' || !activeSurah.current) return;
    const key = `${activeSurah.current.number}-${currentAyahS}`;
    const el = verseRefs.current.get(key);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else if (autoAdvance.current && pageVerses.length > 0) {
      // Active ayah not on this page — flip to next page automatically
      const lastOnPage = pageVerses[pageVerses.length - 1];
      const firstOnPage = pageVerses[0];
      const ayahIsAhead = currentAyahS > (lastOnPage?.numberInSurah ?? 0) &&
        activeSurah.current.number === (lastOnPage?.surahNumber ?? activeSurah.current.number);
      const ayahIsBehind = currentAyahS < (firstOnPage?.numberInSurah ?? 999) &&
        activeSurah.current.number === (firstOnPage?.surahNumber ?? activeSurah.current.number);
      if (ayahIsAhead) setCurrentPage(p => Math.min(604, p + 1));
      else if (ayahIsBehind) setCurrentPage(p => Math.max(1, p - 1));
    }
  }, [currentAyahS, view, pageVerses, autoAdvance]);

  const handleCanPlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setAudioLoading(false);
    setDuration(el.duration || 0);
    if (isPlaying.current) {
      el.play().catch(() => {});
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const ct = el.currentTime;
    const d = el.duration;
    setCurrentTime(ct);
    setProgress(d > 0 ? (ct / d) * 100 : 0);
  }, []);

  const handleEnded = useCallback(() => {
    const surah = activeSurah.current;
    if (!surah) return;

    // Single-ayah repeat
    if (isRepeat.current) {
      audioRef.current?.play().catch(() => {});
      return;
    }

    // No auto-advance — stop
    if (!autoAdvance.current) {
      isPlaying.current = false;
      setIsPlayingS(false);
      return;
    }

    const effEnd = useRange.current
      ? Math.min(rangeEnd.current, surah.numberOfAyahs)
      : surah.numberOfAyahs;
    const effStart = useRange.current ? rangeStart.current : 1;
    const next = currentAyah.current + 1;

    if (next <= effEnd) {
      // Advance to next ayah — call loadAndPlay directly so audio starts immediately
      currentAyah.current = next;
      setCurrentAyahS(next);          // UI only
      loadAndPlay(surah, next, true);
    } else if (useRange.current) {
      // Range exhausted — loop back to start of range
      currentAyah.current = effStart;
      setCurrentAyahS(effStart);      // UI only
      loadAndPlay(surah, effStart, true);
    } else {
      // Surah complete — move to next surah or stop
      const nextSurah = SURAHS.find(s => s.number === surah.number + 1);
      if (nextSurah) {
        activeSurah.current = nextSurah;
        setSelectedSurahS(nextSurah);
        setSelectedSurah(nextSurah);
        setRangeEnd(nextSurah.numberOfAyahs);
        currentAyah.current = 1;
        setCurrentAyahS(1);
        loadAndPlay(nextSurah, 1, true);
      } else {
        isPlaying.current = false;
        setIsPlayingS(false);
      }
    }
  }, [loadAndPlay]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying.current) {
      el.pause();
      setIsPlaying(false);
    } else {
      // If range mode is on and current ayah is before rangeStart, jump to rangeStart first
      if (useRange.current && currentAyah.current < rangeStart.current) {
        const surah = activeSurah.current;
        if (surah) {
          setCurrentAyah(rangeStart.current);
          isPlaying.current = true;
          setIsPlayingS(true);
          loadAndPlay(surah, rangeStart.current, true);
          return;
        }
      }
      el.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [loadAndPlay]);

  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const prevAyah = useCallback(() => {
    const surah = activeSurah.current;
    const floor = useRange.current ? rangeStart.current : 1;
    if (currentAyah.current > floor) {
      setCurrentAyah(a => a - 1);
    } else if (!useRange.current && surah && surah.number > 1) {
      const prev = SURAHS.find(s => s.number === surah.number - 1);
      if (prev) {
        activeSurah.current = prev;
        setSelectedSurahS(prev);
        setSelectedSurah(prev);
        setRangeEnd(prev.numberOfAyahs);
        currentAyah.current = prev.numberOfAyahs;
        setCurrentAyahS(prev.numberOfAyahs);
      }
    }
  }, []);

  const nextAyah = useCallback(() => {
    const surah = activeSurah.current;
    if (!surah) return;
    const effEnd = useRange.current
      ? Math.min(rangeEnd.current, surah.numberOfAyahs)
      : surah.numberOfAyahs;
    if (currentAyah.current < effEnd) {
      setCurrentAyah(a => a + 1);
    } else if (!useRange.current) {
      const next = SURAHS.find(s => s.number === surah.number + 1);
      if (next) {
        activeSurah.current = next;
        setSelectedSurahS(next);
        setSelectedSurah(next);
        setRangeEnd(next.numberOfAyahs);
        currentAyah.current = 1;
        setCurrentAyahS(1);
      }
    }
  }, []);

  const seekTo = useCallback((val: number[]) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    el.currentTime = (val[0] / 100) * el.duration;
  }, []);

  const playFullSurah = useCallback(() => {
    const surah = activeSurah.current || selectedSurahS;
    if (!surah) return;
    setUseRange(false);
    setAutoAdvance(true);
    // Set isPlaying ref TRUE before triggering ayah change so handleCanPlay auto-plays
    isPlaying.current = true;
    setIsPlayingS(true);
    if (currentAyah.current !== 1) {
      currentAyah.current = 1;
      setCurrentAyahS(1);
    } else {
      // Already on ayah 1 — trigger load manually
      loadAndPlay(surah, 1, true);
    }
    setView('audio');
  }, [selectedSurahS, loadAndPlay]);

  // ── Surah list ───────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="space-y-4">
        <PageHeader title="Quran Viewer" description="Browse all 114 surahs — read pages or listen to audio recitation" />
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search surah name or number…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 px-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(surah => (
            <Card key={surah.number} className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{surah.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{surah.englishName}</span>
                    <span className="text-base font-arabic" dir="rtl">{surah.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{surah.englishNameTranslation}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{surah.numberOfAyahs} verses</span>
                    <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${surah.revelationType === 'Meccan' ? 'border-warning/60 text-warning' : 'border-info/60 text-info'}`}>
                      {surah.revelationType}
                    </Badge>
                  </div>
                  {/* Reading progress bar */}
                  {readingProgress[surah.number] && (() => {
                    const prog = readingProgress[surah.number];
                    // Approximate: number of pages read vs total pages for this surah
                    const surahStartPage = SURAH_FIRST_PAGE[surah.number] || 1;
                    const nextSurahStartPage = SURAH_FIRST_PAGE[surah.number + 1] || 605;
                    const totalPages = Math.max(1, nextSurahStartPage - surahStartPage);
                    const pct = Math.min(100, Math.round((prog.pagesVisited.length / totalPages) * 100));
                    return (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{pct}%</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSurah(surah, 'page')}><BookOpen className="h-4 w-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Read pages</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSurah(surah, 'audio')}><Play className="h-4 w-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Play audio</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">No surahs found for "{search}"</div>
          )}
        </div>
      </div>
    );
  }

  // ── Page viewer (Arabic text from alquran.cloud) ─────────────────────────
  if (view === 'page' && selectedSurahS) {
    // Group verses by surah so we can render surah headers
    const surahGroups: { surahNumber: number; surahName: string; arabicName: string; verses: typeof pageVerses }[] = [];
    pageVerses.forEach(v => {
      const last = surahGroups[surahGroups.length - 1];
      const arabicName = SURAHS.find(s => s.number === v.surahNumber)?.name ?? '';
      if (!last || last.surahNumber !== v.surahNumber) {
        surahGroups.push({ surahNumber: v.surahNumber, surahName: v.surahName, arabicName, verses: [v] });
      } else {
        last.verses.push(v);
      }
    });

    return (
      <div className="space-y-4 max-w-2xl mx-auto pb-28">
        <audio ref={audioRef} onCanPlay={handleCanPlay} onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { stopAudio(); setView('list'); }} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />Back
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-balance">{selectedSurahS.englishName} — <span dir="rtl" className="font-arabic">{selectedSurahS.name}</span></h2>
            <p className="text-xs text-muted-foreground">Page {currentPage} of 604 · Uthmani Script</p>
          </div>
          <Button
            variant={showTajweed ? 'secondary' : 'outline'}
            size="sm" className="gap-1.5 shrink-0"
            onClick={() => setShowTajweed(v => !v)}
          >
            <span className="text-xs font-arabic">ت</span>
            <span className="hidden md:inline">Tajweed</span>
          </Button>
          {showTajweed && (
            <Button
              variant={beginnerMode ? 'secondary' : 'outline'}
              size="sm" className="gap-1.5 shrink-0"
              onClick={() => setBeginnerMode(v => !v)}
            >
              <span className="text-xs">?</span>
              <span className="hidden md:inline">Beginner</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setView('audio')}>
            <Volume2 className="h-4 w-4" />Listen
          </Button>
        </div>

        {/* Tajweed legend */}
        {showTajweed && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] px-1">
            {(Object.entries(TAJWEED_COLORS) as [TajweedRule, string][]).map(([rule, cls]) => (
              <span key={rule} className={`font-medium ${cls}`}>
                ● {TAJWEED_LABELS[rule]}
              </span>
            ))}
          </div>
        )}

        {/* Arabic text area */}
        <Card className="bg-[hsl(var(--card))]">
          <CardContent className="p-5 md:p-8">
            {pageTextLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading page {currentPage}…</p>
              </div>
            ) : pageVerses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Unable to load page. Check your connection and try again.</p>
            ) : (
              <div className="space-y-6">
                {surahGroups.map(group => (
                  <div key={group.surahNumber}>
                    {/* Surah header (only show when a new surah starts on this page) */}
                    {group.verses[0].numberInSurah === 1 && (
                      <div className="text-center mb-4">
                        <div className="inline-flex flex-col items-center gap-1 px-6 py-2 rounded-lg border border-primary/20 bg-primary/5">
                          <span className="text-lg font-bold text-primary font-arabic" dir="rtl">{group.arabicName}</span>
                          <span className="text-xs text-muted-foreground">{group.surahName} · Surah {group.surahNumber}</span>
                        </div>
                        {/* Bismillah for all surahs except At-Tawbah (9) and Al-Fatihah (1 already has it) */}
                        {group.surahNumber !== 9 && group.surahNumber !== 1 && (
                          <p className="mt-3 text-2xl text-center font-arabic text-foreground" dir="rtl">
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </p>
                        )}
                      </div>
                    )}
                    {/* Verses rendered as flowing Arabic text with ayah numbers inline */}
                    <p dir="rtl" className="text-right leading-[2.8] text-xl md:text-2xl font-arabic text-foreground tracking-wide">
                      {group.verses.map((v, i) => {
                        const isActive = currentAyahS === v.numberInSurah && activeSurah.current?.number === v.surahNumber;
                        const key = `${v.surahNumber}-${v.numberInSurah}`;
                        const spans = showTajweed ? colorizeAyah(v.text) : null;
                        return (
                          <span key={v.number}>
                            <span
                              ref={el => { if (el) verseRefs.current.set(key, el); else verseRefs.current.delete(key); }}
                              data-ayah={key}
                              className={`cursor-pointer transition-all rounded px-0.5 ${isActive ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-muted/60'}`}
                              onClick={() => {
                                const surah = SURAHS.find(s => s.number === v.surahNumber);
                                if (surah) {
                                  setActiveSurah(surah);
                                  setSelectedSurah(surah);
                                  setCurrentAyah(v.numberInSurah);
                                  isPlaying.current = true;
                                  setIsPlayingS(true);
                                  loadAndPlay(surah, v.numberInSurah, true);
                                }
                              }}
                            >
                              {spans
                                ? spans.map((s, si) => {
                                    if (!s.rule) return <span key={si}>{s.text}</span>;
                                    return beginnerMode ? (
                                      <TooltipProvider key={si} delayDuration={200}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className={`underline decoration-dotted cursor-help ${TAJWEED_COLORS[s.rule as TajweedRule]}`}>
                                              {s.text}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="max-w-[260px] text-xs text-left leading-relaxed p-3">
                                            <p className="font-semibold mb-1">{TAJWEED_LABELS[s.rule as TajweedRule]}</p>
                                            <p className="text-muted-foreground">{TAJWEED_EXPLANATIONS[s.rule as TajweedRule]}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : (
                                      <span key={si} className={TAJWEED_COLORS[s.rule as TajweedRule]} title={TAJWEED_LABELS[s.rule as TajweedRule]}>
                                        {s.text}
                                      </span>
                                    );
                                  })
                                : v.text}
                            </span>
                            <span className="text-primary/70 text-base mx-1 select-none">
                              {' '}﴿{v.numberInSurah.toLocaleString('ar-EG')}﴾{' '}
                            </span>
                            {i < group.verses.length - 1 && ' '}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Page navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={currentPage <= 1}
            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); }} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <Input
              type="number" min={1} max={604} value={currentPage}
              onChange={e => { const v = Math.max(1, Math.min(604, Number(e.target.value))); setCurrentPage(v); }}
              className="w-16 text-center px-2 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">of 604</span>
          </div>
          <Button variant="outline" size="sm" disabled={currentPage >= 604}
            onClick={() => { setCurrentPage(p => Math.min(604, p + 1)); }} className="gap-1.5">
            Next<ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mini-player */}
        <MiniPlayer
          surah={selectedSurahS} ayah={currentAyahS} totalAyahs={selectedSurahS.numberOfAyahs}
          isPlaying={isPlayingS} audioLoading={audioLoading} progress={progress}
          duration={duration} currentTime={currentTime}
          onTogglePlay={togglePlay} onPrev={prevAyah} onNext={nextAyah}
          onSeek={seekTo} onSwitchToAudio={() => setView('audio')}
        />
      </div>
    );
  }

  // ── Audio player ─────────────────────────────────────────────────────────
  if (view === 'audio' && selectedSurahS) {
    const effEnd = useRangeS ? Math.min(rangeEndS, selectedSurahS.numberOfAyahs) : selectedSurahS.numberOfAyahs;

    return (
      <div className="space-y-4 max-w-xl mx-auto pb-6">
        <audio ref={audioRef} onCanPlay={handleCanPlay} onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { stopAudio(); setView('list'); }} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />All Surahs
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={async () => {
            // If range mode is on, jump to the page containing rangeStart ayah
            if (useRange.current && activeSurah.current) {
              const page = await fetchPageForAyah(activeSurah.current.number, rangeStart.current);
              setCurrentPage(page);
            }
            setView('page');
          }}>
            <BookOpen className="h-4 w-4" />Follow Along
          </Button>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Surah info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Now Playing</p>
              <h2 className="text-xl font-bold text-balance">{selectedSurahS.englishName}</h2>
              <p className="text-2xl font-arabic" dir="rtl">{selectedSurahS.name}</p>
              <p className="text-sm text-muted-foreground">
                Ayah {currentAyahS} / {selectedSurahS.numberOfAyahs}
                {useRangeS && <span className="ml-1 text-xs text-primary">(Range {rangeStartS}–{rangeEndS})</span>}
              </p>
            </div>

            {/* Reciter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 w-14">Reciter</span>
              <Select value={selectedReciter.id} onValueChange={val => {
                const r = RECITERS.find(r => r.id === val);
                if (r) { setReciter(r); setIsPlaying(false); }
              }}>
                <SelectTrigger className="flex-1 h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECITERS.map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.name}{r.style ? ` (${r.style})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ayah position slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 w-14">Ayah</span>
              <Slider min={1} max={selectedSurahS.numberOfAyahs} step={1}
                value={[currentAyahS]} onValueChange={([v]) => setCurrentAyah(v)} className="flex-1" />
              <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{currentAyahS}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <Slider min={0} max={100} step={0.1} value={[progress]} onValueChange={seekTo} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{audioLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={prevAyah} className="h-10 w-10"><SkipBack className="h-5 w-5" /></Button>
              </TooltipTrigger><TooltipContent>Previous</TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={stopAudio} className="h-10 w-10"><Square className="h-5 w-5" /></Button>
              </TooltipTrigger><TooltipContent>Stop</TooltipContent></Tooltip>

              <Button size="icon" className="h-14 w-14 rounded-full" onClick={togglePlay} disabled={audioLoading}>
                {audioLoading ? <Loader2 className="h-6 w-6 animate-spin" />
                  : isPlayingS ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
              </Button>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={nextAyah}><SkipForward className="h-5 w-5" /></Button>
              </TooltipTrigger><TooltipContent>Next</TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon"
                  onClick={() => setIsRepeat(r => !r)}
                  className={`h-10 w-10 ${isRepeatS ? 'text-primary' : ''}`}>
                  <Repeat className="h-5 w-5" />
                </Button>
              </TooltipTrigger><TooltipContent>{isRepeatS ? 'Repeat: On' : 'Repeat: Off'}</TooltipContent></Tooltip>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground shrink-0">Speed</span>
              <div className="flex gap-1 flex-wrap">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                  <Button key={s} variant={speed === s ? 'default' : 'outline'} size="sm"
                    className="h-7 px-2 text-xs" onClick={() => setSpeed2(s)}>{s}×</Button>
                ))}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 border-t border-border pt-3 flex-wrap">
              <Button variant={showSettings ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 text-xs"
                onClick={() => setShowSettings(s => !s)}>
                <Settings2 className="h-3.5 w-3.5" />Settings
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={playFullSurah}>
                <ListMusic className="h-3.5 w-3.5" />Full Surah
              </Button>
              <Button variant={showJumpList ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 text-xs ml-auto"
                onClick={() => setShowJumpList(s => !s)}>
                <AlignJustify className="h-3.5 w-3.5" />Jump to Ayah
              </Button>
            </div>

            {/* Advanced settings panel */}
            {showSettings && (
              <div className="space-y-4 border border-border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <AutoNext className="h-3.5 w-3.5 text-primary" />Auto-Advance Verse
                    </Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Automatically play next ayah when current ends</p>
                  </div>
                  <Switch checked={autoAdvanceS} onCheckedChange={setAutoAdvance} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs font-medium">Verse Range Loop</Label>
                    <Switch checked={useRangeS} onCheckedChange={v => {
                      setUseRange(v);
                      if (v && currentAyahS < rangeStartS) setCurrentAyah(rangeStartS);
                    }} />
                  </div>
                  {useRangeS && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">From Ayah</Label>
                        <Select value={String(rangeStartS)} onValueChange={v => setRangeStart(Number(v))}>
                          <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-48">
                            {Array.from({ length: selectedSurahS.numberOfAyahs }, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">To Ayah</Label>
                        <Select value={String(rangeEndS)} onValueChange={v => setRangeEnd(Number(v))}>
                          <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-48">
                            {Array.from({ length: selectedSurahS.numberOfAyahs }, (_, i) => i + 1)
                              .filter(n => n >= rangeStartS)
                              .map(n => (
                                <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {useRangeS && (
                    <p className="text-[10px] text-muted-foreground">
                      Looping ayahs {rangeStartS}–{rangeEndS} ({rangeEndS - rangeStartS + 1} verses)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Surah navigation */}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <Button variant="ghost" size="sm" className="gap-1 text-xs" disabled={selectedSurahS.number <= 1}
                onClick={() => {
                  const p = SURAHS.find(s => s.number === selectedSurahS.number - 1);
                  if (p) { stopAudio(); openSurah(p, 'audio'); }
                }}>
                <ChevronLeft className="h-3.5 w-3.5" />
                {SURAHS.find(s => s.number === selectedSurahS.number - 1)?.englishName || ''}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" disabled={selectedSurahS.number >= 114}
                onClick={() => {
                  const n = SURAHS.find(s => s.number === selectedSurahS.number + 1);
                  if (n) { stopAudio(); openSurah(n, 'audio'); }
                }}>
                {SURAHS.find(s => s.number === selectedSurahS.number + 1)?.englishName || ''}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jump-to-ayah grid */}
        {showJumpList && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Jump to Ayah</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto" ref={ayahListRef}>
                {Array.from({ length: selectedSurahS.numberOfAyahs }, (_, i) => i + 1).map(n => (
                  <button key={n} data-active={currentAyahS === n}
                    onClick={() => setCurrentAyah(n)}
                    className={`w-7 h-7 rounded text-xs transition-colors ${
                      currentAyahS === n ? 'bg-primary text-primary-foreground font-bold' :
                      (useRangeS && n >= rangeStartS && n <= rangeEndS) ? 'bg-primary/20 text-primary' :
                      'bg-muted hover:bg-muted/80'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
