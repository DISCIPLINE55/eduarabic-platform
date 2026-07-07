// Tajweed colorization: splits Arabic text into colored spans
// Based on standard Tajweed rules for Hafs 'an 'Asim recitation

export interface TajweedSpan {
  text: string;
  rule: TajweedRule | null;
}

export type TajweedRule =
  | 'ghunna'       // Nasalization — green
  | 'ikhfa'        // Hiding — blue/teal
  | 'idgham'       // Merging — orange
  | 'iqlab'        // Conversion ن→م — rose
  | 'madd'         // Lengthening — purple
  | 'qalqala'      // Echo — amber
  | 'lam_shamsiya' // Assimilated lam — cyan
  | 'tafkhim'      // Emphatic letters — red-700

// Tajweed rule → Tailwind color class
export const TAJWEED_COLORS: Record<TajweedRule, string> = {
  ghunna:       'text-emerald-600 dark:text-emerald-400',
  ikhfa:        'text-sky-600 dark:text-sky-400',
  idgham:       'text-orange-500 dark:text-orange-400',
  iqlab:        'text-rose-600 dark:text-rose-400',
  madd:         'text-violet-600 dark:text-violet-400',
  qalqala:      'text-amber-600 dark:text-amber-400',
  lam_shamsiya: 'text-cyan-600 dark:text-cyan-400',
  tafkhim:      'text-red-700 dark:text-red-500',
};

export const TAJWEED_LABELS: Record<TajweedRule, string> = {
  ghunna:       'Ghunna',
  ikhfa:        'Ikhfa',
  idgham:       'Idgham',
  iqlab:        'Iqlab',
  madd:         'Madd',
  qalqala:      'Qalqala',
  lam_shamsiya: 'Lam Shamsiya',
  tafkhim:      'Tafkhim',
};

/** Beginner-mode: plain-English explanation for each Tajweed rule */
export const TAJWEED_EXPLANATIONS: Record<TajweedRule, string> = {
  ghunna:
    'Ghunna (Nasalisation) — Hold a nasal "ng" sound for 2 beats through the nose. Occurs on ن or م with a shaddah.',
  ikhfa:
    'Ikhfa (Hiding) — Partially hide the ن sound with a nasal tone for 2 beats before 15 specific letters. Neither full ن nor full merge.',
  idgham:
    'Idgham (Merging) — Merge the ن or tanwin completely into the next letter (ي ن م و ل ر) with a nasal hum for 2 beats.',
  iqlab:
    'Iqlab (Conversion) — Convert ن into a م sound before ب, holding the nasal hum for 2 beats.',
  madd:
    'Madd (Lengthening) — Stretch the vowel sound for 2, 4, or 6 beats. Occurs on ا, و, or ي following a matching vowel.',
  qalqala:
    'Qalqala (Echo) — Produce a slight bounce or echo on ق ط ب ج د when they carry a sukūn (no vowel). Stronger at end of verse.',
  lam_shamsiya:
    'Lam Shamsiya (Sun Letter Lam) — The لـ in اَلـ is silently assimilated into the next letter (one of 14 "sun" letters). Double the following letter instead.',
  tafkhim:
    'Tafkhim (Emphasis) — Pronounce the letter with a heavy, full-mouth tone. Applies to خ ص ض ط ظ غ ق and to الله in certain contexts.',
};

// Arabic Unicode ranges
const SHADDA     = '\u0651';
const SUKUN      = '\u0652';
const TANWIN_F   = '\u064B';
const TANWIN_K   = '\u064D';
const TANWIN_D   = '\u064C';
const FATHA      = '\u064E';
const KASRA      = '\u064F';
const DAMMA      = '\u0650';

// Letters
const NUN        = '\u0646';  // ن
const MEEM       = '\u0645';  // م
const LAM        = '\u0644';  // ل
const ALEF       = '\u0627';  // ا
const WAW        = '\u0648';  // و
const YA         = '\u064A';  // ي
const ALEF_MAD   = '\u0622';  // آ

// Qalqala letters: ق ط ب ج د
const QALQALA_SET = new Set(['\u0642', '\u0637', '\u0628', '\u062C', '\u062F']);

// Tafkhim (emphatic) letters: خ ص ض ط ظ غ ق
const TAFKHIM_SET = new Set(['\u062E', '\u0635', '\u0636', '\u0637', '\u0638', '\u063A', '\u0642']);

