'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null)
  const [goalSheets, setGoalSheets] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [goals, setGoals] = useState([{ thrustArea: '', title: '', description: '', uom: 'NUMERIC_MIN', target: '', weightage: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [activeCheckin, setActiveCheckin] = useState<{ sheetId: string, quarter: number } | null>(null)
  const [achievements, setAchievements] = useState<any>({})
  const [checkinMsg, setCheckinMsg] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const r = await fetch('/api/me')
    if (!r.ok) { router.push('/'); return }
    const d = await r.json()
    setUser(d.user)
    const gs = await fetch('/api/goalsheets')
    const gsd = await gs.json()
    setGoalSheets(gsd.goalSheets || [])
  }

  function addGoal() {
    if (goals.length >= 8) { setMsg('Maximum 8 goals allowed'); return }
    setGoals([...goals, { thrustArea: '', title: '', description: '', uom: 'NUMERIC_MIN', target: '', weightage: '' }])
  }

  function removeGoal(i: number) {
    setGoals(goals.filter((_, idx) => idx !== i))
  }

  function updateGoal(i: number, field: string, value: string) {
    setGoals(goals.map((g, idx) => idx === i ? { ...g, [field]: value } : g))
  }

  async function submitGoals() {
    setMsg('')
    const totalWeight = goals.reduce((s, g) => s + Number(g.weightage), 0)
    if (totalWeight !== 100) { setMsg('Total weightage must equal 100%'); return }
    if (goals.some(g => Number(g.weightage) < 10)) { setMsg('Each goal must have at least 10% weightage'); return }
    if (goals.some(g => !g.title || !g.thrustArea || !g.target)) { setMsg('Please fill all required fields'); return }
    setSubmitting(true)
    const res = await fetch('/api/goalsheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals }),
    })
    setSubmitting(false)
    if (res.ok) { setShowForm(false); setGoals([{ thrustArea: '', title: '', description: '', uom: 'NUMERIC_MIN', target: '', weightage: '' }]); fetchData() }
    else { const d = await res.json(); setMsg(d.error || 'Error submitting') }
  }

  function openCheckin(sheetId: string, quarter: number, gs: any) {
    setActiveCheckin({ sheetId, quarter })
    setCheckinMsg('')
    const init: any = {}
    gs.goals.forEach((g: any) => {
      const existing = g.achievements?.find((a: any) => a.quarter === quarter)
      init[g.id] = { actual: existing?.actual || '', status: existing?.status || 'NOT_STARTED' }
    })
    setAchievements(init)
  }

  async function saveAchievements() {
    if (!activeCheckin) return
    setCheckinMsg('')
    const payload = Object.entries(achievements).map(([goalId, val]: any) => ({ goalId, actual: val.actual, status: val.status }))
    const res = await fetch(`/api/goalsheets/${activeCheckin.sheetId}/achievements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quarter: activeCheckin.quarter, achievements: payload }),
    })
    if (res.ok) { setCheckinMsg('✅ Saved successfully!'); fetchData() }
    else { const d = await res.json(); setCheckinMsg('❌ ' + (d.error || 'Error saving')) }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const statusColor: any = { DRAFT: 'bg-gray-100 text-gray-600', SUBMITTED: 'bg-yellow-100 text-yellow-700', APPROVED: 'bg-green-100 text-green-700', RETURNED: 'bg-red-100 text-red-700' }
  const quarters = [{ q: 1, label: 'Q1 (July)' }, { q: 2, label: 'Q2 (October)' }, { q: 3, label: 'Q3 (January)' }, { q: 4, label: 'Q4 (March)' }]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">AtomQuest — Employee Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm">{user?.name}</span>
          <button onClick={logout} className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-500">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Goal Sheets</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
            {showForm ? 'Cancel' : '+ New Goal Sheet'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create Goal Sheet</h3>
            {msg && <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">{msg}</div>}
            {goals.map((g, i) => (
              <div key={i} className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Goal {i + 1}</span>
                  {goals.length > 1 && <button onClick={() => removeGoal(i)} className="text-red-500 text-sm">Remove</button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Thrust Area *" value={g.thrustArea} onChange={e => updateGoal(i, 'thrustArea', e.target.value)} className="border rounded px-3 py-2 text-sm" />
                  <input placeholder="Goal Title *" value={g.title} onChange={e => updateGoal(i, 'title', e.target.value)} className="border rounded px-3 py-2 text-sm" />
                  <input placeholder="Description" value={g.description} onChange={e => updateGoal(i, 'description', e.target.value)} className="border rounded px-3 py-2 text-sm col-span-2" />
                  <select value={g.uom} onChange={e => updateGoal(i, 'uom', e.target.value)} className="border rounded px-3 py-2 text-sm">
                    <option value="NUMERIC_MIN">Numeric (Higher is better)</option>
                    <option value="NUMERIC_MAX">Numeric (Lower is better)</option>
                    <option value="TIMELINE">Timeline</option>
                    <option value="ZERO">Zero-based</option>
                  </select>
                  <input placeholder="Target *" value={g.target} onChange={e => updateGoal(i, 'target', e.target.value)} className="border rounded px-3 py-2 text-sm" />
                  <input placeholder="Weightage % *" type="number" value={g.weightage} onChange={e => updateGoal(i, 'weightage', e.target.value)} className="border rounded px-3 py-2 text-sm" />
                </div>
              </div>
            ))}
            <div className="flex gap-3 mt-2">
              <button onClick={addGoal} className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">+ Add Goal</button>
              <button onClick={submitGoals} disabled={submitting} className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Total weightage: {goals.reduce((s, g) => s + Number(g.weightage || 0), 0)}% (must be 100%)</p>
          </div>
        )}

        {goalSheets.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">No goal sheets yet. Create one to get started.</div>
        ) : goalSheets.map((gs: any) => (
          <div key={gs.id} className="bg-white rounded-xl shadow p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Goal Sheet — {gs.cycleYear}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[gs.status]}`}>{gs.status}</span>
            </div>
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

            {/* Quarterly Check-in buttons - only for APPROVED sheets */}
            {gs.status === 'APPROVED' && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quarterly Achievement Updates:</p>
                <div className="flex gap-2 flex-wrap">
                  {quarters.map(({ q, label }) => {
                    const hasData = gs.goals?.some((g: any) => g.achievements?.some((a: any) => a.quarter === q))
                    return (
                      <button key={q} onClick={() => openCheckin(gs.id, q, gs)}
                        className={`px-3 py-1 rounded text-sm font-medium ${hasData ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 border border-gray-300'} hover:opacity-80`}>
                        {label} {hasData ? '✓' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Achievement Entry Form */}
            {activeCheckin?.sheetId === gs.id && (
              <div className="mt-4 border rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-3">
                  {quarters.find(q => q.q === activeCheckin.quarter)?.label} — Achievement Update
                </h4>
                {checkinMsg && <div className={`px-3 py-2 rounded text-sm mb-3 ${checkinMsg.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{checkinMsg}</div>}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Goal</th>
                      <th className="pb-2">Target</th>
                      <th className="pb-2">Actual</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gs.goals?.map((g: any) => {
                      const existing = g.achievements?.find((a: any) => a.quarter === activeCheckin.quarter)
                      return (
                        <tr key={g.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">{g.title}</td>
                          <td className="py-2 text-gray-500">{g.target}</td>
                          <td className="py-2">
                            <input value={achievements[g.id]?.actual || ''} onChange={e => setAchievements({ ...achievements, [g.id]: { ...achievements[g.id], actual: e.target.value } })}
                              className="border rounded px-2 py-1 text-sm w-24" placeholder="Actual" />
                          </td>
                          <td className="py-2">
                            <select value={achievements[g.id]?.status || 'NOT_STARTED'} onChange={e => setAchievements({ ...achievements, [g.id]: { ...achievements[g.id], status: e.target.value } })}
                              className="border rounded px-2 py-1 text-sm">
                              <option value="NOT_STARTED">Not Started</option>
                              <option value="ON_TRACK">On Track</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </td>
                          <td className="py-2 text-gray-500">{existing?.score != null ? `${existing.score.toFixed(0)}%` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="flex gap-2 mt-3">
                  <button onClick={saveAchievements} className="bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-800">Save Achievement</button>
                  <button onClick={() => setActiveCheckin(null)} className="border px-4 py-2 rounded text-sm hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}