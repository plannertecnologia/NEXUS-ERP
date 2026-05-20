import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import type { AppUser } from './lib/supabase'

// ─── THEME ──────────────────────────────────────────────────
const applyTheme = (primary: string) => {
  document.documentElement.style.setProperty('--p', primary)
}

// ─── UTILS ──────────────────────────────────────────────────
const cx = (...a: (string | boolean | undefined | null)[]) => a.filter(Boolean).join(' ')
const fmt = (n: number) => (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

// ─── MOCK DATA ───────────────────────────────────────────────
const MOCK_PRODUCTS = [
  { id: 1, name: 'Notebook Dell XPS 15', sku: 'DELL-XPS-001', price: 8999.90, cost_price: 6200, stock_quantity: 45, min_stock: 10, active: true },
  { id: 2, name: 'Monitor LG 27" 4K', sku: 'LG-MON-27K', price: 3499.90, cost_price: 2100, stock_quantity: 28, min_stock: 5, active: true },
  { id: 3, name: 'Teclado Mecânico RGB', sku: 'KEY-K2-RGB', price: 699.90, cost_price: 380, stock_quantity: 3, min_stock: 10, active: true },
  { id: 4, name: 'Mouse Logitech MX', sku: 'LOG-MX3', price: 549.90, cost_price: 290, stock_quantity: 67, min_stock: 15, active: true },
  { id: 5, name: 'Headset Sony WH-1000', sku: 'SNY-WH1000', price: 1899.90, cost_price: 1200, stock_quantity: 0, min_stock: 5, active: true },
]
const MOCK_SALES = [
  { id: 'VND-001', customer_name: 'João Silva', created_at: new Date().toISOString(), total: 9699.80, status: 'completed', payment_method: 'credit_card' },
  { id: 'VND-002', customer_name: 'Maria Santos', created_at: new Date().toISOString(), total: 699.90, status: 'completed', payment_method: 'pix' },
  { id: 'VND-003', customer_name: 'Pedro Costa', created_at: new Date().toISOString(), total: 4049.80, status: 'pending', payment_method: 'boleto' },
]
const MOCK_ACCOUNTS = [
  { id: 1, description: 'Fornecedor Dell', due_date: '2025-05-20', amount: 6200, status: 'pending', category: 'Fornecedores' },
  { id: 2, description: 'Aluguel Sede', due_date: '2025-05-10', amount: 8500, status: 'paid', category: 'Imóveis' },
  { id: 3, description: 'Energia Elétrica', due_date: '2025-05-25', amount: 1240, status: 'pending', category: 'Utilidades' },
]
const MOCK_COMPANIES = [
  { id: '1', name: 'TechCorp Ltda', cnpj: '12.345.678/0001-90', subscription_status: 'active', plan: 'enterprise', user_count: 24 },
  { id: '2', name: 'RedBrand SA', cnpj: '98.765.432/0001-10', subscription_status: 'active', plan: 'professional', user_count: 12 },
  { id: '3', name: 'StartupXYZ', cnpj: '11.222.333/0001-44', subscription_status: 'trial', plan: 'starter', user_count: 3 },
]
const CHART_DATA = [
  { m: 'Jan', r: 45, d: 28 }, { m: 'Fev', r: 52, d: 31 },
  { m: 'Mar', r: 48, d: 29 }, { m: 'Abr', r: 61, d: 35 },
  { m: 'Mai', r: 58, d: 32 }, { m: 'Jun', r: 72, d: 38 },
]

// ─── PRIMITIVES ──────────────────────────────────────────────
type BadgeVariant = 'default'|'active'|'trial'|'suspended'|'blocked'|'pending'|'completed'|'cancelled'|'paid'|'inactive'|'enterprise'|'professional'|'starter'|'ADMIN_EMPRESA'|'FUNCIONARIO'|'SUPER_ADMIN'|'canceled'|'in'|'out'
const Badge = ({ children, v = 'default' }: { children: React.ReactNode; v?: BadgeVariant }) => {
  const map: Record<string, string> = {
    default: 'bg-gray-100 text-gray-600',
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    trial: 'bg-blue-50 text-blue-700 border border-blue-200',
    suspended: 'bg-amber-50 text-amber-700 border border-amber-200',
    blocked: 'bg-red-50 text-red-700 border border-red-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
    canceled: 'bg-red-50 text-red-700 border border-red-200',
    paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    inactive: 'bg-gray-100 text-gray-400',
    enterprise: 'bg-purple-50 text-purple-700 border border-purple-200',
    professional: 'bg-blue-50 text-blue-700 border border-blue-200',
    starter: 'bg-gray-100 text-gray-600',
    ADMIN_EMPRESA: 'bg-purple-50 text-purple-700',
    FUNCIONARIO: 'bg-blue-50 text-blue-700',
    SUPER_ADMIN: 'bg-red-50 text-red-700',
    in: 'bg-emerald-50 text-emerald-700',
    out: 'bg-red-50 text-red-700',
  }
  return <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', map[v] || map.default)}>{children}</span>
}

const Spinner = () => (
  <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)

const Btn = ({ children, v = 'primary', sz = 'md', onClick, disabled, loading, full, icon }: any) => {
  const vs: Record<string, string> = {
    primary: 'text-white font-semibold shadow-sm hover:opacity-90 active:scale-95',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 font-medium active:scale-95',
    ghost: 'text-gray-500 hover:bg-gray-100 font-medium',
    danger: 'bg-red-500 text-white font-semibold hover:bg-red-600 active:scale-95',
  }
  const ss: Record<string, string> = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={cx('inline-flex items-center gap-1.5 rounded-xl transition-all', vs[v], ss[sz], full && 'w-full justify-center', (disabled || loading) && 'opacity-50 cursor-not-allowed')}
      style={v === 'primary' ? { backgroundColor: 'var(--p)' } : {}}>
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

const Card = ({ children, className, onClick }: any) => (
  <div className={cx('bg-white rounded-2xl border border-gray-100 shadow-sm', onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)} onClick={onClick}>
    {children}
  </div>
)

const Stat = ({ label, value, change, pre = '', suf = '', loading, color }: any) => (
  <Card className="p-4">
    {loading ? <div className="h-8 bg-gray-100 rounded-lg animate-pulse mb-2" /> : (
      <p className={cx('text-2xl font-bold', color || 'text-gray-900')}>{pre}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suf}</p>
    )}
    {change !== undefined && <span className={cx('text-xs font-medium', change >= 0 ? 'text-emerald-600' : 'text-red-500')}>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}%</span>}
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </Card>
)

const Modal = ({ open, onClose, title, children }: any) => (
  <AnimatePresence>
    {open && <>
      <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto max-w-lg mx-auto"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </>}
  </AnimatePresence>
)

const Field = ({ label, value, onChange, placeholder, type = 'text', options, disabled, required }: any) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}{required && ' *'}</label>}
    {options ? (
      <select value={value} onChange={onChange} disabled={disabled}
        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none bg-white text-gray-900 focus:border-indigo-300 transition-colors">
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} required={required}
        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-300 transition-colors disabled:opacity-60" />
    )}
  </div>
)

