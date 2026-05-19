'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [goalSheets, setGoalSheets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [tab, setTab] = useState('overview')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const r = await fetch('/api/me')
    if (!r.ok) { router.push('/'); return }
    const d = await r.json()
    setUser(d.user)
    const gs = await fetch('/api/admin/goalsheets')
    const gsd = await gs.json()
    setGoalSheets(gsd.goalSheets || [])
    const us = await fetch('/api/admin/users')
    const usd = await us.json()
    setUsers(usd.users || [])
  }

  async function exportCSV() {
    const res = await fetch('/api/admin/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'achievement-report.csv'; a.click()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const approved = goalSheets.filter(gs => gs.status === 'APPROVED').length
  const submitted = goalSheets.filter(gs => gs.status === 'SUBMITTED').length
  const total = goalSheets.length
  const statusColor: any = { DRAFT: 'bg-gray-100 text-gray-600', SUBMITTED: 'bg-yellow-100 text-yellow-700', APPROVED: 'bg-green-100 text-green-700', RETURNED: 'bg-red-100 text-red-700' }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-purple-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">AtomQuest — Admin Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-purple-200 text-sm">{user?.name}</span>
          <button onClick={logout} className="bg-purple-600 px-3 py-1 rounded text-sm hover:bg-purple-500">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-3 mb-6">
          {['overview', 'goalsheets', 'users'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-purple-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>{t}</button>
          ))}
          <button onClick={exportCSV} className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">⬇ Export CSV</button>
        </div>

        {tab === 'overview' && (
  <div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <p className="text-3xl font-bold text-blue-700">{total}</p>
        <p className="text-gray-500 text-sm mt-1">Total Goal Sheets</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <p className="text-3xl font-bold text-green-600">{approved}</p>
        <p className="text-gray-500 text-sm mt-1">Approved</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <p className="text-3xl font-bold text-yellow-500">{submitted}</p>
        <p className="text-gray-500 text-sm mt-1">Pending Approval</p>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Completion Dashboard</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2">Employee</th>
            <th className="pb-2">Manager</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Goals</th>
            <th className="pb-2">Q1</th>
            <th className="pb-2">Q2</th>
            <th className="pb-2">Q3</th>
            <th className="pb-2">Q4</th>
            <th className="pb-2">Check-ins</th>
          </tr>
        </thead>
        <tbody>{goalSheets.map((gs: any) => {
          const hasQ = (q: number) => gs.goals?.some((g: any) => g.achievements?.some((a: any) => a.quarter === q))
          const checkinCount = gs.checkIns?.length || 0
          return (
            <tr key={gs.id} className="border-b last:border-0">
              <td className="py-2 font-medium">{gs.employee?.name}</td>
              <td className="py-2 text-gray-500">{gs.employee?.manager?.name || '—'}</td>
              <td className="py-2"><span className={`px-2 py-1 rounded-full text-xs ${statusColor[gs.status]}`}>{gs.status}</span></td>
              <td className="py-2">{gs.goals?.length || 0}</td>
              <td className="py-2">{gs.status === 'APPROVED' ? (hasQ(1) ? '✅' : '⬜') : '—'}</td>
              <td className="py-2">{gs.status === 'APPROVED' ? (hasQ(2) ? '✅' : '⬜') : '—'}</td>
              <td className="py-2">{gs.status === 'APPROVED' ? (hasQ(3) ? '✅' : '⬜') : '—'}</td>
              <td className="py-2">{gs.status === 'APPROVED' ? (hasQ(4) ? '✅' : '⬜') : '—'}</td>
              <td className="py-2"><span className={`px-2 py-1 rounded text-xs ${checkinCount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{checkinCount} comments</span></td>
            </tr>
          )
        })}</tbody>
      </table>
    </div>
  </div>
)}

        {tab === 'goalsheets' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">All Goal Sheets</h3>
            {goalSheets.map((gs: any) => (
              <div key={gs.id} className="border rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{gs.employee?.name} <span className="text-gray-400 text-sm">({gs.employee?.email})</span></p>
                    <p className="text-sm text-gray-500">{gs.goals?.length} goals · {gs.cycleYear}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[gs.status]}`}>{gs.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">All Users</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2">Manager</th></tr></thead>
              <tbody>{users.map((u: any) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{u.name}</td>
                  <td className="py-2 text-gray-500">{u.email}</td>
                  <td className="py-2"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{u.role}</span></td>
                  <td className="py-2 text-gray-500">{u.manager?.name || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}