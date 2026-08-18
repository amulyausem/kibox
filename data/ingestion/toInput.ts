import { addDaysIso } from '@/domain/dates';
import type { NewItemInput } from '@/domain/types';
import type { CandidateItem } from '../repositories';

export function candidateToInput(
  candidate: CandidateItem,
  now: Date,
  status: NewItemInput['status'],
): NewItemInput {
  return {
    name: candidate.name,
    category: candidate.category,
    quantity: candidate.quantity,
    unit: candidate.unit,
    location: candidate.location,
    expiresAt:
      candidate.expiresInDays != null ? addDaysIso(now, candidate.expiresInDays) : undefined,
    source: candidate.source,
    status,
    confidence: status === 'suggested' ? candidate.confidence : undefined,
    barcode: candidate.barcode,
  };
}