const Toast = ({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [])
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className={cx('fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 max-w-sm',
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white')}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </motion.div>
  )
}

const useToast = () => {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const show = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })
  const hide = () => setToast(null)
  const el = toast && <AnimatePresence><Toast key={toast.msg} msg={toast.msg} type={toast.type} onDone={hide} /></AnimatePresence>
  return { show, el }
}

// ─── BAR CHART ───────────────────────────────────────────────
const BarChart = ({ data }: { data: typeof CHART_DATA }) => {
  const max = Math.max(...data.flatMap(d => [d.r, d.d]))
  return (
    <div className="flex items-end gap-1 h-28 pb-5">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full">
          <div className="flex items-end gap-0.5 flex-1 w-full">
            <motion.div className="flex-1 rounded-t-md opacity-80" style={{ backgroundColor: 'var(--p)' }}
              initial={{ height: 0 }} animate={{ height: `${(d.r / max) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.4 }} />
            <motion.div className="flex-1 rounded-t-md bg-red-200"
              initial={{ height: 0 }} animate={{ height: `${(d.d / max) * 100}%` }} transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }} />
          </div>
          <span className="text-xs text-gray-400">{d.m}</span>
        </div>
      ))}
    </div>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────
const Login = ({ onLogin }: { onLogin: (u: AppUser) => void }) => {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const go = async () => {
    if (!email || !pw) { setErr('Preencha e-mail e senha.'); return }
    setLoading(true); setErr('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw })
      if (error || !data.user) { setErr(error?.message || 'Credenciais inválidas.'); setLoading(false); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      onLogin({
        id: data.user.id,
        name: profile?.full_name || data.user.email?.split('@')[0] || 'Usuário',
        email: data.user.email || '',
        role: (profile?.role as AppUser['role']) || 'FUNCIONARIO',
        company_id: profile?.company_id || null,
      })
    } catch (e: any) {
      setErr('Erro de conexão: ' + (e?.message || 'tente novamente.'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl text-2xl font-bold" style={{ backgroundColor: 'var(--p)' }}>N</div>
          <h1 className="text-2xl font-bold text-gray-900">NexusERP</h1>
          <p className="text-sm text-gray-400 mt-1">Gestão empresarial inteligente</p>
        </div>
        <Card className="p-6 space-y-4">
          <Field label="E-mail" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="seu@email.com" type="email" />
          <Field label="Senha" value={pw} onChange={(e: any) => setPw(e.target.value)} placeholder="••••••••" type="password" />
          {err && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{err}</p>}
          <Btn v="primary" sz="lg" onClick={go} loading={loading} full>{loading ? 'Entrando...' : 'Entrar'}</Btn>
        </Card>
        <p className="text-center text-xs text-gray-400 mt-4">NexusERP © 2025</p>
      </motion.div>
    </div>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────
const Sidebar = ({ user, page, go, logout, companyName }: any) => {
  const isSA = user.role === 'SUPER_ADMIN'
  const isAdmin = user.role === 'ADMIN_EMPRESA' || isSA

  const menu = isSA ? [
    { id: 'sa-dash', l: 'Dashboard', emoji: '🏠' },
    { id: 'sa-companies', l: 'Empresas', emoji: '🏢' },
    { id: 'sa-themes', l: 'White Label', emoji: '🎨' },
    { id: 'sa-users', l: 'Usuários', emoji: '👥' },
    { id: 'sa-subs', l: 'Assinaturas', emoji: '💳' },
    { id: 'sa-logs', l: 'Logs', emoji: '📋' },
  ] : [
    { id: 'dash', l: 'Dashboard', emoji: '🏠' },
    { id: 'products', l: 'Produtos', emoji: '📦' },
    { id: 'inventory', l: 'Estoque', emoji: '🗄️' },
    { id: 'pdv', l: 'PDV', emoji: '🛒' },
    { id: 'sales', l: 'Vendas', emoji: '🛍️' },
    ...(isAdmin ? [
      { id: 'cashflow', l: 'Fluxo de Caixa', emoji: '💰' },
      { id: 'payable', l: 'Contas a Pagar', emoji: '📤' },
      { id: 'receivable', l: 'A Receber', emoji: '📥' },
    ] : []),
    { id: 'price', l: 'Formação de Preço', emoji: '🏷️' },
    { id: 'reports', l: 'Relatórios', emoji: '📊' },
    ...(isAdmin ? [
      { id: 'users', l: 'Usuários', emoji: '👤' },
      { id: 'settings', l: 'Configurações', emoji: '⚙️' },
    ] : []),
  ]

  const initials = isSA ? 'SA' : companyName?.[0] || 'E'

  return (
    <div className="w-56 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl text-white text-xs font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--p)' }}>{initials}</div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 truncate">{isSA ? 'NexusERP' : companyName}</p>
            <p className="text-xs text-gray-400 truncate">{user.name}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menu.map(m => (
          <button key={m.id} onClick={() => go(m.id)}
            className={cx('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left',
              page === m.id ? 'text-white font-medium' : 'text-gray-500 hover:bg-gray-50')}
            style={page === m.id ? { backgroundColor: 'var(--p)' } : {}}>
            <span className="text-base">{m.emoji}</span>{m.l}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: 'var(--p)' }}>{user.name?.[0] || 'U'}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
            <Badge v={user.role as BadgeVariant}>{user.role.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          🚪 Sair
        </button>
      </div>
    </div>
  )
}

// ─── TOPBAR ──────────────────────────────────────────────────
const Topbar = ({ title, onMenu }: any) => (
  <div className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 shrink-0">
    <div className="flex items-center gap-3">
      <button onClick={onMenu} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-xl text-gray-500">☰</button>
      <span className="font-semibold text-gray-900 text-sm">{title}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 hidden sm:block">{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      <div className="w-2 h-2 bg-emerald-400 rounded-full" title="Conectado ao Supabase" />
    </div>
  </div>
)

// ─── PAGE WRAPPER ─────────────────────────────────────────────
const Page = ({ children }: { children: React.ReactNode }) => (
  <motion.div className="p-4 space-y-4 pb-20" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
    {children}
  </motion.div>
)

const PageHeader = ({ title, sub, action }: any) => (
  <div className="flex items-start justify-between">
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    {action}
  </div>
)

// ─── SUPER ADMIN DASHBOARD ───────────────────────────────────
const SADash = ({ user }: { user: AppUser }) => {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('companies').select('*, subscriptions(*)').order('created_at', { ascending: false })
      setCompanies(data?.length ? data : MOCK_COMPANIES)
      setLoading(false)
    }
    load()
  }, [])

  const active = companies.filter(c => c.subscription_status === 'active' || c.status === 'active').length
  const mrr = active * 599

  return (
    <Page>
      {toast.el}
      <PageHeader title="Dashboard Master" sub="Controle total da plataforma NexusERP" />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total de Empresas" value={companies.length} loading={loading} />
        <Stat label="Empresas Ativas" value={active} loading={loading} color="text-emerald-600" />
        <Stat label="MRR Estimado" value={mrr} pre="R$ " loading={loading} color="text-indigo-600" />
        <Stat label="Usuários Totais" value={companies.length * 8} loading={loading} />
      </div>
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 mb-1">Receita da Plataforma</p>
        <div className="flex gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'var(--p)' }} />Receita</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-200 inline-block" />Custos</span>
        </div>
        <BarChart data={CHART_DATA} />
      </Card>
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Empresas Cadastradas</p>
        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div> : (
          <div className="space-y-2">
            {companies.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: 'var(--p)' }}>{c.name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.cnpj || '—'}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <Badge v={(c.subscription_status || c.status || 'trial') as BadgeVariant}>{c.subscription_status || c.status || 'trial'}</Badge>
                  {c.plan && <div><Badge v={(c.plan || 'starter') as BadgeVariant}>{c.plan}</Badge></div>}
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">🏢</p>
                <p className="text-sm">Nenhuma empresa. Execute o schema SQL primeiro.</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </Page>
  )
}

// ─── SA COMPANIES ─────────────────────────────────────────────
const SACompanies = () => {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', cnpj: '', email: '', plan: 'starter' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
      setCompanies(data?.length ? data : MOCK_COMPANIES)
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    const { data, error } = await supabase.from('companies').insert({
      name: form.name, cnpj: form.cnpj, email: form.email,
      subscription_status: 'trial', plan: form.plan,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select()
    if (error) toast.show('Erro: ' + error.message, 'error')
    else { toast.show('Empresa criada!'); setModal(false); setCompanies(p => [data![0], ...p]) }
    setSaving(false)
  }

  const block = async (id: string, status: string) => {
    const newStatus = status === 'blocked' ? 'active' : 'blocked'
    await supabase.from('companies').update({ subscription_status: newStatus }).eq('id', id)
    setCompanies(p => p.map(c => c.id === id ? { ...c, subscription_status: newStatus } : c))
    toast.show(`Empresa ${newStatus === 'blocked' ? 'bloqueada' : 'desbloqueada'}!`)
  }

  return (
    <Page>
      {toast.el}
      <PageHeader title="Empresas" sub={`${companies.length} cadastradas`}
        action={<Btn onClick={() => setModal(true)}>+ Nova Empresa</Btn>} />
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div> : (
        <div className="space-y-2">
          {companies.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: 'var(--p)' }}>{c.name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.cnpj || c.email || '—'}</p>
                  <div className="flex gap-1 mt-1">
                    <Badge v={(c.subscription_status || 'trial') as BadgeVariant}>{c.subscription_status || 'trial'}</Badge>
                    <Badge v={(c.plan || 'starter') as BadgeVariant}>{c.plan || 'starter'}</Badge>
                  </div>
                </div>
                <Btn v="secondary" sz="sm" onClick={() => block(c.id, c.subscription_status)}>
                  {c.subscription_status === 'blocked' ? '🔓' : '🔒'}
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Nova Empresa">
        <div className="space-y-3">
          <Field label="Nome da Empresa" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="Empresa Ltda" required />
          <Field label="CNPJ" value={form.cnpj} onChange={(e: any) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
          <Field label="E-mail" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} type="email" />
          <Field label="Plano" value={form.plan} onChange={(e: any) => setForm({ ...form, plan: e.target.value })}
            options={[{ value: 'starter', label: 'Starter — R$ 199/mês' }, { value: 'professional', label: 'Professional — R$ 599/mês' }, { value: 'enterprise', label: 'Enterprise — R$ 1.499/mês' }]} />
          <div className="flex gap-2 pt-2">
            <Btn v="secondary" full onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn v="primary" full onClick={save} loading={saving}>Criar Empresa</Btn>
          </div>
        </div>
      </Modal>
    </Page>
  )
}

// ─── WHITE LABEL ─────────────────────────────────────────────
const SAThemes = () => {
  const [primary, setPrimary] = useState('#6366f1')
  const [name, setName] = useState('Minha Empresa')
  const [applied, setApplied] = useState(false)
  const presets = [
    { n: 'Índigo', p: '#6366f1' }, { n: 'Azul', p: '#3b82f6' }, { n: 'Verde', p: '#10b981' },
    { n: 'Rubi', p: '#dc2626' }, { n: 'Âmbar', p: '#f59e0b' }, { n: 'Carvão', p: '#111827' },
    { n: 'Rosa', p: '#ec4899' }, { n: 'Ciano', p: '#06b6d4' },
  ]
  const apply = () => { applyTheme(primary); setApplied(true); setTimeout(() => setApplied(false), 2000) }
  return (
    <Page>
      <PageHeader title="White Label" sub="Personalize a identidade visual por empresa" />
      <Card className="p-4 space-y-4">
        <Field label="Nome do Sistema" value={name} onChange={(e: any) => setName(e.target.value)} />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cor Principal</p>
          <div className="flex items-center gap-3">
            <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="w-12 h-10 rounded-xl border border-gray-200 cursor-pointer p-1" />
            <input value={primary} onChange={e => setPrimary(e.target.value)} className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl font-mono" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Presets</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map(p => (
              <button key={p.n} onClick={() => setPrimary(p.p)} title={p.n}
                className="w-9 h-9 rounded-xl shadow-sm hover:scale-110 transition-transform border-2"
                style={{ backgroundColor: p.p, borderColor: primary === p.p ? '#fff' : 'transparent', boxShadow: primary === p.p ? '0 0 0 2px ' + p.p : '' }} />
            ))}
          </div>
        </div>
        <Btn v="primary" sz="lg" onClick={apply} full>{applied ? '✓ Tema Aplicado!' : 'Aplicar Tema'}</Btn>
      </Card>
      <Card className="p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Preview ao Vivo</p>
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: primary }}>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-bold">{name[0]}</div>
            <span className="text-white text-sm font-semibold">{name}</span>
          </div>
          <div className="bg-gray-50 p-2 space-y-1">
            {['Dashboard', 'Produtos', 'Vendas', 'Financeiro'].map((item, i) => (
              <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
                style={i === 0 ? { backgroundColor: primary, color: '#fff' } : { color: '#6b7280' }}>
                <span>{['🏠', '📦', '🛍️', '💰'][i]}</span>{item}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Page>
  )
}

// ─── SA SUBSCRIPTIONS ─────────────────────────────────────────
const SASubs = () => {
  return (
    <Page>
      <PageHeader title="Assinaturas" sub="Gestão de planos e pagamentos" />
      <div className="grid grid-cols-3 gap-3">
        {[
          { plan: 'Starter', price: 'R$ 199', users: '5', products: '100', color: '#6b7280' },
          { plan: 'Professional', price: 'R$ 599', users: '25', products: '1.000', color: 'var(--p)' },
          { plan: 'Enterprise', price: 'R$ 1.499', users: '100', products: '5.000', color: '#7c3aed' },
        ].map(p => (
          <Card key={p.plan} className="p-4 text-center">
            <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: p.color }}>P</div>
            <p className="text-xs font-bold text-gray-900">{p.plan}</p>
            <p className="text-lg font-bold mt-1" style={{ color: p.color }}>{p.price}</p>
            <p className="text-xs text-gray-400">/mês</p>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>{p.users} usuários</p>
              <p>{p.products} produtos</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Integração Stripe</p>
        <p className="text-xs text-gray-500 mb-3">Configure o webhook do Stripe para processar pagamentos automaticamente.</p>
        <div className="bg-gray-900 rounded-xl p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
          <p>STRIPE_SECRET_KEY=sk_live_...</p>
          <p>STRIPE_WEBHOOK_SECRET=whsec_...</p>
        </div>
        <p className="text-xs text-gray-400 mt-2">Veja o README para a Edge Function completa do Stripe.</p>
      </Card>
    </Page>
  )
}

// ─── SA LOGS ─────────────────────────────────────────────────
const SALogs = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(50)
      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])
  const mockLogs = [
    { id: 1, action: 'LOGIN', user_email: 'admin@empresa.com', created_at: new Date().toISOString(), level: 'info' },
    { id: 2, action: 'SALE_CREATED', user_email: 'func@empresa.com', created_at: new Date().toISOString(), level: 'info' },
    { id: 3, action: 'PRODUCT_UPDATED', user_email: 'admin@empresa.com', created_at: new Date(Date.now() - 60000).toISOString(), level: 'info' },
  ]
  const items = logs.length ? logs : mockLogs
  return (
    <Page>
      <PageHeader title="Logs do Sistema" sub="Auditoria de ações" />
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-2">
          {items.map(l => (
            <Card key={l.id} className="p-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">📋</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-semibold text-gray-900">{l.action}</p>
                  <p className="text-xs text-gray-400">{l.user_email} · {fmtDate(l.created_at)}</p>
                </div>
                <Badge v={l.level === 'error' ? 'cancelled' : 'active' as BadgeVariant}>{l.level || 'info'}</Badge>
              </div>
            </Card>
          ))}
          {items.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Nenhum log registrado</p>}
        </div>
      )}
    </Page>
  )
}

// ─── COMPANY DASHBOARD ────────────────────────────────────────
const CoDash = ({ user }: { user: AppUser }) => {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const queries = [
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(10),
      ]
      if (user.company_id) {
        queries[0] = supabase.from('products').select('*').eq('company_id', user.company_id).order('created_at', { ascending: false }).limit(20)
        queries[1] = supabase.from('sales').select('*').eq('company_id', user.company_id).order('created_at', { ascending: false }).limit(10)
      }
      const [{ data: prods }, { data: sls }] = await Promise.all(queries)
      setProducts(prods?.length ? prods : MOCK_PRODUCTS)
      setSales(sls?.length ? sls : MOCK_SALES)
      setLoading(false)
    }
    load()
  }, [])

  const totalVendas = sales.filter(s => s.status === 'completed').reduce((a, s) => a + (s.total || 0), 0)
  const critical = products.filter(p => (p.stock_quantity || 0) <= (p.min_stock || 5))

  return (
    <Page>
      <PageHeader title="Dashboard" sub={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Faturamento" value={totalVendas} pre="R$ " loading={loading} color="text-indigo-600" />
        <Stat label="Vendas" value={sales.length} loading={loading} />
        <Stat label="Produtos" value={products.length} loading={loading} />
        <Stat label="Est. Crítico" value={critical.length} loading={loading} color={critical.length > 0 ? 'text-amber-600' : 'text-gray-900'} />
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Fluxo de Caixa</p>
          <div className="flex gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: 'var(--p)' }} />Rec.</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-200 inline-block" />Desp.</span>
          </div>
        </div>
        <BarChart data={CHART_DATA} />
      </Card>
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Últimas Vendas</p>
        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div> : (
          <div className="space-y-2">
            {sales.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {(s.customer_name || 'C')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.customer_name || 'Cliente'}</p>
                  <p className="text-xs text-gray-400">{fmtDate(s.created_at)} · {s.payment_method || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">R$ {fmt(s.total || 0)}</p>
                  <Badge v={(s.status || 'pending') as BadgeVariant}>{s.status}</Badge>
                </div>
              </div>
            ))}
            {sales.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda ainda</p>}
          </div>
        )}
      </Card>
      {critical.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-amber-600 mb-3">⚠️ Estoque Crítico ({critical.length})</p>
          <div className="space-y-2">
            {critical.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-xl">
                <span className="text-lg">📦</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600">{p.stock_quantity} un</p>
                  <p className="text-xs text-gray-400">mín: {p.min_stock}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </Page>
  )
}

// ─── PRODUCTS ─────────────────────────────────────────────────
const Products = ({ user }: { user: AppUser }) => {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', price: '', cost_price: '', stock_quantity: '0', min_stock: '5', unit: 'un' })
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('products').select('*').order('name')
    if (user.company_id) q = q.eq('company_id', user.company_id)
    const { data } = await q
    setProducts(data?.length ? data : MOCK_PRODUCTS)
    setLoading(false)
  }, [user.company_id])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name || !form.sku) { toast.show('Nome e SKU são obrigatórios', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase.from('products').insert({
      name: form.name, sku: form.sku,
      price: parseFloat(form.price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      unit: form.unit, active: true,
      company_id: user.company_id,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select()
    if (error) toast.show('Erro: ' + error.message, 'error')
    else { toast.show('Produto criado com sucesso!'); setModal(false); setProducts(p => [data![0], ...p]); setForm({ name: '', sku: '', price: '', cost_price: '', stock_quantity: '0', min_stock: '5', unit: 'un' }) }
    setSaving(false)
  }

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))

  return (
    <Page>
      {toast.el}
      <PageHeader title="Produtos" sub={`${products.length} cadastrados`}
        action={<Btn onClick={() => setModal(true)}>+ Novo</Btn>} />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto ou SKU..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none bg-white focus:border-indigo-300" />
      </div>
      {loading ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div> : (
        <div className="space-y-2">
          {filtered.map(p => {
            const status = (p.stock_quantity || 0) === 0 ? 'sem' : (p.stock_quantity || 0) <= (p.min_stock || 5) ? 'critico' : 'ok'
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg shrink-0">📦</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-700">R$ {fmt(p.price || 0)}</span>
                      <span className="text-gray-300">·</span>
                      <span className={cx('text-xs font-semibold', status === 'ok' ? 'text-emerald-600' : status === 'critico' ? 'text-amber-600' : 'text-red-500')}>
                        {p.stock_quantity || 0} {p.unit || 'un'}
                      </span>
                      <Badge v={(status === 'ok' ? 'active' : status === 'critico' ? 'pending' : 'cancelled') as BadgeVariant}>
                        {status === 'ok' ? 'Normal' : status === 'critico' ? 'Crítico' : 'Sem estoque'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">Margem</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--p)' }}>
                      {p.cost_price ? Math.round(((p.price - p.cost_price) / p.price) * 100) : '—'}%
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📦</p>
              <p className="text-sm">{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>
            </div>
          )}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Novo Produto">
        <div className="space-y-3">
          <Field label="Nome do Produto" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Café Espresso 500g" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU" value={form.sku} onChange={(e: any) => setForm({ ...form, sku: e.target.value })} placeholder="PROD-001" required />
            <Field label="Unidade" value={form.unit} onChange={(e: any) => setForm({ ...form, unit: e.target.value })}
              options={[{ value: 'un', label: 'Unidade' }, { value: 'kg', label: 'Kg' }, { value: 'g', label: 'Gramas' }, { value: 'l', label: 'Litros' }, { value: 'cx', label: 'Caixa' }]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Custo (R$)" value={form.cost_price} onChange={(e: any) => setForm({ ...form, cost_price: e.target.value })} type="number" placeholder="0,00" />
            <Field label="Preço Venda (R$)" value={form.price} onChange={(e: any) => setForm({ ...form, price: e.target.value })} type="number" placeholder="0,00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estoque Inicial" value={form.stock_quantity} onChange={(e: any) => setForm({ ...form, stock_quantity: e.target.value })} type="number" />
            <Field label="Estoque Mínimo" value={form.min_stock} onChange={(e: any) => setForm({ ...form, min_stock: e.target.value })} type="number" />
          </div>
          {form.price && form.cost_price && parseFloat(form.price) > 0 && (
            <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700">
              💡 Margem de lucro: <strong>{Math.round(((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100)}%</strong>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Btn v="secondary" full onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn v="primary" full onClick={save} loading={saving}>Salvar Produto</Btn>
          </div>
        </div>
      </Modal>
    </Page>
  )
}

// ─── INVENTORY ────────────────────────────────────────────────
const Inventory = ({ user }: { user: AppUser }) => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [selProd, setSelProd] = useState<any>(null)
  const [qty, setQty] = useState('')
  const [type, setType] = useState('in')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('products').select('*').order('name')
    if (user.company_id) q = q.eq('company_id', user.company_id)
    const { data } = await q
    setProducts(data?.length ? data : MOCK_PRODUCTS)
    setLoading(false)
  }, [user.company_id])

  useEffect(() => { load() }, [load])

  const saveMovement = async () => {
    if (!selProd || !qty) { toast.show('Selecione produto e quantidade', 'error'); return }
    setSaving(true)
    const q = parseInt(qty)
    const newStock = type === 'in' ? (selProd.stock_quantity || 0) + q : Math.max(0, (selProd.stock_quantity || 0) - q)
    const [upd] = await Promise.all([
      supabase.from('products').update({ stock_quantity: newStock, updated_at: new Date().toISOString() }).eq('id', selProd.id),
      supabase.from('inventory_movements').insert({
        product_id: selProd.id, company_id: user.company_id,
        type, quantity: q, notes: notes || 'Ajuste manual',
        created_at: new Date().toISOString(),
      }),
    ])
    toast.show(`Movimentação registrada! Novo estoque: ${newStock} ${selProd.unit || 'un'}`)
    setModal(false); setQty(''); setNotes('')
    setProducts(p => p.map(prod => prod.id === selProd.id ? { ...prod, stock_quantity: newStock } : prod))
    setSaving(false)
  }

  return (
    <Page>
      {toast.el}
      <PageHeader title="Controle de Estoque" sub={`${products.length} produtos`}
        action={<Btn onClick={() => setModal(true)}>+ Movimentação</Btn>} />
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Sem estoque', value: products.filter(p => (p.stock_quantity || 0) === 0).length, color: 'text-red-500' },
          { label: 'Crítico', value: products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= (p.min_stock || 5)).length, color: 'text-amber-600' },
          { label: 'Normal', value: products.filter(p => (p.stock_quantity || 0) > (p.min_stock || 5)).length, color: 'text-emerald-600' },
        ].map(s => (
          <Card key={s.label} className="p-3">
            <p className={cx('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </Card>
        ))}
      </div>
      {loading ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div> : (
        <div className="space-y-2">
          {products.map(p => {
            const pct = Math.min(100, ((p.stock_quantity || 0) / Math.max((p.min_stock || 5) * 3, 1)) * 100)
            const barColor = (p.stock_quantity || 0) === 0 ? 'bg-red-400' : (p.stock_quantity || 0) <= (p.min_stock || 5) ? 'bg-amber-400' : 'bg-emerald-400'
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">📦</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">{p.stock_quantity || 0}</p>
                    <p className="text-xs text-gray-400">{p.unit || 'un'} · mín {p.min_stock || 5}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div className={cx('h-full rounded-full', barColor)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Movimentação">
        <div className="space-y-3">
          <Field label="Produto" value={selProd?.id || ''} onChange={(e: any) => setSelProd(products.find(p => String(p.id) === e.target.value))}
            options={[{ value: '', label: 'Selecione um produto...' }, ...products.map(p => ({ value: String(p.id), label: `${p.name} (${p.stock_quantity || 0} ${p.unit || 'un'})` }))]} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo" value={type} onChange={(e: any) => setType(e.target.value)}
              options={[{ value: 'in', label: '📥 Entrada' }, { value: 'out', label: '📤 Saída' }]} />
            <Field label="Quantidade" value={qty} onChange={(e: any) => setQty(e.target.value)} type="number" placeholder="0" />
          </div>
          <Field label="Observação" value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Ex: Compra do fornecedor" />
          {selProd && qty && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
              Estoque atual: <strong>{selProd.stock_quantity}</strong> → Novo: <strong>{type === 'in' ? selProd.stock_quantity + parseInt(qty || '0') : Math.max(0, selProd.stock_quantity - parseInt(qty || '0'))}</strong> {selProd.unit || 'un'}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Btn v="secondary" full onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn v="primary" full onClick={saveMovement} loading={saving}>Registrar</Btn>
          </div>
        </div>
      </Modal>
    </Page>
  )
}

// ─── PDV ──────────────────────────────────────────────────────
const PDV = ({ user }: { user: AppUser }) => {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [payMethod, setPayMethod] = useState('pix')
  const [customer, setCustomer] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      let q = supabase.from('products').select('*').eq('active', true).order('name')
      if (user.company_id) q = q.eq('company_id', user.company_id)
      const { data } = await q
      setProducts(data?.length ? data : MOCK_PRODUCTS)
      setLoading(false)
    }
    load()
  }, [])

  const addToCart = (p: any) => {
    if ((p.stock_quantity || 0) <= 0) { toast.show('Produto sem estoque!', 'error'); return }
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id)
      if (ex) {
        if (ex.qty >= (p.stock_quantity || 999)) { toast.show('Estoque insuficiente!', 'error'); return prev }
        return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...p, qty: 1 }]
    })
  }

  const updateQty = (id: any, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  const total = cart.reduce((a, i) => a + (i.price * i.qty), 0)
  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

  const finalize = async () => {
    if (cart.length === 0) { toast.show('Carrinho vazio!', 'error'); return }
    setSaving(true)
    const { data: sale, error } = await supabase.from('sales').insert({
      company_id: user.company_id, customer_name: customer || 'Balcão',
      seller_id: user.id, total, status: 'completed',
      payment_method: payMethod,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select()
    if (error) { toast.show('Erro ao salvar venda: ' + error.message, 'error'); setSaving(false); return }
    if (sale?.[0]?.id) {
      await supabase.from('sale_items').insert(cart.map(i => ({
        sale_id: sale[0].id, product_id: i.id,
        quantity: i.qty, unit_price: i.price, total: i.price * i.qty,
      })))
      // Update stock
      await Promise.all(cart.map(i =>
        supabase.from('products').update({ stock_quantity: Math.max(0, (i.stock_quantity || 0) - i.qty) }).eq('id', i.id)
      ))
    }
    toast.show(`✅ Venda de R$ ${fmt(total)} finalizada!`)
    setCart([]); setCustomer('')
    setSaving(false)
  }

  return (
    <Page>
      {toast.el}
      <PageHeader title="PDV — Ponto de Venda" />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none bg-white" />
      </div>
      {loading ? <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" /> : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.slice(0, 8).map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              className={cx('text-left p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all', (p.stock_quantity || 0) > 0 ? 'hover:shadow-md hover:border-indigo-200 active:scale-95' : 'opacity-50 cursor-not-allowed')}>
              <span className="text-2xl block mb-1">📦</span>
              <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--p)' }}>R$ {fmt(p.price || 0)}</p>
              <p className="text-xs text-gray-400">{p.stock_quantity || 0} {p.unit || 'un'}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="col-span-2 text-center text-sm text-gray-400 py-8">Nenhum produto encontrado</p>}
        </div>
      )}
      {cart.length > 0 && (
        <Card className="p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900">🛒 Carrinho ({cart.length} iten{cart.length !== 1 ? 's' : ''})</p>
          <Field label="Nome do Cliente" value={customer} onChange={(e: any) => setCustomer(e.target.value)} placeholder="Cliente (opcional)" />
          {cart.map(i => (
            <div key={i.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{i.name}</p>
                <p className="text-xs text-gray-400">R$ {fmt(i.price)} each</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQty(i.id, -1)} className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">−</button>
                <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                <button onClick={() => updateQty(i.id, 1)} className="w-6 h-6 rounded-lg text-white text-xs font-bold hover:opacity-80" style={{ backgroundColor: 'var(--p)' }}>+</button>
              </div>
              <p className="text-sm font-bold text-gray-900 w-20 text-right shrink-0">R$ {fmt(i.price * i.qty)}</p>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--p)' }}>R$ {fmt(total)}</span>
            </div>
            <Field label="Pagamento" value={payMethod} onChange={(e: any) => setPayMethod(e.target.value)}
              options={[{ value: 'pix', label: '⚡ PIX' }, { value: 'cash', label: '💵 Dinheiro' }, { value: 'credit_card', label: '💳 Crédito' }, { value: 'debit_card', label: '💳 Débito' }, { value: 'boleto', label: '📄 Boleto' }]} />
            <div className="flex gap-2 mt-3">
              <Btn v="secondary" full onClick={() => setCart([])}>Limpar</Btn>
              <Btn v="primary" full onClick={finalize} loading={saving}>✓ Finalizar</Btn>
            </div>
          </div>
        </Card>
      )}
    </Page>
  )
}

// ─── SALES ────────────────────────────────────────────────────
const Sales = ({ user }: { user: AppUser }) => {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      let q = supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50)
      if (user.company_id) q = q.eq('company_id', user.company_id)
      const { data } = await q
      setSales(data?.length ? data : MOCK_SALES)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? sales : sales.filter(s => s.status === filter)
  const totalCompleted = filtered.filter(s => s.status === 'completed').reduce((a, s) => a + (s.total || 0), 0)

  return (
    <Page>
      <PageHeader title="Vendas" sub={`${filtered.length} registros · R$ ${fmt(totalCompleted)}`} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'completed', 'pending', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cx('px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0', filter === f ? 'text-white' : 'bg-gray-100 text-gray-500')}
            style={filter === f ? { backgroundColor: 'var(--p)' } : {}}>
            {f === 'all' ? 'Todos' : f === 'completed' ? 'Concluídas' : f === 'pending' ? 'Pendentes' : 'Canceladas'}
          </button>
        ))}
      </div>
      {loading ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div> : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                  {(s.customer_name || 'C')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.customer_name || 'Cliente'}</p>
                  <p className="text-xs text-gray-400">{fmtDate(s.created_at)} · {s.payment_method === 'pix' ? '⚡ PIX' : s.payment_method === 'credit_card' ? '💳 Crédito' : s.payment_method === 'cash' ? '💵 Dinheiro' : s.payment_method || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">R$ {fmt(s.total || 0)}</p>
                  <Badge v={(s.status || 'pending') as BadgeVariant}>{s.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🛍️</p>
              <p className="text-sm">Nenhuma venda encontrada</p>
            </div>
          )}
        </div>
      )}
    </Page>
  )
}

// ─── CASH FLOW ────────────────────────────────────────────────
const CashFlow = ({ user }: { user: AppUser }) => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: pay }, { data: rec }] = await Promise.all([
        user.company_id ? supabase.from('accounts_payable').select('*').eq('company_id', user.company_id).order('due_date') : supabase.from('accounts_payable').select('*').order('due_date'),
        user.company_id ? supabase.from('accounts_receivable').select('*').eq('company_id', user.company_id).order('due_date') : supabase.from('accounts_receivable').select('*').order('due_date'),
      ])
      const combined = [
        ...(pay?.length ? pay.map((p: any) => ({ ...p, _type: 'payable' })) : MOCK_ACCOUNTS.map(p => ({ ...p, _type: 'payable' }))),
        ...(rec?.length ? rec.map((r: any) => ({ ...r, _type: 'receivable' })) : []),
      ].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      setItems(combined)
      setLoading(false)
    }
    load()
  }, [])

  const income = items.filter(a => a._type === 'receivable').reduce((s, a) => s + (a.amount || 0), 0)
  const expense = items.filter(a => a._type === 'payable').reduce((s, a) => s + (a.amount || 0), 0)
  const balance = income - expense

  return (
    <Page>
      <PageHeader title="Fluxo de Caixa" />
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Entradas</p>
          <p className="text-sm font-bold text-emerald-600">R$ {fmt(income)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Saídas</p>
          <p className="text-sm font-bold text-red-500">R$ {fmt(expense)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Saldo</p>
          <p className={cx('text-sm font-bold', balance >= 0 ? 'text-emerald-600' : 'text-red-500')}>R$ {fmt(Math.abs(balance))}</p>
        </Card>
      </div>
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Projeção Mensal</p>
        <BarChart data={CHART_DATA} />
      </Card>
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}</div> : (
        <div className="space-y-2">
          {items.map(a => (
            <Card key={`${a._type}-${a.id}`} className="p-3">
              <div className="flex items-center gap-3">
                <div className={cx('w-2.5 h-2.5 rounded-full shrink-0', a._type === 'receivable' ? 'bg-emerald-400' : 'bg-red-400')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.description}</p>
                  <p className="text-xs text-gray-400">{fmtDate(a.due_date)} · {a._type === 'receivable' ? '📥 A receber' : '📤 A pagar'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cx('text-sm font-bold', a._type === 'receivable' ? 'text-emerald-600' : 'text-red-500')}>
                    {a._type === 'receivable' ? '+' : '-'}R$ {fmt(a.amount || 0)}
                  </p>
                  <Badge v={(a.status || 'pending') as BadgeVariant}>{a.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">💰</p>
              <p className="text-sm">Nenhum lançamento registrado</p>
            </div>
          )}
        </div>
      )}
    </Page>
  )
}

// ─── ACCOUNTS ─────────────────────────────────────────────────
const Accounts = ({ user, type }: { user: AppUser; type: 'payable' | 'receivable' }) => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', due_date: '', category: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const table = type === 'payable' ? 'accounts_payable' : 'accounts_receivable'

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from(table).select('*').order('due_date')
    if (user.company_id) q = q.eq('company_id', user.company_id)
    const { data } = await q
    setItems(data?.length ? data : MOCK_ACCOUNTS)
    setLoading(false)
  }, [type, user.company_id])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.description || !form.amount) { toast.show('Preencha os campos obrigatórios', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase.from(table).insert({
      description: form.description, amount: parseFloat(form.amount),
      due_date: form.due_date, category: form.category,
      status: 'pending', company_id: user.company_id,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select()
    if (error) toast.show('Erro: ' + error.message, 'error')
    else { toast.show('Lançamento criado!'); setModal(false); setItems(p => [data![0], ...p]); setForm({ description: '', amount: '', due_date: '', category: '' }) }
    setSaving(false)
  }

  const markPaid = async (id: any) => {
    await supabase.from(table).update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', id)
    setItems(p => p.map(i => i.id === id ? { ...i, status: 'paid' } : i))
    toast.show('Marcado como pago!')
  }

  const pending = items.filter(i => i.status === 'pending').reduce((a, i) => a + (i.amount || 0), 0)
  const paid = items.filter(i => i.status === 'paid').reduce((a, i) => a + (i.amount || 0), 0)
  const title = type === 'payable' ? 'Contas a Pagar' : 'Contas a Receber'

  return (
    <Page>
      {toast.el}
      <PageHeader title={title} sub={`${items.length} lançamentos`}
        action={<Btn onClick={() => setModal(true)}>+ Novo</Btn>} />
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs text-gray-400">Pendente</p>
          <p className="text-xl font-bold text-amber-600">R$ {fmt(pending)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-400">{type === 'payable' ? 'Pago' : 'Recebido'}</p>
          <p className="text-xl font-bold text-emerald-600">R$ {fmt(paid)}</p>
        </Card>
      </div>
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div> : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={cx('w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0', item.status === 'paid' ? 'bg-emerald-50' : 'bg-amber-50')}>
                  {type === 'payable' ? '📤' : '📥'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.description}</p>
                  <p className="text-xs text-gray-400">{fmtDate(item.due_date)} · {item.category || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">R$ {fmt(item.amount || 0)}</p>
                  <Badge v={(item.status || 'pending') as BadgeVariant}>{item.status}</Badge>
                  {item.status === 'pending' && (
                    <button onClick={() => markPaid(item.id)} className="block text-xs text-indigo-500 hover:underline mt-1">Marcar pago</button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">{type === 'payable' ? '📤' : '📥'}</p>
              <p className="text-sm">Nenhum lançamento</p>
            </div>
          )}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={`Novo — ${title}`}>
        <div className="space-y-3">
          <Field label="Descrição" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Fornecedor ABC" required />
          <Field label="Categoria" value={form.category} onChange={(e: any) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Fornecedores, Utilidades..." />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)" value={form.amount} onChange={(e: any) => setForm({ ...form, amount: e.target.value })} type="number" placeholder="0,00" required />
            <Field label="Vencimento" value={form.due_date} onChange={(e: any) => setForm({ ...form, due_date: e.target.value })} type="date" />
          </div>
          <div className="flex gap-2 pt-2">
            <Btn v="secondary" full onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn v="primary" full onClick={save} loading={saving}>Salvar</Btn>
          </div>
        </div>
      </Modal>
    </Page>
  )
}

// ─── PRICE FORMATION ──────────────────────────────────────────
const Price = () => {
  const [cost, setCost] = useState(100)
  const [margin, setMargin] = useState(40)
  const [tax, setTax] = useState(12)
  const [other, setOther] = useState(5)
  const markup = cost / (1 - (margin + tax + other) / 100)
  const profit = markup * (margin / 100)

  return (
    <Page>
      <PageHeader title="Formação de Preço" sub="Calcule o preço ideal de venda" />
      <Card className="p-4 space-y-5">
        {[
          { label: 'Custo do Produto (R$)', value: cost, set: setCost, min: 1, max: 50000, step: 1, isCurrency: true },
          { label: 'Margem de Lucro', value: margin, set: setMargin, min: 1, max: 80, step: 0.5, suffix: '%' },
          { label: 'Impostos', value: tax, set: setTax, min: 0, max: 40, step: 0.5, suffix: '%' },
          { label: 'Outras despesas', value: other, set: setOther, min: 0, max: 30, step: 0.5, suffix: '%' },
        ].map(s => (
          <div key={s.label}>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">{s.label}</label>
              <span className="text-xs font-bold text-gray-900">{s.isCurrency ? `R$ ${fmt(s.value)}` : `${s.value}${s.suffix}`}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full outline-none cursor-pointer" style={{ accentColor: 'var(--p)' }} />
            {s.isCurrency && (
              <input type="number" value={s.value} onChange={e => s.set(parseFloat(e.target.value) || 0)}
                className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none" />
            )}
          </div>
        ))}
      </Card>
      <Card className="p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Resultado</p>
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Custo</p>
            <p className="text-base font-bold text-gray-900">R$ {fmt(cost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Lucro</p>
            <p className="text-base font-bold text-emerald-600">R$ {fmt(profit)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Preço Final</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--p)' }}>R$ {fmt(markup)}</p>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-red-300 transition-all" style={{ width: `${(cost / markup) * 100}%` }} />
          <div className="h-full bg-emerald-300 transition-all" style={{ width: `${(profit / markup) * 100}%` }} />
          <div className="h-full bg-amber-200 transition-all flex-1" />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>Custo {((cost / markup) * 100).toFixed(0)}%</span>
          <span>Lucro {margin}%</span>
          <span>Imp.+Desp. {(tax + other)}%</span>
        </div>
      </Card>
    </Page>
  )
}

// ─── REPORTS ──────────────────────────────────────────────────
const Reports = ({ user }: { user: AppUser }) => {
  const [period, setPeriod] = useState('month')
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      let q = supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(100)
      if (user.company_id) q = q.eq('company_id', user.company_id)
      const { data } = await q
      setSales(data?.length ? data : MOCK_SALES)
      setLoading(false)
    }
    load()
  }, [])

  const completed = sales.filter(s => s.status === 'completed')
  const revenue = completed.reduce((a, s) => a + (s.total || 0), 0)
  const ticket = completed.length ? revenue / completed.length : 0

  const byMethod = ['pix', 'credit_card', 'debit_card', 'cash', 'boleto'].map(m => ({
    label: m === 'pix' ? '⚡ PIX' : m === 'credit_card' ? '💳 Crédito' : m === 'debit_card' ? '💳 Débito' : m === 'cash' ? '💵 Dinheiro' : '📄 Boleto',
    count: sales.filter(s => s.payment_method === m).length,
    pct: sales.length ? Math.round((sales.filter(s => s.payment_method === m).length / sales.length) * 100) : 0,
    color: ['bg-indigo-400', 'bg-blue-400', 'bg-purple-400', 'bg-emerald-400', 'bg-amber-400'][['pix','credit_card','debit_card','cash','boleto'].indexOf(m)],
  })).filter(m => m.count > 0)

  return (
    <Page>
      <PageHeader title="Relatórios" sub="Análise do seu negócio"
        action={<Field value={period} onChange={(e: any) => setPeriod(e.target.value)}
          options={[{ value: 'today', label: 'Hoje' }, { value: 'week', label: 'Semana' }, { value: 'month', label: 'Mês' }, { value: 'year', label: 'Ano' }]} />} />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Faturamento" value={revenue} pre="R$ " loading={loading} color="text-indigo-600" />
        <Stat label="Ticket Médio" value={ticket} pre="R$ " loading={loading} />
        <Stat label="Total Vendas" value={sales.length} loading={loading} />
        <Stat label="Concluídas" value={completed.length} loading={loading} color="text-emerald-600" />
      </div>
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Faturamento Mensal</p>
        <BarChart data={CHART_DATA} />
      </Card>
      {byMethod.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Formas de Pagamento</p>
          <div className="space-y-3">
            {byMethod.map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{m.label}</span>
                  <span className="font-semibold">{m.pct}% ({m.count} vendas)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div className={cx('h-full rounded-full', m.color)} initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </Page>
  )
}

// ─── USERS ────────────────────────────────────────────────────
const Users = ({ user }: { user: AppUser }) => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      let q = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (user.company_id && user.role !== 'SUPER_ADMIN') q = q.eq('company_id', user.company_id)
      const { data } = await q
      setUsers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Page>
      <PageHeader title="Usuários" sub={`${users.length} cadastrados`} />
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div> : (
        <div className="space-y-2">
          {users.map(u => (
            <Card key={u.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: 'var(--p)' }}>
                  {(u.full_name || u.email || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <Badge v={(u.role || 'FUNCIONARIO') as BadgeVariant}>{u.role?.replace(/_/g, ' ') || '—'}</Badge>
              </div>
            </Card>
          ))}
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">👤</p>
              <p className="text-sm">Nenhum usuário encontrado</p>
              <p className="text-xs mt-1">Crie usuários no painel do Supabase → Authentication</p>
            </div>
          )}
        </div>
      )}
    </Page>
  )
}

// ─── SETTINGS ─────────────────────────────────────────────────
const Settings = ({ user, onApplyTheme }: { user: AppUser; onApplyTheme: (p: string) => void }) => {
  const [primary, setPrimary] = useState('#6366f1')
  const [saved, setSaved] = useState(false)
  const toast = useToast()

  const save = async () => {
    applyTheme(primary)
    onApplyTheme(primary)
    if (user.company_id) {
      await supabase.from('company_settings').upsert({ company_id: user.company_id, primary_color: primary, updated_at: new Date().toISOString() })
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
    toast.show('Tema aplicado!')
  }

  return (
    <Page>
      {toast.el}
      <PageHeader title="Configurações" />
      <Card className="p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase">Minha Conta</p>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: 'var(--p)' }}>
            {user.name?.[0] || 'U'}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
            <Badge v={user.role as BadgeVariant}>{user.role.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
      </Card>
      <Card className="p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase">Aparência / Tema</p>
        <div>
          <div className="flex items-center gap-3 mb-3">
            <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="w-12 h-10 rounded-xl border border-gray-200 cursor-pointer p-1" />
            <input value={primary} onChange={e => setPrimary(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl font-mono" />
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {['#6366f1', '#3b82f6', '#10b981', '#dc2626', '#f59e0b', '#111827', '#ec4899', '#06b6d4'].map(c => (
              <button key={c} onClick={() => setPrimary(c)} className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: primary === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
        </div>
        <Btn v="primary" full sz="lg" onClick={save}>{saved ? '✓ Aplicado!' : 'Aplicar Tema'}</Btn>
      </Card>
      <Card className="p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Conexão Supabase</p>
        <div className="space-y-1 text-xs font-mono text-gray-500 break-all">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
            <span className="font-semibold text-emerald-600">Conectado</span>
          </div>
          <p>URL: qhrunrvitxmjyihzouex.supabase.co</p>
        </div>
      </Card>
    </Page>
  )
}

// ─── APP ─────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [page, setPage] = useState('dash')
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState(false)
  const [companyName, setCompanyName] = useState('NexusERP')

  useEffect(() => {
    applyTheme('#6366f1')
    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        const u: AppUser = {
          id: session.user.id,
          name: profile?.full_name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          role: (profile?.role as AppUser['role']) || 'FUNCIONARIO',
          company_id: profile?.company_id || null,
        }
        setUser(u)
        setPage(u.role === 'SUPER_ADMIN' ? 'sa-dash' : 'dash')
        if (u.company_id) {
          const { data: settings } = await supabase.from('company_settings').select('*').eq('company_id', u.company_id).single()
          if (settings?.primary_color) applyTheme(settings.primary_color)
          const { data: co } = await supabase.from('companies').select('name').eq('id', u.company_id).single()
          if (co?.name) setCompanyName(co.name)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); setPage('dash') }
    })
    return () => subscription.unsubscribe()
  }, [])

  const login = async (u: AppUser) => {
    setUser(u)
    setPage(u.role === 'SUPER_ADMIN' ? 'sa-dash' : 'dash')
    if (u.company_id) {
      const { data: settings } = await supabase.from('company_settings').select('*').eq('company_id', u.company_id).single()
      if (settings?.primary_color) applyTheme(settings.primary_color)
      const { data: co } = await supabase.from('companies').select('name').eq('id', u.company_id).single()
      if (co?.name) setCompanyName(co.name)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null); applyTheme('#6366f1')
  }

  const TITLES: Record<string, string> = {
    'sa-dash': 'Dashboard Master', 'sa-companies': 'Empresas', 'sa-themes': 'White Label',
    'sa-users': 'Usuários', 'sa-subs': 'Assinaturas', 'sa-logs': 'Logs',
    dash: 'Dashboard', products: 'Produtos', inventory: 'Estoque', pdv: 'PDV',
    sales: 'Vendas', cashflow: 'Fluxo de Caixa', payable: 'Contas a Pagar',
    receivable: 'A Receber', price: 'Formação de Preço', reports: 'Relatórios',
    users: 'Usuários', settings: 'Configurações',
  }

  const renderPage = () => {
    if (!user) return null
    switch (page) {
      case 'sa-dash': return <SADash user={user} />
      case 'sa-companies': return <SACompanies />
      case 'sa-themes': return <SAThemes />
      case 'sa-users': return <Users user={user} />
      case 'sa-subs': return <SASubs />
      case 'sa-logs': return <SALogs />
      case 'dash': return <CoDash user={user} />
      case 'products': return <Products user={user} />
      case 'inventory': return <Inventory user={user} />
      case 'pdv': return <PDV user={user} />
      case 'sales': return <Sales user={user} />
      case 'cashflow': return <CashFlow user={user} />
      case 'payable': return <Accounts user={user} type="payable" />
      case 'receivable': return <Accounts user={user} type="receivable" />
      case 'price': return <Price />
      case 'reports': return <Reports user={user} />
      case 'users': return <Users user={user} />
      case 'settings': return <Settings user={user} onApplyTheme={applyTheme} />
      default: return null
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold animate-pulse" style={{ backgroundColor: 'var(--p)' }}>N</div>
        <p className="text-sm text-gray-400">Carregando NexusERP...</p>
      </div>
    </div>
  )

  if (!user) return <Login onLogin={login} />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {drawer && <>
          <motion.div className="fixed inset-0 bg-black/40 z-30 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
          <motion.div className="fixed left-0 top-0 h-full z-40 lg:hidden shadow-2xl" initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
            <Sidebar user={user} page={page} go={(p: string) => { setPage(p); setDrawer(false) }} logout={logout} companyName={companyName} />
          </motion.div>
        </>}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar user={user} page={page} go={setPage} logout={logout} companyName={companyName} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar title={TITLES[page] || ''} onMenu={() => setDrawer(true)} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <div key={page}>
              {renderPage()}
            </div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
