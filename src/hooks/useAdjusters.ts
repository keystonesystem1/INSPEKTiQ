'use client';

import { demoAdjusters } from '@/lib/utils/demo-data';

export function useAdjusters() {
  return { adjusters: demoAdjusters };
}
