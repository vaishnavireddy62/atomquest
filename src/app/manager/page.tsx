'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [goalSheets, setGoalSheets] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [quarter, setQuarter] = useState<{ [key: string]: number }>({})
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const [editableGoals, setEditableGoals] = useState<{ [key: string]: any[] }>({})

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const r = await fetch('/api/me')
    if (!r.ok) { router.push('/'); return }
    const d = await r.json()
    setUser(d.user)
    const gs = await fetch('/api/manager/goalsheets')
    const gsd = await gs.json()
    setGoalSheets(gsd.goalSheets || [])
  }

  async function approve(id: string) {
  if (editableGoals[id]) {
    await fetch(`/api/manager/goalsheets/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals: editableGoals[id] }),
    })
  } else {
    await fetch(`/api/manager/goalsheets/${id}/approve`, { method: 'POST' })
  }
  setSelected(null); fetchData()
}

  async function returnSheet(id: string) {
    await fetch(`/api/manager/goalsheets/${id}/return`, { method: 'POST' })
    setSelected(null); fetchData()
  }
  function updateEditableGoal(gsId: string, originalGoals: any[], index: number, field: string, value: string) {
  const current = editableGoals[gsId] || originalGoals.map(g => ({ ...g }))
  const updated = current.map((g: any, i: number) => i === index ? { ...g, [field]: value } : g)
  setEditableGoals({ ...editableGoals, [gsId]: updated })
}

  async function addCheckin(gsId: string) {
    if (!comment) { setMsg('Please enter a comment'); return }
    const q = quarter[gsId] || 1
    const res = await fetch('/api/manager/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalSheetId: gsId, quarter: q, comment }),
    })
    if (res.ok) {
      setComment('')
      setMsg('✅ Check-in saved!')
      setTimeout(() => setMsg(''), 3000)
    } else {
      setMsg('❌ Error saving check-in')
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const statusColor: any = { DRAFT: 'bg-gray-100 text-gray-600', SUBMITTED: 'bg-yellow-100 text-yellow-700', APPROVED: 'bg-green-100 text-green-700', RETURNED: 'bg-red-100 text-red-700' }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">AtomQuest — Manager Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-green-200 text-sm">{user?.name}</span>
          <button onClick={logout} className="bg-green-600 px-3 py-1 rounded text-sm hover:bg-green-500">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Goal Sheets</h2>
        {msg && <div className={`px-4 py-2 rounded mb-4 text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}

        {goalSheets.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">No submitted goal sheets from your team yet.</div>
        ) : goalSheets.map((gs: any) => (
          <div key={gs.id} className="bg-white rounded-xl shadow p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">{gs.employee?.name} — {gs.cycleYear}</h3>
                <p className="text-sm text-gray-500">{gs.employee?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[gs.status]}`}>{gs.status}</span>
                <button onClick={() => setSelected(selected?.id === gs.id ? null : gs)} className="text-blue-600 text-sm hover:underline">
                  {selected?.id === gs.id ? 'Close' : 'View Details'}
                </button>
              </div>
            </div>

            {selected?.id === gs.id && (
              <div>
                <table className="w-full text-sm mb-4">
                  <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Thrust Area</th><th className="pb-2">Title</th><th className="pb-2">UoM</th><th className="pb-2">Target</th><th className="pb-2">Weight</th></tr></thead>
                  <tbody>{gs.goals?.map((g: any) => (
                    <tr key={g.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-600">{g.thrustArea}</td>
                      <td className="py-2 font-medium">{g.title}</td>
                      <td className="py-2 text-gray-500">{g.uom}</td>
                      <td className="py-2">{g.target}</td>
                      <td className="py-2">{g.weightage}%</td>
                    </tr>
                  ))}</tbody>
                </table>

                {gs.status === 'SUBMITTED' && (
  <div>
    <h4 className="font-medium text-gray-700 mb-2">Review & Edit Goals</h4>
    <table className="w-full text-sm mb-3">
      <thead><tr className="text-left text-gray-500 border-b">
        <th className="pb-2">Thrust Area</th>
        <th className="pb-2">Title</th>
        <th className="pb-2">Target</th>
        <th className="pb-2">Weight %</th>
      </tr></thead>
      <tbody>{(editableGoals[gs.id] || gs.goals)?.map((g: any, i: number) => (
        <tr key={g.id} className="border-b last:border-0">
          <td className="py-2 text-gray-600">{g.thrustArea}</td>
          <td className="py-2 font-medium">{g.title}</td>
          <td className="py-2">
            <input
              value={editableGoals[gs.id]?.[i]?.target ?? g.target}
              onChange={e => updateEditableGoal(gs.id, gs.goals, i, 'target', e.target.value)}
              className="border rounded px-2 py-1 text-sm w-20"
            />
          </td>
          <td className="py-2">
            <input
              type="number"
              value={editableGoals[gs.id]?.[i]?.weightage ?? g.weightage}
              onChange={e => updateEditableGoal(gs.id, gs.goals, i, 'weightage', e.target.value)}
              className="border rounded px-2 py-1 text-sm w-16"
            />
          </td>
        </tr>
      ))}</tbody>
    </table>
    <div className="flex gap-3">
      <button onClick={() => approve(gs.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">✓ Approve</button>
      <button onClick={() => returnSheet(gs.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">↩ Return for Rework</button>
    </div>
  </div>
)}

                {gs.status === 'APPROVED' && (
  <div className="border-t pt-4">
    {/* Existing check-ins */}
    {gs.checkIns && gs.checkIns.length > 0 && (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Check-in History</h4>
        <div className="space-y-2">
          {gs.checkIns.map((c: any) => (
            <div key={c.id} className="bg-gray-50 rounded px-3 py-2 text-sm">
              <span className="font-medium text-blue-600">Q{c.quarter}</span>
              <span className="text-gray-500 mx-2">—</span>
              <span className="text-gray-700">{c.comment}</span>
              <span className="text-gray-400 text-xs ml-2">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    <h4 className="font-medium text-gray-700 mb-3">Add Check-in Comment</h4>
    <div className="flex gap-3">
      <select
        value={quarter[gs.id] || 1}
        onChange={e => setQuarter({ ...quarter, [gs.id]: Number(e.target.value) })}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value={1}>Q1 (July)</option>
        <option value={2}>Q2 (October)</option>
        <option value={3}>Q3 (January)</option>
        <option value={4}>Q4 (March)</option>
      </select>
      <input
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Enter check-in comment..."
        className="border rounded px-3 py-2 text-sm flex-1"
      />
      <button onClick={() => addCheckin(gs.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
        Save
      </button>
    </div>
  </div>
)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}