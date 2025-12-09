'use client'

import { cn } from '@/lib/utils'

// Dashboard - Pulsing financial health rings with orbiting metrics
export function DashboardVisual() {
  return (
    <div className="relative h-48 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-900/30">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>
      
      {/* Central pulsing rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute -inset-16 rounded-full border-2 border-emerald-500/20 animate-[ping_3s_ease-in-out_infinite]" />
          <div className="absolute -inset-12 rounded-full border border-emerald-400/30 animate-[ping_2.5s_ease-in-out_infinite_0.5s]" />
          <div className="absolute -inset-8 rounded-full border border-emerald-300/40 animate-[ping_2s_ease-in-out_infinite_1s]" />
          
          {/* Core */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_60px_rgba(16,185,129,0.4)] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Orbiting metric dots */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 animate-[spin_20s_linear_infinite]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.8)]" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />
      </div>
      
      {/* Text overlay */}
      <div className="absolute left-8 bottom-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Financial Dashboard</h2>
        <p className="text-emerald-300/80 text-sm">Your complete financial overview</p>
      </div>
      
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent" />
      
      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
      `}</style>
    </div>
  )
}

// Transactions - Flowing money streams
export function TransactionsVisual() {
  return (
    <div className="relative h-48 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-900/30">
      {/* Animated flow lines */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
            style={{
              top: `${15 + i * 15}%`,
              left: '-100%',
              width: '200%',
              animation: `flowLine ${3 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.4}s`
            }}
          />
        ))}
      </div>
      
      {/* Floating transaction cards */}
      <div className="absolute right-20 top-8 animate-[float_4s_ease-in-out_infinite]">
        <div className="w-24 h-14 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 backdrop-blur-sm p-2">
          <div className="w-8 h-1.5 bg-cyan-400/50 rounded mb-2" />
          <div className="w-12 h-1 bg-cyan-400/30 rounded" />
          <div className="text-right text-xs text-green-400 font-mono mt-1">+$120</div>
        </div>
      </div>
      
      <div className="absolute right-48 top-20 animate-[float_5s_ease-in-out_infinite_0.5s]">
        <div className="w-20 h-12 rounded-lg bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30 backdrop-blur-sm p-2">
          <div className="w-6 h-1.5 bg-rose-400/50 rounded mb-2" />
          <div className="w-10 h-1 bg-rose-400/30 rounded" />
          <div className="text-right text-xs text-rose-400 font-mono mt-0.5">-$45</div>
        </div>
      </div>
      
      {/* Arrow indicators */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3">
        {[...Array(3)].map((_, i) => (
          <svg
            key={i}
            className="w-6 h-6 text-cyan-400/60"
            style={{ animation: `slideRight 1.5s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        ))}
      </div>
      
      {/* Text overlay */}
      <div className="absolute left-8 bottom-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Transactions</h2>
        <p className="text-cyan-300/80 text-sm">Track every dollar in and out</p>
      </div>
      
      <style jsx>{`
        @keyframes flowLine {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slideRight {
          0%, 100% { opacity: 0.3; transform: translateX(-8px); }
          50% { opacity: 1; transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}

// Assets - Growing wealth bars and coins
export function AssetsVisual() {
  return (
    <div className="relative h-48 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-900/30">
      {/* Sparkle particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-300"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animation: `sparkle ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Growing bars */}
      <div className="absolute right-16 bottom-12 flex items-end gap-3">
        {[40, 65, 50, 80, 70, 95].map((height, i) => (
          <div
            key={i}
            className="w-6 rounded-t-sm bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
            style={{
              height: `${height}px`,
              animation: `growBar 2s ease-out forwards`,
              animationDelay: `${i * 0.1}s`,
              opacity: 0,
              transform: 'scaleY(0)',
              transformOrigin: 'bottom'
            }}
          />
        ))}
      </div>
      
      {/* Floating coins */}
      <div className="absolute left-1/3 top-10">
        <div className="relative">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-amber-200/50 flex items-center justify-center text-amber-900 font-bold text-sm shadow-lg"
              style={{
                left: `${i * 8}px`,
                top: `${i * 8}px`,
                animation: `coinFloat ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              $
            </div>
          ))}
        </div>
      </div>
      
      {/* Upward trend line */}
      <svg className="absolute right-8 top-8 w-32 h-24 opacity-30" viewBox="0 0 100 60">
        <path
          d="M0,50 Q25,45 40,35 T70,20 T100,5"
          stroke="url(#goldGradient)"
          strokeWidth="2"
          fill="none"
          className="animate-[drawLine_2s_ease-out_forwards]"
          style={{ strokeDasharray: 150, strokeDashoffset: 150 }}
        />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Text overlay */}
      <div className="absolute left-8 bottom-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Assets & Portfolio</h2>
        <p className="text-amber-300/80 text-sm">Watch your wealth grow</p>
      </div>
      
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes growBar {
          to { opacity: 1; transform: scaleY(1); }
        }
        @keyframes coinFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}

// Debts - Breaking chains / descending weights
export function DebtsVisual() {
  return (
    <div className="relative h-48 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 border border-rose-900/30">
      {/* Cracking effect background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <path
            d="M200,0 L203,40 L195,45 L205,80 L190,85 L210,120 L185,125 L215,160 L180,170 L220,200"
            stroke="rgb(244,63,94)"
            strokeWidth="1"
            fill="none"
            className="animate-[crack_3s_ease-out_forwards]"
          />
        </svg>
      </div>
      
      {/* Chain links breaking */}
      <div className="absolute right-24 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-8 h-6 rounded-full border-4",
              i < 2 ? "border-slate-600 opacity-50" : "border-rose-500/70",
              i === 2 && "animate-[shake_0.5s_ease-in-out_infinite]"
            )}
            style={{
              transform: i < 2 ? `translateY(${i * 2}px) rotate(${i % 2 ? 5 : -5}deg)` : undefined
            }}
          />
        ))}
        {/* Breaking point spark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
        </div>
      </div>
      
      {/* Descending percentage */}
      <div className="absolute left-1/2 -translate-x-1/2 top-8">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-rose-400 animate-[countDown_3s_ease-out_forwards]">↓</span>
          <span className="text-3xl font-mono font-bold bg-gradient-to-b from-rose-300 to-rose-500 bg-clip-text text-transparent">
            DEBT
          </span>
        </div>
      </div>
      
      {/* Progress bar showing debt payoff */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-20 w-64">
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-emerald-500 rounded-full"
            style={{
              animation: 'payoffProgress 4s ease-out forwards',
              width: '0%'
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs">
          <span className="text-rose-400">Owed</span>
          <span className="text-emerald-400">Paid Off</span>
        </div>
      </div>
      
      {/* Text overlay */}
      <div className="absolute left-8 bottom-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Debts & Liabilities</h2>
        <p className="text-rose-300/80 text-sm">Break free from financial burden</p>
      </div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-2deg); }
          75% { transform: translateX(2px) rotate(2deg); }
        }
        @keyframes payoffProgress {
          to { width: 65%; }
        }
        @keyframes crack {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 500 0; }
        }
      `}</style>
    </div>
  )
}

