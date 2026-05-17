'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [goalSheets, setGoalSheets] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

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
    await fetch(`/api/manager/goalsheets/${id}/approve`, { method: 'POST' })
    setSelected(null); fetchData()
  }

  async function returnSheet(id: string) {
    await fetch(`/api/manager/goalsheets/${id}/return`, { method: 'POST' })
    setSelected(null); fetchData()
  }

  async function addCheckin(gsId: string, quarter: number) {
    if (!comment) { setMsg('Please enter a comment'); return }
    await fetch('/api/manager/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalSheetId: gsId, quarter, comment }),
    })
    setComment(''); setMsg('Check-in saved!'); setTimeout(() => setMsg(''), 3000)
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
        {msg && <div className="bg-green-50 text-green-700 px-4 py-2 rounded mb-4 text-sm">{msg}</div>}

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
                  <div className="flex gap-3 mb-4">
                    <button onClick={() => approve(gs.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">✓ Approve</button>
                    <button onClick={() => returnSheet(gs.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">↩ Return for Rework</button>
                  </div>
                )}

                {gs.status === 'APPROVED' && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Add Check-in Comment</h4>
                    <div className="flex gap-3">
                      <select className="border rounded px-3 py-2 text-sm" id={`q-${gs.id}`}>
                        <option value="1">Q1</option><option value="2">Q2</option><option value="3">Q3</option><option value="4">Q4</option>
                      </select>
                      <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Enter check-in comment..." className="border rounded px-3 py-2 text-sm flex-1" />
                      <button onClick={() => addCheckin(gs.id, Number((document.getElementById(`q-${gs.id}`) as HTMLSelectElement).value))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Save</button>
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