// Idgham letters (letters ن merges into when followed by): ي ن م و ل ر
const IDGHAM_SET = new Set(['\u064A', '\u0646', '\u0645', '\u0648', '\u0644', '\u0631']);

// Ikhfa letters (15 letters after ن ساكنة or tanwin)
const IKHFA_SET = new Set([
  '\u062A','\u062B','\u062C','\u062F','\u0630','\u0632','\u0633','\u0634',
  '\u0635','\u0636','\u0637','\u0638','\u0641','\u0642','\u0643',
]);

// Shamsiya letters (lam assimilates)
const SHAMSIYA_SET = new Set([
  '\u062A','\u062B','\u062F','\u0630','\u0631','\u0632','\u0633','\u0634',
  '\u0635','\u0636','\u0637','\u0638','\u0644','\u0646',
]);

/** Strip diacritics for base-letter matching */
function baseLetter(ch: string): string {
  return ch.replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Tokenize Arabic text into TajweedSpan array.
 * Operates character-by-character with limited lookahead.
 */
export function colorizeAyah(text: string): TajweedSpan[] {
  const spans: TajweedSpan[] = [];
  let i = 0;

  const emit = (t: string, rule: TajweedRule | null) => {
    if (!t) return;
    const last = spans[spans.length - 1];
    if (last && last.rule === rule) { last.text += t; return; }
    spans.push({ text: t, rule });
  };

  while (i < text.length) {
    const ch   = text[i];
    const next = text[i + 1] ?? '';
    const next2 = text[i + 2] ?? '';
    const bl   = baseLetter(ch);
    const bl2  = baseLetter(next);

    // ── Madd: ا / و / ي with preceding fatha/damma/kasra ───────────────────
    if ((bl === ALEF || bl === ALEF_MAD || bl === WAW || bl === YA) &&
        (next === '' || baseLetter(next) === '') &&
        spans.length > 0) {
      emit(ch, 'madd');
      i++; continue;
    }

    // ── Qalqala: qalqala letter + sukun ────────────────────────────────────
    if (QALQALA_SET.has(bl) && (next === SUKUN || next2 === SUKUN)) {
      let tok = ch;
      if (next === SUKUN) { tok += next; i++; }
      emit(tok, 'qalqala');
      i++; continue;
    }

    // ── Iqlab: ن + any diacritic + ب ────────────────────────────────────────
    if (bl === NUN && bl2 === MEEM && text.includes('\u0625\u0642\u0644\u0627\u0628')) {
      // Simplified: ن followed by shadda-meem → iqlab context
      emit(ch, 'iqlab'); i++; continue;
    }
    if (bl === NUN && bl2 === '\u0628') {
      emit(ch, 'iqlab'); i++; continue;
    }

    // ── Idgham: ن + (ي ن م و ل ر) with shadda ──────────────────────────────
    if (bl === NUN && IDGHAM_SET.has(bl2) && text[i + 2] === SHADDA) {
      emit(ch, 'idgham'); i++; continue;
    }

    // ── Ikhfa: ن + sukun/tanwin then ikhfa letter ───────────────────────────
    if (bl === NUN && (next === SUKUN || next === TANWIN_F || next === TANWIN_K || next === TANWIN_D)) {
      const afterDiac = baseLetter(text[i + 2] ?? '');
      if (IKHFA_SET.has(afterDiac)) {
        emit(ch, 'ikhfa'); i++; continue;
      }
    }

    // ── Ghunna: ن or م with shadda ──────────────────────────────────────────
    if ((bl === NUN || bl === MEEM) && next === SHADDA) {
      emit(ch + SHADDA, 'ghunna');
      i += 2; continue;
    }
    // Tanwin (any) on any letter → ghunna
    if (next === TANWIN_F || next === TANWIN_K || next === TANWIN_D) {
      emit(ch + next, 'ghunna');
      i += 2; continue;
    }

    // ── Lam Shamsiya: ال + shamsiya letter ──────────────────────────────────
    if (bl === LAM && SHAMSIYA_SET.has(bl2)) {
      emit(ch, 'lam_shamsiya'); i++; continue;
    }

    // ── Tafkhim: emphatic letters ────────────────────────────────────────────
    if (TAFKHIM_SET.has(bl)) {
      emit(ch, 'tafkhim'); i++; continue;
    }

    // Default — plain text
    emit(ch, null);
    i++;
  }

  return spans;
}
