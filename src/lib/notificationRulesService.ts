// BidFlow Tracker — Notification rules (Feature 3)
//
// Defines which field changes are "major" (trigger the Important-Change modal)
// and whether the editor may save without sending an email. Editable in
// Settings → Notification rules; persisted via /api/notification-rules.

import type { NotificationRule } from './types'
import { isMajorChange } from './changeHistoryService'

export const DEFAULT_NOTIFICATION_RULES: NotificationRule[] = [
  { id: 'nr-bidDue',           field: 'bidDue',               label: 'Bid due date changed',        isMajor: true,  allowSkipEmail: true  },
  { id: 'nr-qDeadline',        field: 'qDeadline',            label: 'Question deadline changed',   isMajor: true,  allowSkipEmail: true  },
  { id: 'nr-status',           field: 'status',               label: 'Status changed (Submitted / Awarded / Closed)', isMajor: true, allowSkipEmail: false },
  { id: 'nr-result',           field: 'result',               label: 'Result changed',              isMajor: true,  allowSkipEmail: false },
  { id: 'nr-closedReason',     field: 'closedReasonCategory', label: 'Closed / Lost reason changed', isMajor: true, allowSkipEmail: false },
  { id: 'nr-bondPct',          field: 'bondPct',              label: 'Bid bond percentage changed', isMajor: true,  allowSkipEmail: true  },
  { id: 'nr-bondValidity',     field: 'bondValidity',         label: 'Bid bond expiry changed',     isMajor: true,  allowSkipEmail: true  },
  { id: 'nr-bondValidityDays', field: 'bondValidityDays',     label: 'Bid bond validity changed',   isMajor: true,  allowSkipEmail: true  },
  { id: 'nr-owner',            field: 'owner',                label: 'Owner removed / unassigned',  isMajor: true,  allowSkipEmail: true  },
]

/** Build an isMajorField predicate from the active rules.
 *  A rule's `isMajor` overrides the code default for that field; fields without a
 *  rule keep the built-in classification. */
export function ruleMajorPredicate(rules: NotificationRule[]) {
  const map = new Map(rules.map(r => [r.field, r.isMajor]))
  return (field: string, newValue: unknown): boolean => {
    if (map.has(field)) {
      if (!map.get(field)) return false
      // rule enables it; still respect value-sensitive logic for status/owner
      if (field === 'status' || field === 'owner') return isMajorChange(field, newValue)
      return true
    }
    return isMajorChange(field, newValue)
  }
}

/** Whether "Save without email" may be offered for any of the given fields. */
export function allowSkipEmailFor(rules: NotificationRule[], fields: string[]): boolean {
  return fields.some(f => rules.find(r => r.field === f)?.allowSkipEmail)
}
