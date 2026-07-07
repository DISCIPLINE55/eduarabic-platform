// Shared password policy validator
// Policy is fetched from DB (app_settings.password_policy) or falls back to defaults

export interface PasswordPolicy {
  min_length: number;
  max_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_number: boolean;
  require_special: boolean;
}

export const DEFAULT_POLICY: PasswordPolicy = {
  min_length: 8,
  max_length: 128,
  require_uppercase: true,
  require_lowercase: true,
  require_number: true,
  require_special: false,
};

export interface PolicyViolation {
  rule: string;
  message: string;
  passed: boolean;
}

export function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_POLICY): PolicyViolation[] {
  return [
    {
      rule: 'min_length',
      message: `At least ${policy.min_length} characters`,
      passed: password.length >= policy.min_length,
    },
    {
      rule: 'max_length',
      message: `No more than ${policy.max_length} characters`,
      passed: password.length <= policy.max_length,
    },
    ...(policy.require_uppercase ? [{
      rule: 'require_uppercase',
      message: 'At least one uppercase letter (A–Z)',
      passed: /[A-Z]/.test(password),
    }] : []),
    ...(policy.require_lowercase ? [{
      rule: 'require_lowercase',
      message: 'At least one lowercase letter (a–z)',
      passed: /[a-z]/.test(password),
    }] : []),
    ...(policy.require_number ? [{
      rule: 'require_number',
      message: 'At least one number (0–9)',
      passed: /[0-9]/.test(password),
    }] : []),
    ...(policy.require_special ? [{
      rule: 'require_special',
      message: 'At least one special character (!@#$%^&*…)',
      passed: /[^A-Za-z0-9]/.test(password),
    }] : []),
  ];
}

export function isPasswordValid(password: string, policy: PasswordPolicy = DEFAULT_POLICY): boolean {
  return validatePassword(password, policy).every(v => v.passed);
}

/** Hook-friendly: fetches policy from Supabase once */
import { supabase } from '@/db/supabase';

export async function fetchPasswordPolicy(): Promise<PasswordPolicy> {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'password_policy')
      .single();
    if (data?.value) return { ...DEFAULT_POLICY, ...(data.value as Partial<PasswordPolicy>) };
  } catch { /* ignore */ }
  return DEFAULT_POLICY;
}
