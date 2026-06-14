import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play, Pause, Square, SkipBack, SkipForward, Repeat, Search,
  BookOpen, Volume2, ChevronLeft, ChevronRight, Loader2,
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

// Available reciters on everyayah.com CDN (verified 200 OK)
interface Reciter {
  id: string;
  name: string;
  folder: string;
}
const RECITERS: Reciter[] = [
  { id: 'alafasy',    name: 'Mishary Alafasy',       folder: 'Alafasy_128kbps' },
  { id: 'abdulsamad', name: 'Abdul Samad',            folder: 'AbdulSamad_64kbps_QuranExplorer.Com' },
  { id: 'maher',      name: 'Maher Al-Muaiqly',       folder: 'MaherAlMuaiqly128kbps' },
  { id: 'ghamadi',    name: 'Saad Al-Ghamdi',         folder: 'Ghamadi_40kbps' },
  { id: 'minshawi',   name: 'Mohamed Siddiq Minshawi',folder: 'Minshawy_Murattal_128kbps' },
  { id: 'tablaway',   name: 'Mohammad Al-Tablaway',   folder: 'Mohammad_al_Tablaway_128kbps' },
];

// ── Audio URL helpers ─────────────────────────────────────────────────────────
function audioUrl(surahNo: number, ayahNo: number, folder: string): string {
  // everyayah.com CDN — verified working, format: SSSAAA.mp3
  const s = String(surahNo).padStart(3, '0');
  const a = String(ayahNo).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

// Quran page images via quran.com public API (verse text fallback — images use API)
function pageImageUrl(page: number): string {
  // Using quran.com CDN — correct format (no leading zeros, .png)
  return `https://quran.com/images/pages/p${page}.png`;
}

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

// ── Component ─────────────────────────────────────────────────────────────────
export default function QuranViewerPage() {
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(null);
  const [view, setView] = useState<'list' | 'page' | 'audio'>('list');

  // Page viewer
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);

  // Audio player
  const [currentAyah, setCurrentAyah] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [audioLoading, setAudioLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filtered = SURAHS.filter(s =>
    s.englishName.toLowerCase().includes(search.toLowerCase()) ||
    s.name.includes(search) ||
    String(s.number).includes(search)
  );

  const openSurah = (surah: SurahMeta, mode: 'page' | 'audio') => {
    setSelectedSurah(surah);
    setCurrentAyah(1);
    setCurrentPage(SURAH_FIRST_PAGE[surah.number] || 1);
    setView(mode);
    setIsPlaying(false);
  };

  // ── Audio engine ─────────────────────────────────────────────────────────
  const loadAudio = useCallback((surah: SurahMeta, ayah: number, reciter: Reciter) => {
    if (!audioRef.current) return;
    const el = audioRef.current;
    el.pause();
    el.src = audioUrl(surah.number, ayah, reciter.folder);
    el.playbackRate = speed;
    setAudioLoading(true);
    setProgress(0);
    setDuration(0);
  }, [speed]);

  useEffect(() => {
    if (view === 'audio' && selectedSurah) {
      loadAudio(selectedSurah, currentAyah, selectedReciter);
    }
  }, [view, selectedSurah, currentAyah, selectedReciter, loadAudio]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const handleCanPlay = () => {
    setAudioLoading(false);
    if (isPlaying && audioRef.current) audioRef.current.play().catch(() => {});
    if (audioRef.current) setDuration(audioRef.current.duration || 0);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime, duration: d } = audioRef.current;
    setProgress(d > 0 ? (currentTime / d) * 100 : 0);
  };

  const handleEnded = () => {
    if (!selectedSurah) return;
    if (isRepeat) {
      audioRef.current?.play().catch(() => {});
      return;
    }
    const next = currentAyah + 1;
    if (next <= selectedSurah.numberOfAyahs) {
      setCurrentAyah(next);
    } else {
      // move to next surah
      const nextSurah = SURAHS.find(s => s.number === selectedSurah.number + 1);
      if (nextSurah) { setSelectedSurah(nextSurah); setCurrentAyah(1); }
      else { setIsPlaying(false); }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
  };

  const prevAyah = () => {
    if (currentAyah > 1) { setCurrentAyah(a => a - 1); }
    else if (selectedSurah && selectedSurah.number > 1) {
      const prev = SURAHS.find(s => s.number === selectedSurah.number - 1);
      if (prev) { setSelectedSurah(prev); setCurrentAyah(prev.numberOfAyahs); }
    }
  };

  const nextAyah = () => {
    if (!selectedSurah) return;
    if (currentAyah < selectedSurah.numberOfAyahs) { setCurrentAyah(a => a + 1); }
    else {
      const next = SURAHS.find(s => s.number === selectedSurah.number + 1);
      if (next) { setSelectedSurah(next); setCurrentAyah(1); }
    }
  };

  const seekTo = (val: number[]) => {
    if (!audioRef.current || !duration) return;
    audioRef.current.currentTime = (val[0] / 100) * duration;
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ── Surah list ───────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="space-y-4">
        <PageHeader title="Quran Viewer" description="Browse all 114 surahs — read pages or listen to audio recitation" />

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search surah name or number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 px-3"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(surah => (
            <Card key={surah.number} className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                {/* Number badge */}
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{surah.number}</span>
                </div>

                {/* Names */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{surah.englishName}</span>
                    <span className="text-base font-arabic text-foreground" dir="rtl">{surah.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{surah.englishNameTranslation}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{surah.numberOfAyahs} verses</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-4 px-1.5 ${surah.revelationType === 'Meccan' ? 'border-warning/60 text-warning' : 'border-info/60 text-info'}`}
                    >
                      {surah.revelationType}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSurah(surah, 'page')}>
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Read pages</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSurah(surah, 'audio')}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Play audio</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">
              No surahs found for "{search}"
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Page viewer ──────────────────────────────────────────────────────────
  if (view === 'page' && selectedSurah) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('list')} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />Back
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground text-balance">
              {selectedSurah.englishName} — <span dir="rtl">{selectedSurah.name}</span>
            </h2>
            <p className="text-xs text-muted-foreground">Page {currentPage} of 604</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { stopAudio(); setView('audio'); }}>
            <Volume2 className="h-4 w-4" />Listen
          </Button>
        </div>

        {/* Page image */}
        <div className="w-full overflow-hidden rounded-lg border border-border bg-card">
          {pageLoading && (
            <Skeleton className="w-full aspect-[3/4] bg-muted" />
          )}
          <img
            key={currentPage}
            src={pageImageUrl(currentPage)}
            alt={`Quran page ${currentPage}`}
            className={`w-full object-contain transition-opacity duration-200 ${pageLoading ? 'opacity-0 h-0' : 'opacity-100'}`}
            onLoadStart={() => setPageLoading(true)}
            onLoad={() => setPageLoading(false)}
            onError={() => setPageLoading(false)}
          />
        </div>

        {/* Page nav */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} / 604</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(604, p + 1))} disabled={currentPage >= 604} className="gap-1.5">
            Next<ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Audio player ─────────────────────────────────────────────────────────
  if (view === 'audio' && selectedSurah) {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <audio
          ref={audioRef}
          onCanPlay={handleCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { stopAudio(); setView('list'); }} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />All Surahs
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={() => { stopAudio(); setView('page'); }}>
            <BookOpen className="h-4 w-4" />Read Pages
          </Button>
        </div>

        {/* Player card */}
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Surah info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Now Playing</p>
              <h2 className="text-xl font-bold text-foreground text-balance">
                {selectedSurah.englishName}
              </h2>
              <p className="text-2xl font-arabic text-foreground" dir="rtl">{selectedSurah.name}</p>
              <p className="text-sm text-muted-foreground">
                Ayah {currentAyah} / {selectedSurah.numberOfAyahs}
              </p>
            </div>

            {/* Reciter selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 w-12">Reciter</span>
              <Select
                value={selectedReciter.id}
                onValueChange={(val) => {
                  const r = RECITERS.find(r => r.id === val);
                  if (r) { setSelectedReciter(r); setIsPlaying(false); }
                }}
              >
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECITERS.map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ayah selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 w-12">Ayah</span>
              <Slider
                min={1}
                max={selectedSurah.numberOfAyahs}
                step={1}
                value={[currentAyah]}
                onValueChange={([v]) => { setCurrentAyah(v); }}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{selectedSurah.numberOfAyahs}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <Slider
                min={0}
                max={100}
                step={0.1}
                value={[progress]}
                onValueChange={seekTo}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(audioRef.current?.currentTime ?? 0)}</span>
                <span>{audioLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatTime(duration)}</span>
              </div>
            </div>

            {/* Main controls */}
            <div className="flex items-center justify-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={prevAyah} className="h-10 w-10">
                    <SkipBack className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous ayah</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={stopAudio} className="h-10 w-10">
                    <Square className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop</TooltipContent>
              </Tooltip>

              <Button
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={togglePlay}
                disabled={audioLoading}
              >
                {audioLoading
                  ? <Loader2 className="h-6 w-6 animate-spin" />
                  : isPlaying
                    ? <Pause className="h-6 w-6" />
                    : <Play className="h-6 w-6 ml-0.5" />
                }
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={nextAyah}>
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next ayah</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRepeat(r => !r)}
                    className={`h-10 w-10 ${isRepeat ? 'text-primary' : ''}`}
                  >
                    <Repeat className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isRepeat ? 'Repeat: On' : 'Repeat: Off'}</TooltipContent>
              </Tooltip>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-muted-foreground shrink-0">Speed</span>
              <div className="flex gap-1 flex-wrap">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                  <Button
                    key={s}
                    variant={speed === s ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setSpeed(s)}
                  >
                    {s}×
                  </Button>
                ))}
              </div>
            </div>

            {/* Surah prev/next */}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                disabled={selectedSurah.number <= 1}
                onClick={() => {
                  const prev = SURAHS.find(s => s.number === selectedSurah.number - 1);
                  if (prev) { stopAudio(); setSelectedSurah(prev); setCurrentAyah(1); }
                }}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {SURAHS.find(s => s.number === selectedSurah.number - 1)?.englishName || ''}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                disabled={selectedSurah.number >= 114}
                onClick={() => {
                  const next = SURAHS.find(s => s.number === selectedSurah.number + 1);
                  if (next) { stopAudio(); setSelectedSurah(next); setCurrentAyah(1); }
                }}
              >
                {SURAHS.find(s => s.number === selectedSurah.number + 1)?.englishName || ''}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ayah list for quick jump */}
        <Card>
          <CardContent className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Jump to Ayah</p>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {Array.from({ length: selectedSurah.numberOfAyahs }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setCurrentAyah(n)}
                  className={`w-7 h-7 rounded text-xs transition-colors ${
                    currentAyah === n
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
