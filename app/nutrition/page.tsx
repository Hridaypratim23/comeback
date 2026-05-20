'use client'

import { useState, useEffect } from 'react'
import { useStore, TARGETS, CustomMealTemplate } from '@/lib/store'
import { QUICK_MEALS } from '@/constants/workouts'
import { Plus, X, Search, Bookmark, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const TDEE = 2400
const GOAL_DEFICIT = 457

type Tab = 'my-meals' | 'quick-add' | 'create'

function MacroRing({ val, max, color, label, unit = 'g' }: { val: number; max: number; color: string; label: string; unit?: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const pct = Math.min(val / max, 1)
  const offset = circ * (1 - pct)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1E1E26" strokeWidth="4" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black text-[#EDEDF0] leading-none">{val}</span>
          <span className="text-[8px] text-[#686870]">{unit}</span>
        </div>
      </div>
      <span className="text-[9px] font-black tracking-widest text-[#686870]">{label}</span>
      <span className="text-[9px] text-[#686870]">/{max}{unit}</span>
    </div>
  )
}

const emptyForm = { name: '', calories: '', protein: '', carbs: '', fat: '', fibre: '' }

export default function NutritionPage() {
  const { dayLogs, addMeal, removeMeal, getOrCreateToday, customMeals, saveCustomMeal, deleteCustomMeal } = useStore()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<Tab>('my-meals')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)
  const [mealsOpen, setMealsOpen] = useState(true)

  // serving size dialog after CREATE
  const [showServingDialog, setShowServingDialog] = useState(false)
  const [pendingMeal, setPendingMeal] = useState<Omit<CustomMealTemplate, 'id'> | null>(null)

  // serving size slider when logging
  const [servingMeal, setServingMeal] = useState<CustomMealTemplate | null>(null)
  const [servingGrams, setServingGrams] = useState(100)

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
  }, [getOrCreateToday])

  useEffect(() => {
    if (mounted && customMeals.length === 0) setTab('quick-add')
  }, [mounted, customMeals.length])

  if (!mounted) return null

  const today = new Date().toISOString().split('T')[0]
  const dayLog = dayLogs[today]
  const meals = dayLog?.meals ?? []
  const totalCal   = meals.reduce((s, m) => s + m.calories, 0)
  const totalPro   = meals.reduce((s, m) => s + m.protein, 0)
  const totalCarb  = meals.reduce((s, m) => s + m.carbs, 0)
  const totalFat   = meals.reduce((s, m) => s + m.fat, 0)
  const totalFibre = meals.reduce((s, m) => s + (m.fibre ?? 0), 0)
  const calPct     = Math.min((totalCal / TARGETS.calories) * 100, 100)
  const remaining  = TARGETS.calories - totalCal
  const difference = TDEE - totalCal
  const isDeficit  = difference >= 0

  const filteredQuick  = QUICK_MEALS.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
  const filteredCustom = customMeals.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  const submitCreate = () => {
    const name = form.name.trim()
    const cal  = parseFloat(form.calories) || 0
    if (!name || cal === 0) return
    setPendingMeal({
      name,
      calories: cal,
      protein: parseFloat(form.protein) || 0,
      carbs:   parseFloat(form.carbs)   || 0,
      fat:     parseFloat(form.fat)     || 0,
      fibre:   parseFloat(form.fibre)   || 0,
    })
    setShowServingDialog(true)
  }

  const confirmServingDialog = (withServing: boolean) => {
    if (!pendingMeal) return
    saveCustomMeal({ ...pendingMeal, servingSize: withServing })
    setShowServingDialog(false)
    setPendingMeal(null)
    setForm(emptyForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const openServingSlider = (m: CustomMealTemplate) => {
    setServingMeal(m)
    setServingGrams(100)
  }

  const logServingMeal = () => {
    if (!servingMeal) return
    const ratio = servingGrams / 50
    addMeal({
      name:     `${servingMeal.name} (${servingGrams}g)`,
      calories: Math.round(servingMeal.calories * ratio),
      protein:  Math.round(servingMeal.protein  * ratio),
      carbs:    Math.round(servingMeal.carbs    * ratio),
      fat:      Math.round(servingMeal.fat      * ratio),
      fibre:    Math.round((servingMeal.fibre ?? 0) * ratio),
    })
    setServingMeal(null)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'my-meals',  label: 'MY MEALS' },
    { key: 'quick-add', label: 'QUICK ADD' },
    { key: 'create',    label: '+ CREATE' },
  ]

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black tracking-[0.35em] text-[#686870]">DAILY FUEL</p>
        <h1 className="text-3xl font-black text-[#EDEDF0] leading-none mt-0.5">NUTRITION</h1>
      </div>

      {/* Calorie Bar */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-4xl font-black text-[#EDEDF0] leading-none">{totalCal}</div>
            <div className="text-[10px] text-[#686870] mt-0.5">/ {TARGETS.calories} kcal</div>
          </div>
          <div className={`text-right ${remaining < 0 ? 'text-[#FF2800]' : 'text-[#686870]'}`}>
            <div className="text-lg font-black">{Math.abs(remaining)}</div>
            <div className="text-[10px]">{remaining < 0 ? 'OVER' : 'LEFT'}</div>
          </div>
        </div>
        <div className="h-3 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${calPct >= 100 ? 'bg-[#FF2800]' : 'bg-gradient-to-r from-[#1DB954] to-[#D4A017]'}`}
               style={{ width: `${calPct}%` }} />
        </div>
        <div className="mt-3 pt-3 border-t border-[#1E1E26] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#686870]">TDEE ESTIMATE</span>
            <span className="text-[10px] font-black text-[#686870]">{TDEE} kcal</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#686870]">{isDeficit ? 'DEFICIT' : 'SURPLUS'}</span>
            <span className="text-[11px] font-black" style={{ color: isDeficit ? '#1DB954' : '#FF5500' }}>
              {isDeficit ? '-' : '+'}{Math.abs(difference)} kcal
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#686870]">GOAL</span>
            <span className="text-[10px] font-black text-[#2196F3]">-{GOAL_DEFICIT} kcal/day → 15% BF</span>
          </div>
        </div>
      </div>

      {/* Macro Rings */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">MACROS</div>
        <div className="flex justify-around">
          <MacroRing val={totalPro}   max={TARGETS.protein} color="#FF2800" label="PROTEIN" />
          <MacroRing val={totalCarb}  max={TARGETS.carbs}   color="#FF5500" label="CARBS" />
          <MacroRing val={totalFat}   max={TARGETS.fat}     color="#D4A017" label="FAT" />
          <MacroRing val={totalFibre} max={TARGETS.fibre}   color="#1DB954" label="FIBRE" />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-[#0D0D10] border border-[#1E1E26] rounded-xl p-1 gap-1">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all cursor-pointer
              ${tab === key
                ? key === 'create' ? 'bg-[#FF2800] text-white' : 'bg-[#111116] text-[#EDEDF0] border border-[#2C2C38]'
                : 'text-[#686870] hover:text-[#EDEDF0]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search (for my-meals + quick-add tabs) */}
      {(tab === 'my-meals' || tab === 'quick-add') && (
        <div className="flex items-center gap-2 bg-[#111116] border border-[#1E1E26] rounded-xl px-3 py-2.5">
          <Search size={14} className="text-[#686870] flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'my-meals' ? 'Search your meals...' : 'Search quick meals...'}
            className="flex-1 bg-transparent text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none" />
          {search && (
            <button onClick={() => setSearch('')} className="cursor-pointer">
              <X size={13} className="text-[#686870]" />
            </button>
          )}
        </div>
      )}

      {/* MY MEALS tab */}
      {tab === 'my-meals' && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
          {filteredCustom.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Bookmark size={28} className="mx-auto text-[#2C2C38]" />
              <div className="text-xs font-black text-[#686870]">NO SAVED MEALS YET</div>
              <div className="text-[10px] text-[#2C2C38]">Create your first meal in the CREATE tab</div>
              <button onClick={() => setTab('create')}
                className="mt-2 px-4 py-2 rounded-lg bg-[#FF2800] text-white text-[10px] font-black tracking-widest cursor-pointer btn-press">
                + CREATE MEAL
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E26]">
              {filteredCustom.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="font-black text-sm text-[#EDEDF0] truncate">{m.name}</div>
                      {m.servingSize && (
                        <span className="text-[8px] font-black tracking-wider text-[#FF5500] bg-[#FF550022] px-1.5 py-0.5 rounded">
                          /50g
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#686870] mt-0.5">
                      {m.calories} cal
                      {m.protein > 0  && ` · ${m.protein}g P`}
                      {m.carbs   > 0  && ` · ${m.carbs}g C`}
                      {m.fat     > 0  && ` · ${m.fat}g F`}
                      {(m.fibre ?? 0) > 0 && ` · ${m.fibre}g Fi`}
                    </div>
                  </div>
                  <button onClick={() => deleteCustomMeal(m.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1E1E26] text-[#686870] hover:bg-[#FF280022] hover:text-[#FF2800] transition-all cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (m.servingSize) {
                        openServingSlider(m)
                      } else {
                        addMeal({ name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, fibre: m.fibre ?? 0 })
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#FF280022] text-[#FF2800] hover:bg-[#FF2800] hover:text-white transition-all cursor-pointer">
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUICK ADD tab */}
      {tab === 'quick-add' && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#1E1E26] max-h-80 overflow-y-auto">
            {filteredQuick.map(m => (
              <button key={m.name} onClick={() => addMeal({ ...m, fibre: 0 })}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#17171D] transition-colors cursor-pointer text-left">
                <div>
                  <div className="font-bold text-sm text-[#EDEDF0]">{m.name}</div>
                  <div className="text-[10px] text-[#686870]">{m.protein}g P · {m.carbs}g C · {m.fat}g F</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-black text-[#FF5500]">{m.calories}</span>
                  <span className="text-[10px] text-[#686870]">cal</span>
                  <Plus size={16} className="text-[#686870]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CREATE tab */}
      {tab === 'create' && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4 space-y-3">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">CREATE CUSTOM MEAL</div>

          <input type="text" placeholder="Meal name (required)"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2.5 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors" />

          <input type="number" inputMode="decimal" placeholder="Calories (required)" step="0.1"
            value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
            className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF5500] rounded-lg px-3 py-2.5 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors" />

          <div className="text-[9px] font-black tracking-widest text-[#2C2C38]">OPTIONAL MACROS</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'protein', label: 'PROTEIN (g)', color: '#FF2800' },
              { key: 'carbs',   label: 'CARBS (g)',   color: '#FF5500' },
              { key: 'fat',     label: 'FAT (g)',      color: '#D4A017' },
              { key: 'fibre',   label: 'FIBRE (g)',    color: '#1DB954' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <div className="text-[9px] font-black tracking-wider mb-1" style={{ color }}>{label}</div>
                <input type="number" inputMode="decimal" placeholder="0" step="0.1"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-[#0D0D10] border border-[#1E1E26] rounded-lg px-2 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none text-center"
                />
              </div>
            ))}
          </div>

          {saved ? (
            <div className="w-full py-3 rounded-lg text-center text-sm font-black tracking-widest text-[#1DB954] bg-[#0D7A3A22] border border-[#1DB95433]">
              MEAL SAVED ✓
            </div>
          ) : (
            <button onClick={submitCreate}
              disabled={!form.name.trim() || !form.calories}
              className="w-full py-3 rounded-lg font-black text-sm tracking-widest text-white bg-[#FF2800] hover:bg-[#D42B1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer btn-press">
              SAVE TO MY MEALS
            </button>
          )}
        </div>
      )}

      {/* Serving Size Dialog — shown after CREATE */}
      {showServingDialog && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end" onClick={() => setShowServingDialog(false)}>
          <div className="w-full bg-[#111116] border-t border-[#2C2C38] rounded-t-2xl p-6 space-y-4"
               onClick={e => e.stopPropagation()}>
            <div className="text-[10px] font-black tracking-widest text-[#686870]">SERVING SIZE</div>
            <p className="text-base font-black text-[#EDEDF0]">Add serving size support?</p>
            <p className="text-[11px] text-[#686870] leading-relaxed">
              If yes, the macros you entered will be treated as <span className="text-[#FF5500] font-black">per 50g</span>.
              When logging, you&apos;ll pick a serving from 50g to 1000g via a slider.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => confirmServingDialog(false)}
                className="py-3 rounded-lg bg-[#1E1E26] text-[#EDEDF0] text-sm font-black tracking-widest cursor-pointer btn-press">
                NO
              </button>
              <button onClick={() => confirmServingDialog(true)}
                className="py-3 rounded-lg bg-[#FF2800] text-white text-sm font-black tracking-widest cursor-pointer btn-press">
                YES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Serving Size Slider — shown when logging a servingSize meal */}
      {servingMeal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end" onClick={() => setServingMeal(null)}>
          <div className="w-full bg-[#111116] border-t border-[#2C2C38] rounded-t-2xl p-6 space-y-5"
               onClick={e => e.stopPropagation()}>
            <div className="text-[10px] font-black tracking-widest text-[#686870]">SERVING SIZE</div>
            <div className="font-black text-lg text-[#EDEDF0]">{servingMeal.name}</div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#686870]">50g</span>
                <span className="text-xl font-black text-[#FF2800]">{servingGrams}g</span>
                <span className="text-[10px] text-[#686870]">1000g</span>
              </div>
              <input
                type="range" min={50} max={1000} step={50}
                value={servingGrams}
                onChange={e => setServingGrams(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#FF2800] bg-[#1E1E26]"
              />
            </div>

            {/* Scaled macro preview */}
            <div className="bg-[#0D0D10] rounded-xl p-4 space-y-1">
              <div className="text-2xl font-black text-[#FF5500]">
                {Math.round(servingMeal.calories * servingGrams / 50)}
                <span className="text-sm text-[#686870] font-normal ml-1">cal</span>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] font-black mt-1">
                <span style={{ color: '#FF2800' }}>{Math.round(servingMeal.protein * servingGrams / 50)}g P</span>
                <span style={{ color: '#FF5500' }}>{Math.round(servingMeal.carbs   * servingGrams / 50)}g C</span>
                <span style={{ color: '#D4A017' }}>{Math.round(servingMeal.fat     * servingGrams / 50)}g F</span>
                {(servingMeal.fibre ?? 0) > 0 && (
                  <span style={{ color: '#1DB954' }}>{Math.round((servingMeal.fibre ?? 0) * servingGrams / 50)}g Fi</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setServingMeal(null)}
                className="py-3 rounded-lg bg-[#1E1E26] text-[#EDEDF0] text-sm font-black tracking-widest cursor-pointer btn-press">
                CANCEL
              </button>
              <button onClick={logServingMeal}
                className="py-3 rounded-lg bg-[#FF2800] text-white text-sm font-black tracking-widest cursor-pointer btn-press">
                LOG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Meals — placed here so adding meals never shifts the tab bar above */}
      {meals.length > 0 && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
          <button onClick={() => setMealsOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-[#1E1E26] cursor-pointer">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">
              TODAY'S MEALS <span className="text-[#FF2800]">({meals.length})</span>
            </span>
            {mealsOpen ? <ChevronUp size={14} className="text-[#686870]" /> : <ChevronDown size={14} className="text-[#686870]" />}
          </button>
          {mealsOpen && (
            <div className="divide-y divide-[#1E1E26]">
              {meals.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#EDEDF0] truncate">{m.name}</div>
                    <div className="text-[10px] text-[#686870] mt-0.5">
                      {m.calories} cal · {m.protein}g P · {m.carbs}g C · {m.fat}g F
                      {(m.fibre ?? 0) > 0 && ` · ${m.fibre}g Fi`} · {m.time}
                    </div>
                  </div>
                  <button onClick={() => removeMeal(m.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1E1E26] text-[#686870] hover:bg-[#FF280022] hover:text-[#FF2800] transition-all cursor-pointer">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
