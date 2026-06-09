'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { can, permissionsFor, ALL_PERMISSIONS, PERMISSION_LABELS } from '@/lib/permissionService'
import { ROLE_KEYS, roleLabel } from '@/lib/roleService'
import { Icon } from '@/components/ui/icon'

export default function RolesPage() {
  const me = useStore(s => s.currentUser)
  const allowed = can(me.roleKey, 'manage_roles')

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)', maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, fontSize: 12.5 }}>
        <Link href="/settings" className="bf-btn bf-btn-sm bf-btn-ghost" style={{ textDecoration: 'none' }}>
          <Icon name="arrowLeft" size={14} />Settings
        </Link>
        <Icon name="chevRight" size={13} style={{ color: 'var(--bf-text-faint)' }} />
        <span style={{ color: 'var(--bf-text-faint)' }}>Roles & permissions</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Roles &amp; permissions</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>
          What each role can do. Assign roles to people on the <Link href="/settings/users" style={{ color: 'var(--bf-accent-text)' }}>Users</Link> page.
        </p>
      </div>

      {!allowed && (
        <div style={{ fontSize: 12.5, color: 'var(--bf-text-faint)', marginBottom: 12 }}>
          You can view roles, but only an Admin can change role assignments.
        </div>
      )}

      <div className="bf-card" style={{ overflow: 'auto' }}>
        <table className="bf-tbl" style={{ minWidth: 920 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: 16, position: 'sticky', left: 0, background: 'var(--bf-surface)' }}>Permission</th>
              {ROLE_KEYS.map(rk => (
                <th key={rk} style={{ textAlign: 'center', whiteSpace: 'nowrap', fontSize: 11.5 }}>{roleLabel(rk)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map(p => (
              <tr key={p}>
                <td style={{ paddingLeft: 16, fontSize: 12.5, fontWeight: 550, position: 'sticky', left: 0, background: 'var(--bf-surface)', whiteSpace: 'nowrap' }}>{PERMISSION_LABELS[p]}</td>
                {ROLE_KEYS.map(rk => {
                  const has = permissionsFor(rk).includes(p)
                  return (
                    <td key={rk} style={{ textAlign: 'center' }}>
                      {has
                        ? <Icon name="check" size={15} style={{ color: 'var(--bf-good)' }} />
                        : <span style={{ color: 'var(--bf-text-faint)' }}>·</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
