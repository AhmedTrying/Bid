'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { can } from '@/lib/permissionService'
import { ROLE_KEYS, roleLabel } from '@/lib/roleService'
import { TEAM_GROUPS } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import type { AuthUser, RoleKey, TeamGroup } from '@/lib/types'

export default function UsersPage() {
  const me    = useStore(s => s.currentUser)
  const theme = useStore(s => s.theme)
  const flash = useStore(s => s.flash)
  const allowed = can(me.roleKey, 'manage_users')

  const [users, setUsers] = useState<AuthUser[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', roleKey: 'tender_coordinator' as RoleKey, group: 'Proposal Team' as TeamGroup, password: 'bidflow123' })

  const load = async () => {
    try { const r = await fetch('/api/users'); const j = await r.json(); setUsers(j.users ?? []) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  if (!allowed) return <NoAccess />

  const patch = async (id: string, body: Record<string, unknown>) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, ...(body.roleKey ? { roleKey: body.roleKey as RoleKey, roleTitle: roleLabel(body.roleKey as string) } : {}), ...(body.active !== undefined ? { active: body.active as boolean } : {}), ...(body.group ? { group: body.group as TeamGroup } : {}) } : u))
    try { await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) } catch { /* */ }
    flash('User updated')
  }
  const remove = async (id: string) => {
    if (!confirm('Remove this user?')) return
    setUsers(us => us.filter(u => u.id !== id))
    try { await fetch(`/api/users/${id}`, { method: 'DELETE' }) } catch { /* */ }
    flash('User removed')
  }
  const create = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    try {
      await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      flash('User added')
    } catch { /* */ }
    setAdding(false); setForm({ ...form, name: '', email: '' })
    load()
  }

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)', maxWidth: 880 }}>
      <Breadcrumb label="Users" />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Users</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Manage who can access the workspace and what they can do.</p>
        </div>
        <button className="bf-btn bf-btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setAdding(a => !a)}>
          <Icon name="plus" size={16} />Add user
        </button>
      </div>

      {adding && (
        <div className="bf-card bf-card-pad" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="bf-field"><span>Name</span><input className="bf-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="bf-field"><span>Email</span><input className="bf-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label className="bf-field"><span>Role</span>
            <select className="bf-select" value={form.roleKey} onChange={e => setForm({ ...form, roleKey: e.target.value as RoleKey })}>
              {ROLE_KEYS.map(k => <option key={k} value={k}>{roleLabel(k)}</option>)}
            </select></label>
          <label className="bf-field"><span>Team group</span>
            <select className="bf-select" value={form.group} onChange={e => setForm({ ...form, group: e.target.value as TeamGroup })}>
              {TEAM_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select></label>
          <label className="bf-field" style={{ gridColumn: '1 / -1' }}><span>Temporary password</span><input className="bf-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="bf-btn" onClick={() => setAdding(false)}>Cancel</button>
            <button className="bf-btn bf-btn-primary" onClick={create}>Create user</button>
          </div>
        </div>
      )}

      <div className="bf-card" style={{ overflow: 'hidden' }}>
        <table className="bf-tbl" style={{ width: '100%' }}>
          <thead><tr>
            <th style={{ paddingLeft: 16 }}>User</th><th>Role</th><th>Group</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ paddingLeft: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar person={u.id} size={28} theme={theme} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--bf-text-faint)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <select className="bf-select" value={u.roleKey} onChange={e => patch(u.id, { roleKey: e.target.value })} style={{ height: 32, fontSize: 12.5 }}>
                    {ROLE_KEYS.map(k => <option key={k} value={k}>{roleLabel(k)}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12.5, color: 'var(--bf-text-2)' }}>{u.group || '—'}</td>
                <td>
                  <button className="bf-btn bf-btn-sm" onClick={() => patch(u.id, { active: !u.active })}
                    style={{ color: u.active ? 'var(--bf-good)' : 'var(--bf-text-faint)' }}>
                    <Icon name={u.active ? 'checkCircle' : 'x'} size={13} />{u.active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td style={{ textAlign: 'right', paddingRight: 12 }}>
                  {u.id !== me.id && (
                    <button className="bf-btn bf-btn-icon bf-btn-ghost" title="Remove" onClick={() => remove(u.id)}>
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Breadcrumb({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, fontSize: 12.5 }}>
      <Link href="/settings" className="bf-btn bf-btn-sm bf-btn-ghost" style={{ textDecoration: 'none' }}>
        <Icon name="arrowLeft" size={14} />Settings
      </Link>
      <Icon name="chevRight" size={13} style={{ color: 'var(--bf-text-faint)' }} />
      <span style={{ color: 'var(--bf-text-faint)' }}>{label}</span>
    </div>
  )
}

function NoAccess() {
  return (
    <div className="bf-canvas-pad" style={{ maxWidth: 880 }}>
      <Breadcrumb label="Users" />
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bf-text-faint)' }}>
        <Icon name="shield" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
        <div style={{ fontWeight: 700, fontSize: 15 }}>You don’t have access to manage users</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Ask an Admin if you need access.</div>
      </div>
    </div>
  )
}
