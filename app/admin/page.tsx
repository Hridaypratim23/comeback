'use client'

import { useStore, localDateStr } from '@/lib/store'

export default function AdminPage() {
  const { setStepsForDate, dayLogs } = useStore()

  const yesterday = localDateStr(new Date(Date.now() - 86400000))
  const yesterdaySteps = dayLogs[yesterday]?.steps ?? 0

  function fixYesterdaySteps() {
    setStepsForDate(yesterday, 10001)
    alert(`Set ${yesterday} steps to 10,001`)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-[#FF2800]">DATA FIX</h1>
      <div className="text-sm text-[#EDEDF0]/60">
        Yesterday: <span className="text-white font-mono">{yesterday}</span>
      </div>
      <div className="text-sm text-[#EDEDF0]/60">
        Current steps: <span className="text-white font-mono">{yesterdaySteps.toLocaleString()}</span>
      </div>
      <button
        onClick={fixYesterdaySteps}
        className="w-full py-3 bg-[#FF2800] text-white font-bold rounded-lg"
      >
        SET YESTERDAY TO 10,001 STEPS
      </button>
    </div>
  )
}
