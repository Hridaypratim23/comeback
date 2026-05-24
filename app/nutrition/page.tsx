'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useStore, TARGETS, CustomMealTemplate, MealEntry } from '@/lib/store'
import { QUICK_MEALS } from '@/constants/workouts'
import { Plus, X, Search, Bookmark, Trash2, ChevronDown, ChevronUp, Edit3, Camera } from 'lucide-react'
import { getUnitConfig, formatQty, scaleRatio } from '@/lib/unitConfig'

interface FoodResult {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre: number
}

function calcTDEE(weight: number, bodyFat: number): number {
  const lbm = weight * (1 - bodyFat / 100)
  const bmr = 370 + 21.6 * lbm
  return Math.round(bmr * 1.55)
}

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
  const { dayLogs, stats, bodyHistory, addMeal, removeMeal, updateMeal, getOrCreateToday, customMeals, saveCustomMeal, deleteCustomMeal } = useStore()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<Tab>('my-meals')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)
  const [mealsOpen, setMealsOpen] = useState(true)

  // food database lookup
  const [showFoodLookup, setShowFoodLookup] = useState(false)
  const [foodQuery, setFoodQuery] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [foodResults, setFoodResults] = useState<FoodResult[]>([])
  const [foodLoading, setFoodLoading] = useState(false)
  const [foodNotFound, setFoodNotFound] = useState(false)

  // serving size dialog after CREATE
  const [showServingDialog, setShowServingDialog] = useState(false)
  const [pendingMeal, setPendingMeal] = useState<Omit<CustomMealTemplate, 'id'> | null>(null)

  // serving size slider when logging
  const [servingMeal, setServingMeal] = useState<CustomMealTemplate | null>(null)
  const [servingQty, setServingQty] = useState(1)

  // delete confirmation (saved meals)
  const [deletePending, setDeletePending] = useState<CustomMealTemplate | null>(null)

  // logged meal: separate delete confirm and edit modal
  const [loggedMealDelete, setLoggedMealDelete] = useState<MealEntry | null>(null)
  const [loggedMealEdit, setLoggedMealEdit] = useState<MealEntry | null>(null)
  const [mealQtyFactor, setMealQtyFactor] = useState(1)
  const [mealEditMode, setMealEditMode] = useState<'qty' | 'values'>('qty')
  const [mealEditIsSmartQty, setMealEditIsSmartQty] = useState(false)
  const [mealEditForm, setMealEditForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', fibre: '' })

  // extra calories logger
  const [showExtraModal, setShowExtraModal] = useState(false)
  const [extraForm, setExtraForm] = useState({ calories: '', protein: '', carbs: '', fat: '' })

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
  }, [getOrCreateToday])

  useEffect(() => {
    if (mounted && customMeals.length === 0) setTab('quick-add')
  }, [mounted, customMeals.length])

  const anyModalOpen = !!(loggedMealDelete || loggedMealEdit || deletePending || servingMeal || showServingDialog || showExtraModal)
  useEffect(() => {
    if (!mounted) return
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [anyModalOpen, mounted])

  const barcodeFileRef = useRef<HTMLInputElement>(null)

  if (!mounted) return null

  const haptic = () => { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10) }

  const latestBody = bodyHistory[bodyHistory.length - 1]
  const currentWeight = latestBody?.weight ?? stats.weight ?? 72
  const currentBF = latestBody?.bodyFat ?? stats.bodyFat ?? 22
  const TDEE = calcTDEE(currentWeight, currentBF)
  const GOAL_DEFICIT = Math.max(TDEE - TARGETS.calories, 0)

  const today = new Date().toLocaleDateString('en-CA')
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

  const filteredQuick = QUICK_MEALS
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
  const filteredCustom = customMeals
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

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
    const unit = withServing ? getUnitConfig(pendingMeal.name).unit : undefined
    saveCustomMeal({ ...pendingMeal, unit, servingSize: withServing })
    setShowServingDialog(false)
    setPendingMeal(null)
    setForm(emptyForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const openServingSlider = (m: CustomMealTemplate) => {
    const cfg = m.unit ? getUnitConfig(m.name) : null
    setServingMeal(m)
    setServingQty(cfg ? cfg.defaultQty : 100)
  }

  const logServingMeal = () => {
    if (!servingMeal) return
    // Legacy meals (servingSize=true, no unit) use per-50g ratio
    if (!servingMeal.unit && servingMeal.servingSize) {
      const ratio = servingQty / 50
      addMeal({
        name:     `${servingMeal.name} (${servingQty}g)`,
        calories: Math.round(servingMeal.calories * ratio),
        protein:  Math.round(servingMeal.protein  * ratio),
        carbs:    Math.round(servingMeal.carbs    * ratio),
        fat:      Math.round(servingMeal.fat      * ratio),
        fibre:    Math.round((servingMeal.fibre ?? 0) * ratio),
      })
    } else {
      const cfg = getUnitConfig(servingMeal.name)
      const ratio = scaleRatio(servingQty, cfg)
      addMeal({
        name:     `${servingMeal.name} (${formatQty(servingQty, cfg)})`,
        calories: Math.round(servingMeal.calories * ratio),
        protein:  Math.round(servingMeal.protein  * ratio),
        carbs:    Math.round(servingMeal.carbs    * ratio),
        fat:      Math.round(servingMeal.fat      * ratio),
        fibre:    Math.round((servingMeal.fibre ?? 0) * ratio),
      })
    }
    setServingMeal(null)
    haptic()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseNutriments = (n: Record<string, any>): Omit<FoodResult, 'name'> => {
    const get = (...keys: string[]) => {
      for (const k of keys) {
        const v = parseFloat(n[k])
        if (!isNaN(v) && v >= 0) return Math.round(v)
      }
      return 0
    }
    const kcal = get('energy-kcal_100g', 'energy-kcal')
    const calories = kcal > 0 ? kcal : Math.round(get('energy_100g', 'energy') / 4.184)
    return {
      calories,
      protein: get('proteins_100g', 'protein_100g', 'proteins'),
      carbs:   get('carbohydrates_100g', 'carbohydrate_100g', 'carbohydrates'),
      fat:     get('fat_100g', 'fat'),
      fibre:   get('fiber_100g', 'fibers_100g', 'fiber-total_100g', 'fiber', 'fibers'),
    }
  }

  const searchFood = async () => {
    if (!foodQuery.trim()) return
    setFoodLoading(true)
    setFoodNotFound(false)
    setFoodResults([])
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodQuery)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments`
      )
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: FoodResult[] = (data.products ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p.product_name && p.nutriments)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => ({ name: String(p.product_name), ...parseNutriments(p.nutriments) }))
        .filter((r: FoodResult) => r.calories > 0)
      setFoodResults(results)
      if (results.length === 0) setFoodNotFound(true)
    } catch {
      setFoodNotFound(true)
    }
    setFoodLoading(false)
  }

  const applyFoodResult = (r: FoodResult) => {
    setForm({
      name:     r.name,
      calories: String(r.calories),
      protein:  String(r.protein),
      carbs:    String(r.carbs),
      fat:      String(r.fat),
      fibre:    String(r.fibre),
    })
    setFoodResults([])
    setFoodQuery('')
    setBarcodeInput('')
    setFoodNotFound(false)
    setShowFoodLookup(false)
  }

  const lookupBarcode = async (barcode: string) => {
    const code = barcode.trim()
    if (!code) return
    setFoodLoading(true)
    setFoodNotFound(false)
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${code}.json?fields=product_name,nutriments`
      )
      const data = await res.json()
      if (data.status === 1 && data.product?.product_name) {
        applyFoodResult({
          name: String(data.product.product_name),
          ...parseNutriments(data.product.nutriments ?? {}),
        })
      } else {
        setFoodNotFound(true)
      }
    } catch {
      setFoodNotFound(true)
    }
    setFoodLoading(false)
  }

  const handleBarcodeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !('BarcodeDetector' in window)) return
    setFoodLoading(true)
    setFoodNotFound(false)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bd = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      })
      const img = await createImageBitmap(file)
      const codes = await bd.detect(img)
      if (codes.length > 0) {
        setBarcodeInput(codes[0].rawValue)
        await lookupBarcode(codes[0].rawValue)
      } else {
        setFoodLoading(false)
        setFoodNotFound(true)
      }
    } catch {
      setFoodLoading(false)
      setFoodNotFound(true)
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'my-meals',  label: 'MY MEALS' },
    { key: 'quick-add', label: 'QUICK ADD' },
    { key: 'create',    label: '+ CREATE' },
  ]

  return (
    <div className="px-4 pt-12 pb-28 space-y-4">
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
            <span className="text-[10px] text-[#2C2C38]">{currentWeight}kg · {currentBF}% BF · Katch-McArdle</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#686870]">{isDeficit ? 'DEFICIT' : 'SURPLUS'}</span>
            <span className="text-[11px] font-black" style={{ color: isDeficit ? '#1DB954' : '#FF5500' }}>
              {isDeficit ? '-' : '+'}{Math.abs(difference)} kcal
            </span>
          </div>
          {GOAL_DEFICIT > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#686870]">TARGET DEFICIT</span>
              <span className="text-[10px] font-black text-[#2196F3]">-{GOAL_DEFICIT} kcal/day</span>
            </div>
          )}
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
        {totalCal > 0 && (() => {
          const pCal = totalPro * 4, cCal = totalCarb * 4, fCal = totalFat * 9
          const tot = pCal + cCal + fCal || 1
          const pPct = Math.round(pCal / tot * 100)
          const cPct = Math.round(cCal / tot * 100)
          const fPct = 100 - pPct - cPct
          return (
            <div className="mt-4 pt-4 border-t border-[#1E1E26]">
              <div className="text-[9px] font-black tracking-widest text-[#686870] mb-2">CALORIE SPLIT</div>
              <div className="flex rounded-full overflow-hidden h-2.5 gap-px">
                {pCal > 0 && <div style={{ flex: pCal, background: '#FF2800' }} />}
                {cCal > 0 && <div style={{ flex: cCal, background: '#FF5500' }} />}
                {fCal > 0 && <div style={{ flex: fCal, background: '#D4A017' }} />}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[9px] font-black" style={{ color: '#FF2800' }}>P {pPct}%</span>
                <span className="text-[9px] font-black" style={{ color: '#FF5500' }}>C {cPct}%</span>
                <span className="text-[9px] font-black" style={{ color: '#D4A017' }}>F {fPct}%</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Today's Meals */}
      {meals.length > 0 && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
          <button onClick={() => setMealsOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-[#1E1E26] cursor-pointer">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">
              TODAY&apos;S MEALS <span className="text-[#FF2800]">({meals.length})</span>
            </span>
            {mealsOpen ? <ChevronUp size={14} className="text-[#686870]" /> : <ChevronDown size={14} className="text-[#686870]" />}
          </button>
          {mealsOpen && (
            <div className="divide-y divide-[#1E1E26]">
              {[...meals].sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#EDEDF0] truncate">{m.name}</div>
                    <div className="text-[10px] text-[#686870] mt-0.5">
                      {m.calories} cal · {m.protein}g P · {m.carbs}g C · {m.fat}g F
                      {(m.fibre ?? 0) > 0 && ` · ${m.fibre}g Fi`} · {m.time}
                    </div>
                  </div>
                  <button onClick={() => {
                    const bn = m.name.replace(/\s*\([^)]*\)\s*$/, '').trim()
                    const tmpl = customMeals.find(cm => cm.name.toLowerCase() === bn.toLowerCase())
                    const isSmart = !!(tmpl?.unit && tmpl.calories > 0)
                    const scfg = isSmart ? getUnitConfig(tmpl!.name) : null
                    let initQty = 1
                    if (isSmart && tmpl && scfg) {
                      const raw = scfg.isGrams ? (m.calories / tmpl.calories) * 100 : (m.calories / tmpl.calories)
                      initQty = Math.max(scfg.min, Math.min(scfg.max, Math.round(raw / scfg.step) * scfg.step))
                    }
                    setLoggedMealEdit(m)
                    setMealQtyFactor(initQty)
                    setMealEditIsSmartQty(isSmart)
                    setMealEditMode('qty')
                    setMealEditForm({ name: m.name, calories: String(m.calories), protein: String(m.protein), carbs: String(m.carbs), fat: String(m.fat), fibre: String(m.fibre ?? 0) })
                  }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1E1E26] text-[#686870] hover:bg-[#2196F322] hover:text-[#2196F3] transition-all cursor-pointer">
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => setLoggedMealDelete(m)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1E1E26] text-[#686870] hover:bg-[#FF280022] hover:text-[#FF2800] transition-all cursor-pointer">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Extra Calories Card */}
      <button
        onClick={() => setShowExtraModal(true)}
        className="w-full flex items-center justify-between bg-[#111116] border border-[#1E1E26] rounded-xl px-4 py-3 cursor-pointer active:bg-[#17171D] transition-colors text-left">
        <div>
          <div className="text-[10px] font-black tracking-[0.25em] text-[#686870]">LOG EXTRA CALORIES</div>
          <div className="text-[9px] text-[#2C2C38] mt-0.5">No name required — calories &amp; macros only</div>
        </div>
        <Plus size={16} className="text-[#FF5500] flex-shrink-0" />
      </button>

      {/* Tab Bar */}
      <div className="flex bg-[#0D0D10] border border-[#1E1E26] rounded-xl p-1 gap-1">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all cursor-pointer
              ${tab === key
                ? key === 'create' ? 'bg-[#FF2800] text-white' : 'bg-[#1E1E26] text-[#EDEDF0]'
                : 'text-[#686870]'}`}>
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
                      {(m.unit || m.servingSize) && (() => {
                        const cfg = m.unit ? getUnitConfig(m.name) : null
                        const badge = cfg?.isGrams ? '/100g' : cfg ? `/${cfg.singular}` : '/50g'
                        return (
                          <span className="text-[8px] font-black tracking-wider text-[#FF5500] bg-[#FF550022] px-1.5 py-0.5 rounded">
                            {badge}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="text-[10px] text-[#686870] mt-0.5">
                      {m.calories} cal
                      {m.protein > 0  && ` · ${m.protein}g P`}
                      {m.carbs   > 0  && ` · ${m.carbs}g C`}
                      {m.fat     > 0  && ` · ${m.fat}g F`}
                      {(m.fibre ?? 0) > 0 && ` · ${m.fibre}g Fi`}
                    </div>
                  </div>
                  <button onClick={() => setDeletePending(m)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1E1E26] text-[#686870] hover:bg-[#FF280022] hover:text-[#FF2800] transition-all cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      haptic()
                      if (m.unit || m.servingSize) {
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
              <button key={m.name} onClick={() => { addMeal({ ...m, fibre: 0 }); haptic() }}
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
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">CREATE CUSTOM MEAL</div>
            <button
              onClick={() => { setShowFoodLookup(v => !v); setFoodResults([]); setFoodNotFound(false) }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all cursor-pointer border ${showFoodLookup ? 'bg-[#2196F322] text-[#2196F3] border-[#2196F344]' : 'bg-[#1E1E26] text-[#686870] border-transparent'}`}>
              <Search size={11} />
              LOOKUP DB
            </button>
          </div>

          {showFoodLookup && (
            <div className="bg-[#0D0D10] border border-[#1E1E26] rounded-xl p-3 space-y-2">
              {/* Hidden real file input — triggers camera reliably on mobile */}
              <input
                ref={barcodeFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handleBarcodeCapture}
              />

              {/* Name search */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search food name..."
                  value={foodQuery}
                  onChange={e => setFoodQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchFood()}
                  className="flex-1 min-w-0 bg-[#111116] border border-[#1E1E26] focus:border-[#2196F3] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors"
                />
                <button
                  onClick={searchFood}
                  disabled={foodLoading || !foodQuery.trim()}
                  className="shrink-0 px-3 py-2 rounded-lg bg-[#2196F3] text-white text-[10px] font-black tracking-wider cursor-pointer disabled:opacity-40 active:scale-95 transition-all">
                  {foodLoading ? '···' : 'SEARCH'}
                </button>
              </div>

              {/* Barcode lookup */}
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Barcode number..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookupBarcode(barcodeInput)}
                  className="flex-1 min-w-0 bg-[#111116] border border-[#1E1E26] focus:border-[#D4A017] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors"
                />
                <button
                  onClick={() => lookupBarcode(barcodeInput)}
                  disabled={foodLoading || !barcodeInput.trim()}
                  className="shrink-0 px-3 py-2 rounded-lg bg-[#D4A017] text-black text-[10px] font-black tracking-wider cursor-pointer disabled:opacity-40 active:scale-95 transition-all">
                  {foodLoading ? '···' : 'LOOKUP'}
                </button>
              </div>

              {/* Camera scan — only shown when BarcodeDetector is supported (Chrome/Android) */}
              {'BarcodeDetector' in window && (
                <button
                  onClick={() => barcodeFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all border border-[#2C2C38]">
                  <Camera size={12} />
                  SCAN BARCODE WITH CAMERA
                </button>
              )}

              {foodLoading && (
                <div className="text-center py-3 text-[10px] text-[#686870] font-black tracking-widest">SEARCHING...</div>
              )}
              {foodNotFound && !foodLoading && (
                <div className="text-center py-3 text-[10px] text-[#686870]">No results. Try a different term or enter values manually.</div>
              )}
              {foodResults.length > 0 && !foodLoading && (
                <div className="rounded-xl border border-[#1E1E26] max-h-56 overflow-y-auto">
                  <div className="sticky top-0 px-3 py-1.5 bg-[#111116] border-b border-[#1E1E26]">
                    <span className="text-[8px] font-black tracking-widest text-[#2C2C38]">VALUES PER 100G — TAP TO PREFILL</span>
                  </div>
                  {foodResults.map((r, i) => (
                    <button key={i} onClick={() => { applyFoodResult(r); haptic() }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#17171D] active:bg-[#1E1E26] transition-colors cursor-pointer text-left bg-[#0D0D10] border-b border-[#1E1E26] last:border-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-sm font-bold text-[#EDEDF0] truncate leading-snug">{r.name}</div>
                        <div className="text-[10px] text-[#686870] mt-0.5">
                          {[r.protein > 0 ? `${r.protein}g P` : '', r.carbs > 0 ? `${r.carbs}g C` : '', r.fat > 0 ? `${r.fat}g F` : ''].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 flex-shrink-0">
                        <span className="text-sm font-black text-[#FF5500]">{r.calories}</span>
                        <span className="text-[9px] text-[#686870]">cal</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
      {showServingDialog && pendingMeal && createPortal(
        (() => {
          const cfg = getUnitConfig(pendingMeal.name)
          const perLabel = cfg.isGrams ? '100g' : `1 ${cfg.singular}`
          const rangeLabel = cfg.isGrams
            ? `${cfg.min}g – ${cfg.max}g`
            : `${cfg.min}–${cfg.max} ${cfg.plural}`
          return (
            <div className="fixed inset-0 bg-black/70 z-[200] flex items-end" onClick={() => setShowServingDialog(false)}>
              <div className="w-full bg-[#111116] border-t border-[#2C2C38] rounded-t-2xl p-6 space-y-4"
                   onClick={e => e.stopPropagation()}>
                <div className="text-[10px] font-black tracking-widest text-[#686870]">SERVING SIZE</div>
                <p className="text-base font-black text-[#EDEDF0]">Add serving size support?</p>
                <p className="text-[11px] text-[#686870] leading-relaxed">
                  If yes, macros you entered will be treated as{' '}
                  <span className="text-[#FF5500] font-black">per {perLabel}</span>.
                  When logging, pick quantity ({rangeLabel}).
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
          )
        })(),
        document.body
      )}

      {/* Serving Size Slider — shown when logging a servingSize meal */}
      {servingMeal && createPortal(
        (() => {
          // Support legacy per-50g meals and new unit-based meals
          const isLegacy = !servingMeal.unit && servingMeal.servingSize
          const cfg = isLegacy ? null : getUnitConfig(servingMeal.name)
          const min  = isLegacy ? 50  : cfg!.min
          const max  = isLegacy ? 1000 : cfg!.max
          const step = isLegacy ? 50  : cfg!.step
          const ratio = isLegacy
            ? servingQty / 50
            : scaleRatio(servingQty, cfg!)
          const qtyLabel = isLegacy
            ? `${servingQty}g`
            : formatQty(servingQty, cfg!)
          const minLabel = isLegacy ? '50g' : formatQty(min, cfg!)
          const maxLabel = isLegacy ? '1000g' : formatQty(max, cfg!)

          return (
            <div className="fixed inset-0 bg-black/70 z-[200] flex items-end" onClick={() => setServingMeal(null)}>
              <div className="w-full bg-[#111116] border-t border-[#2C2C38] rounded-t-2xl p-6 space-y-5"
                   onClick={e => e.stopPropagation()}>
                <div className="text-[10px] font-black tracking-widest text-[#686870]">HOW MUCH?</div>
                <div className="font-black text-lg text-[#EDEDF0]">{servingMeal.name}</div>

                {/* Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#686870]">{minLabel}</span>
                    <span className="text-xl font-black text-[#FF2800]">{qtyLabel}</span>
                    <span className="text-[10px] text-[#686870]">{maxLabel}</span>
                  </div>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={servingQty}
                    onChange={e => setServingQty(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#FF2800] bg-[#1E1E26]"
                  />
                </div>

                {/* Scaled macro preview */}
                <div className="bg-[#0D0D10] rounded-xl p-4 space-y-1">
                  <div className="text-2xl font-black text-[#FF5500]">
                    {Math.round(servingMeal.calories * ratio)}
                    <span className="text-sm text-[#686870] font-normal ml-1">cal</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] font-black mt-1">
                    <span style={{ color: '#FF2800' }}>{Math.round(servingMeal.protein * ratio)}g P</span>
                    <span style={{ color: '#FF5500' }}>{Math.round(servingMeal.carbs   * ratio)}g C</span>
                    <span style={{ color: '#D4A017' }}>{Math.round(servingMeal.fat     * ratio)}g F</span>
                    {(servingMeal.fibre ?? 0) > 0 && (
                      <span style={{ color: '#1DB954' }}>{Math.round((servingMeal.fibre ?? 0) * ratio)}g Fi</span>
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
          )
        })(),
        document.body
      )}

      {/* ── Delete confirmation (centered) ── */}
      {loggedMealDelete && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setLoggedMealDelete(null)}>
          <div style={{ width: 'calc(100vw - 3rem)', maxWidth: '24rem' }}
            className="bg-[#111116] border border-[#2C2C38] rounded-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4 border-b border-[#1E1E26]">
              <div className="text-[10px] font-black tracking-[0.3em] text-[#FF2800] mb-2">DELETE MEAL</div>
              <div className="text-base font-black text-[#EDEDF0] leading-snug truncate">{loggedMealDelete.name}</div>
              <div className="text-[10px] text-[#686870] mt-1">
                {loggedMealDelete.calories} cal · {loggedMealDelete.protein}g P · {loggedMealDelete.carbs}g C · {loggedMealDelete.fat}g F
              </div>
            </div>
            <div className="px-5 py-4 text-[11px] text-[#686870]">
              Remove this entry from today&apos;s log? This cannot be undone.
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setLoggedMealDelete(null)}
                className="flex-1 py-3 rounded-xl bg-[#1E1E26] text-[#686870] text-[11px] font-black tracking-widest cursor-pointer btn-press">
                GO BACK
              </button>
              <button onClick={() => { removeMeal(loggedMealDelete.id); setLoggedMealDelete(null); haptic() }}
                className="flex-1 py-3 rounded-xl bg-[#FF2800] text-white text-[11px] font-black tracking-widest cursor-pointer btn-press">
                DELETE
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Edit logged meal (bottom sheet) ── */}
      {loggedMealEdit && (() => {
        const m = loggedMealEdit
        const baseName = m.name.replace(/\s*\([^)]*\)\s*$/, '').trim()
        const template = mealEditIsSmartQty
          ? (customMeals.find(cm => cm.name.toLowerCase() === baseName.toLowerCase()) ?? null)
          : null
        const smartCfg = template ? getUnitConfig(template.name) : null

        // Compute preview macros
        let newCal: number, newPro: number, newCarb: number, newFat: number, newFibre: number
        if (mealEditMode === 'values') {
          newCal   = parseFloat(mealEditForm.calories) || 0
          newPro   = parseFloat(mealEditForm.protein)  || 0
          newCarb  = parseFloat(mealEditForm.carbs)    || 0
          newFat   = parseFloat(mealEditForm.fat)       || 0
          newFibre = parseFloat(mealEditForm.fibre)    || 0
        } else if (mealEditIsSmartQty && template && smartCfg) {
          const ratio = scaleRatio(mealQtyFactor, smartCfg)
          newCal   = Math.round(template.calories        * ratio)
          newPro   = Math.round(template.protein         * ratio)
          newCarb  = Math.round(template.carbs           * ratio)
          newFat   = Math.round(template.fat             * ratio)
          newFibre = Math.round((template.fibre ?? 0)    * ratio)
        } else {
          newCal   = Math.round(m.calories     * mealQtyFactor)
          newPro   = Math.round(m.protein      * mealQtyFactor)
          newCarb  = Math.round(m.carbs        * mealQtyFactor)
          newFat   = Math.round(m.fat          * mealQtyFactor)
          newFibre = Math.round((m.fibre ?? 0) * mealQtyFactor)
        }

        const calDelta  = newCal - m.calories
        const isChanged = newCal !== m.calories || newPro !== m.protein || newCarb !== m.carbs || newFat !== m.fat

        const sliderMin   = mealEditIsSmartQty && smartCfg ? smartCfg.min  : 0.25
        const sliderMax   = mealEditIsSmartQty && smartCfg ? smartCfg.max  : 3
        const sliderStep  = mealEditIsSmartQty && smartCfg ? smartCfg.step : 0.25
        const qtyLabel    = mealEditIsSmartQty && smartCfg
          ? formatQty(mealQtyFactor, smartCfg)
          : `${mealQtyFactor}×`
        const minLabel    = mealEditIsSmartQty && smartCfg ? formatQty(smartCfg.min, smartCfg) : '¼×'
        const maxLabel    = mealEditIsSmartQty && smartCfg ? formatQty(smartCfg.max, smartCfg) : '3×'

        return createPortal(
          <div className="fixed inset-0 bg-black/70 z-[200] flex items-end" onClick={() => setLoggedMealEdit(null)}>
            <div className="w-full bg-[#111116] border-t border-[#2C2C38] rounded-t-2xl"
                 onClick={e => e.stopPropagation()}>
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#2C2C38]" />
              </div>

              {/* Header */}
              <div className="px-5 pt-1 pb-3 border-b border-[#1E1E26]">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="text-[9px] font-black tracking-[0.3em] text-[#686870]">EDIT ENTRY</div>
                  <div className="text-[9px] text-[#2C2C38]">{m.time}</div>
                </div>
                <div className="text-base font-black text-[#EDEDF0]">{baseName}</div>
              </div>

              <div className="px-5 pt-4 pb-2">
                {mealEditMode === 'qty' ? (
                  <div className="space-y-4">
                    {/* Quantity / scale slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#686870]">{minLabel}</span>
                        <span className="text-xl font-black text-[#FF2800]">{qtyLabel}</span>
                        <span className="text-[10px] text-[#686870]">{maxLabel}</span>
                      </div>
                      <input type="range" min={sliderMin} max={sliderMax} step={sliderStep}
                        value={mealQtyFactor}
                        onChange={e => setMealQtyFactor(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#FF2800] bg-[#1E1E26]" />
                    </div>

                    {/* Before → After */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-[#0D0D10] rounded-xl p-3">
                        <div className="text-[8px] font-black tracking-widest text-[#2C2C38] mb-1">NOW</div>
                        <div className="text-xl font-black text-[#686870] leading-none">
                          {m.calories}<span className="text-[10px] font-normal ml-0.5">kcal</span>
                        </div>
                        <div className="text-[9px] text-[#686870] mt-1">{m.protein}g P · {m.carbs}g C · {m.fat}g F</div>
                      </div>
                      <div className="flex-1 bg-[#0D0D10] border border-[#FF280028] rounded-xl p-3">
                        <div className="text-[8px] font-black tracking-widest text-[#FF2800] mb-1">AFTER SAVE</div>
                        <div className="text-xl font-black text-[#FF5500] leading-none">
                          {newCal}<span className="text-[10px] font-normal ml-0.5">kcal</span>
                        </div>
                        <div className="text-[9px] text-[#686870] mt-1">{newPro}g P · {newCarb}g C · {newFat}g F</div>
                      </div>
                    </div>

                    {calDelta !== 0 && (
                      <div className={`text-center text-sm font-black tracking-widest ${calDelta > 0 ? 'text-[#FF5500]' : 'text-[#1DB954]'}`}>
                        {calDelta > 0 ? '+' : ''}{calDelta} kcal
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'calories', label: 'CALORIES', color: '#FF5500', unit: 'kcal' },
                      { key: 'protein',  label: 'PROTEIN',  color: '#FF2800', unit: 'g' },
                      { key: 'carbs',    label: 'CARBS',    color: '#FF5500', unit: 'g' },
                      { key: 'fat',      label: 'FAT',      color: '#D4A017', unit: 'g' },
                      { key: 'fibre',    label: 'FIBRE',    color: '#1DB954', unit: 'g' },
                    ].map(({ key, label, color, unit }) => (
                      <div key={key} className={key === 'calories' ? 'col-span-2' : ''}>
                        <div className="text-[9px] font-black tracking-wider mb-1" style={{ color }}>{label} <span className="text-[#2C2C38]">{unit}</span></div>
                        <input type="number" inputMode="decimal" placeholder="0"
                          value={mealEditForm[key as keyof typeof mealEditForm]}
                          onChange={e => setMealEditForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none text-center transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 pt-2 pb-7 space-y-3">
                <button onClick={() => setMealEditMode(v => v === 'qty' ? 'values' : 'qty')}
                  className="w-full text-[9px] font-black tracking-[0.2em] text-[#2C2C38] cursor-pointer py-1 text-center">
                  {mealEditMode === 'qty' ? '· EDIT VALUES MANUALLY ·' : '· ADJUST QUANTITY ·'}
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setLoggedMealEdit(null)}
                    className="flex-1 py-3 rounded-xl bg-[#1E1E26] text-[#686870] text-[11px] font-black tracking-widest cursor-pointer btn-press">
                    CANCEL
                  </button>
                  <button
                    disabled={!isChanged}
                    onClick={() => {
                      if (mealEditMode === 'values') {
                        updateMeal(m.id, { name: mealEditForm.name.trim() || m.name, calories: newCal, protein: newPro, carbs: newCarb, fat: newFat, fibre: newFibre })
                      } else if (mealEditIsSmartQty && template && smartCfg) {
                        updateMeal(m.id, {
                          name: `${baseName} (${formatQty(mealQtyFactor, smartCfg)})`,
                          calories: newCal, protein: newPro, carbs: newCarb, fat: newFat, fibre: newFibre,
                        })
                      } else {
                        const suffix = Math.abs(mealQtyFactor - 1) > 0.01 ? ` (×${mealQtyFactor})` : ''
                        updateMeal(m.id, { name: baseName + suffix, calories: newCal, protein: newPro, carbs: newCarb, fat: newFat, fibre: newFibre })
                      }
                      setLoggedMealEdit(null); haptic()
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#FF2800] text-white text-[11px] font-black tracking-widest cursor-pointer btn-press disabled:opacity-30 disabled:cursor-not-allowed">
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      })()}

      {/* ── Extra Calories Modal ── */}
      {showExtraModal && createPortal(
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-end" onClick={() => setShowExtraModal(false)}>
          <div className="w-full bg-[#111116] border-t border-[#2C2C38] rounded-t-2xl p-5 space-y-4"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-center -mt-2 mb-1">
              <div className="w-10 h-1 rounded-full bg-[#2C2C38]" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">LOG EXTRA CALORIES</div>
              <div className="text-[10px] text-[#2C2C38] mt-0.5">No food name needed — just log what you consumed.</div>
            </div>

            <div>
              <div className="text-[9px] font-black tracking-wider mb-1.5" style={{ color: '#FF5500' }}>CALORIES (required)</div>
              <input type="number" inputMode="decimal" placeholder="e.g. 300"
                value={extraForm.calories}
                onChange={e => setExtraForm(f => ({ ...f, calories: e.target.value }))}
                className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF5500] rounded-lg px-3 py-3 text-xl font-black text-[#EDEDF0] placeholder-[#2C2C38] outline-none text-center transition-colors" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'protein', label: 'PROTEIN g', color: '#FF2800' },
                { key: 'carbs',   label: 'CARBS g',   color: '#FF5500' },
                { key: 'fat',     label: 'FAT g',      color: '#D4A017' },
              ] as const).map(({ key, label, color }) => (
                <div key={key}>
                  <div className="text-[9px] font-black tracking-wider mb-1" style={{ color }}>{label}</div>
                  <input type="number" inputMode="decimal" placeholder="0"
                    value={extraForm[key]}
                    onChange={e => setExtraForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-[#0D0D10] border border-[#1E1E26] rounded-lg px-2 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none text-center" />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pb-1">
              <button onClick={() => { setShowExtraModal(false); setExtraForm({ calories: '', protein: '', carbs: '', fat: '' }) }}
                className="flex-1 py-3 rounded-xl bg-[#1E1E26] text-[#686870] text-[11px] font-black tracking-widest cursor-pointer btn-press">
                CANCEL
              </button>
              <button
                disabled={!extraForm.calories || parseFloat(extraForm.calories) <= 0}
                onClick={() => {
                  addMeal({
                    name: 'Extra',
                    calories: parseFloat(extraForm.calories) || 0,
                    protein:  parseFloat(extraForm.protein)  || 0,
                    carbs:    parseFloat(extraForm.carbs)    || 0,
                    fat:      parseFloat(extraForm.fat)       || 0,
                    fibre:    0,
                  })
                  setShowExtraModal(false)
                  setExtraForm({ calories: '', protein: '', carbs: '', fat: '' })
                  haptic()
                }}
                className="flex-1 py-3 rounded-xl bg-[#FF5500] text-white text-[11px] font-black tracking-widest cursor-pointer btn-press disabled:opacity-30 disabled:cursor-not-allowed">
                LOG
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete confirmation modal ── */}
      {deletePending && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeletePending(null)}>
          <div style={{ width: 'calc(100vw - 3rem)', maxWidth: '24rem' }}
            className="bg-[#111116] border border-[#2C2C38] rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4 border-b border-[#1E1E26]">
              <div className="text-[10px] font-black tracking-[0.3em] text-[#FF2800] mb-1">DELETE MEAL</div>
              <div className="text-base font-black text-[#EDEDF0] leading-snug">{deletePending.name}</div>
              <div className="text-[10px] text-[#686870] mt-1">
                {deletePending.calories} cal
                {deletePending.protein > 0 && ` · ${deletePending.protein}g P`}
                {deletePending.carbs > 0 && ` · ${deletePending.carbs}g C`}
                {deletePending.fat > 0 && ` · ${deletePending.fat}g F`}
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] text-[#686870] leading-relaxed">
                This will permanently remove <span className="text-[#EDEDF0] font-bold">{deletePending.name}</span> from your saved meals. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setDeletePending(null)}
                className="flex-1 py-3 rounded-xl bg-[#1E1E26] text-[#686870] text-[11px] font-black tracking-widest cursor-pointer btn-press">
                GO BACK
              </button>
              <button
                onClick={() => { deleteCustomMeal(deletePending.id); setDeletePending(null) }}
                className="flex-1 py-3 rounded-xl bg-[#FF2800] text-white text-[11px] font-black tracking-widest cursor-pointer btn-press">
                DELETE
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
