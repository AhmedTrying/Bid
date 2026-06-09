// BidFlow Tracker — Saved Views helpers (Fix 1)

import type { SavedView } from './types'

/** Saved views available to a user on a given page (their own + shared), ordered. */
export function viewsForRoute(views: SavedView[], route: string, userId: string): SavedView[] {
  return views
    .filter(v => v.route === route && (v.userId === userId || v.isShared))
    .sort((a, b) => a.order - b.order)
}