// Bills - Calendar with due date markers
export function BillsVisual() {
  return (
    <div className="relative h-48 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-violet-950/20 to-slate-900 border border-violet-900/30">
      {/* Calendar grid background */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 grid grid-cols-7 gap-1 opacity-80">
        {[...Array(28)].map((_, i) => {
          const isHighlighted = [5, 12, 19, 24].includes(i)
          const isPaid = [5, 12].includes(i)
          return (
            <div
              key={i}
              className={cn(
                "w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium transition-all duration-300",
                isHighlighted
                  ? isPaid
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                    : "bg-violet-500/30 text-violet-300 border border-violet-500/50 animate-pulse"
                  : "bg-slate-800/50 text-slate-500"
              )}
              style={{
                animation: isHighlighted && !isPaid ? `pulse 2s ease-in-out infinite ${i * 0.1}s` : undefined
              }}
            >
              {i + 1}
            </div>
          )
        })}
      </div>
      
      {/* Floating bill icons */}
      <div className="absolute left-20 top-8 animate-[floatBill_3s_ease-in-out_infinite]">
        <div className="w-12 h-14 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      </div>
      
      <div className="absolute left-32 top-20 animate-[floatBill_4s_ease-in-out_infinite_0.5s]">
        <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      
      {/* Clock indicator */}
      <div className="absolute left-1/2 top-6 -translate-x-1/2 flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-full border-2 border-violet-400/50">
          <div 
            className="absolute left-1/2 bottom-1/2 w-0.5 h-3 bg-violet-400 origin-bottom"
            style={{ animation: 'clockHand 4s linear infinite' }}
          />
          <div className="absolute left-1/2 bottom-1/2 w-0.5 h-2 bg-violet-300 origin-bottom -translate-x-1/2" />
        </div>
        <span className="text-sm font-medium text-violet-300">Due Soon</span>
      </div>
      
      {/* Text overlay */}
      <div className="absolute left-8 bottom-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Bills & Payments</h2>
        <p className="text-violet-300/80 text-sm">Never miss a due date</p>
      </div>
      
      <style jsx>{`
        @keyframes floatBill {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes clockHand {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Budget - Target/pie visualization
export function BudgetVisual() {
  return (
    <div className="relative h-48 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950/20 to-slate-900 border border-teal-900/30">
      {/* Concentric target rings */}
      <div className="absolute right-20 top-1/2 -translate-y-1/2">
        <div className="relative w-32 h-32">
          {/* Outer rings */}
          <div className="absolute inset-0 rounded-full border-4 border-teal-900/40" />
          <div className="absolute inset-3 rounded-full border-4 border-teal-800/50" />
          <div className="absolute inset-6 rounded-full border-4 border-teal-700/60" />
          <div className="absolute inset-9 rounded-full border-4 border-teal-600/70" />
          
          {/* Center bullseye */}
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_30px_rgba(20,184,166,0.5)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">100%</span>
          </div>
          
          {/* Animated arrow hitting target */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full"
            style={{ 
              animation: 'arrowHit 2s ease-out infinite',
              transformOrigin: 'bottom'
            }}
          />
        </div>
      </div>
      
      {/* Budget category pills */}
      <div className="absolute left-16 top-8 space-y-2">
        {[
          { label: 'Food', color: 'from-orange-500 to-orange-600', percent: 75 },
          { label: 'Transport', color: 'from-blue-500 to-blue-600', percent: 45 },
          { label: 'Entertainment', color: 'from-pink-500 to-pink-600', percent: 90 },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2" style={{ animation: `slideIn 0.5s ease-out ${i * 0.1}s forwards`, opacity: 0 }}>
            <div className={cn("w-3 h-3 rounded-full bg-gradient-to-r", item.color)} />
            <span className="text-xs text-slate-300 w-20">{item.label}</span>
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full bg-gradient-to-r", item.color)}
                style={{ width: `${item.percent}%`, animation: `growWidth 1s ease-out ${0.5 + i * 0.2}s forwards` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating percentage badges */}
      <div className="absolute left-40 bottom-16 animate-[bounce_2s_ease-in-out_infinite]">
        <div className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-medium">
          On Track ✓
        </div>
      </div>
      
      {/* Text overlay */}
      <div className="absolute left-8 bottom-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Budget & Goals</h2>
        <p className="text-teal-300/80 text-sm">Hit your financial targets</p>
      </div>
      
      <style jsx>{`
        @keyframes arrowHit {
          0% { transform: translate(-50%, -200%) scale(0.5); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes growWidth {
          from { width: 0; }
        }
      `}</style>
    </div>
  )
}

// Analysis - Crystal ball / projection graphs
export function AnalysisVisual() {
  return (
    <div className="relative h-48 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-900/30">
      {/* Star field background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.5,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Crystal ball */}
      <div className="absolute right-24 top-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Outer glow */}
          <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
          
          {/* Ball */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400/30 via-violet-500/20 to-indigo-600/30 border border-indigo-400/30 backdrop-blur-sm overflow-hidden">
            {/* Inner graph */}
            <svg className="absolute inset-2" viewBox="0 0 100 100">
              <path
                d="M10,70 Q30,60 45,50 T70,30 T95,15"
                stroke="url(#futureGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                style={{ animation: 'drawFuture 3s ease-out infinite' }}
              />
              <defs>
                <linearGradient id="futureGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Reflection */}
            <div className="absolute top-2 left-4 w-8 h-4 rounded-full bg-white/10 blur-sm" />
          </div>
          
          {/* Base */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-full" />
        </div>
      </div>
      
      {/* Projected metrics */}
      <div className="absolute left-16 top-10 space-y-3">
        <div className="flex items-center gap-3" style={{ animation: 'fadeSlide 0.5s ease-out forwards' }}>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-indigo-300/80">Projected Growth</div>
            <div className="text-sm font-semibold text-white">+24% annually</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3" style={{ animation: 'fadeSlide 0.5s ease-out 0.1s forwards', opacity: 0 }}>
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-violet-300/80">Tax Savings</div>
            <div className="text-sm font-semibold text-white">$3,200 potential</div>
          </div>
        </div>
      </div>
      
      {/* Text overlay */}
      <div className="absolute left-8 bottom-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Analysis & Insights</h2>
        <p className="text-indigo-300/80 text-sm">See your financial future</p>
      </div>
      
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        @keyframes drawFuture {
          0% { stroke-dasharray: 0 200; opacity: 0.5; }
          50% { stroke-dasharray: 200 0; opacity: 1; }
          100% { stroke-dasharray: 200 0; opacity: 0.5; }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}



















