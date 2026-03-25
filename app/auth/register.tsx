'use client'

// ============================================================
//  app/auth/register/page.tsx
//  Registro de nuevo usuario con validación de whitelist
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import siteConfig from '@/site.config'
import { Mail, Lock, User, AtSign, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [alias, setAlias] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Verificar whitelist antes de continuar
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    // Verificar si whitelist está activa
    const { data: setting } = await supabase
      .from('site_settings').select('value').eq('key', 'whitelist_enabled').single()

    if (setting?.value === true) {
      const { data: entry } = await supabase
        .from('whitelist').select('id').eq('email', email.toLowerCase()).single()
      if (!entry) {
        setError('Este correo no está autorizado para registrarse. Contacta al administrador.')
        setLoading(false)
        return
      }
    }
    setLoading(false)
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('Las contraseñas no coinciden')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (!alias.trim()) return setError('El alias es obligatorio')
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), alias: alias.trim().toLowerCase().replace(/\s+/g, '_') },
      },
    })

    if (err) {
      if (err.message.includes('already registered')) {
        setError('Este correo ya está registrado.')
      } else if (err.message.includes('no autorizado') || err.message.includes('whitelist')) {
        setError('Este correo no está autorizado para registrarse.')
      } else {
        setError(err.message)
      }
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '24px',
            margin: '0 auto 12px',
            boxShadow: '0 4px 16px rgba(26,111,232,0.3)',
          }}>
            {siteConfig.name[0]}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>Crear cuenta</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            {step === 1 ? 'Primero verifica tu correo' : 'Completa tus datos'}
          </p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: step >= s ? 'var(--color-primary)' : 'var(--color-border)',
                color: step >= s ? 'white' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700,
                transition: 'all var(--transition)',
              }}>
                {s}
              </div>
              {s < 2 && <div style={{ width: '40px', height: '2px', background: step > s ? 'var(--color-primary)' : 'var(--color-border)' }} />}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {/* ── Paso 1: verificar correo ──── */}
          {step === 1 && (
            <form onSubmit={handleCheckEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Correo institucional
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input className="input" type="email" placeholder="tu@correo.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required style={{ paddingLeft: '38px' }} />
                </div>
              </div>

              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary-muted)',
                display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--color-primary)',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                El acceso puede estar limitado a correos autorizados por el administrador.
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: '#FEE2E2', color: 'var(--color-error)', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verificar correo'}
              </button>
            </form>
          )}

          {/* ── Paso 2: datos del usuario ──── */}
          {step === 2 && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Nombre completo
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input className="input" type="text" placeholder="Tu nombre real"
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    required style={{ paddingLeft: '38px' }} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Solo visible para administradores
                </p>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Alias público
                </label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input className="input" type="text" placeholder="tu_alias"
                    value={alias} onChange={e => setAlias(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    required maxLength={30} style={{ paddingLeft: '38px' }} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Este es el nombre que verán los demás
                </p>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input className="input" type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={8} style={{ paddingLeft: '38px', paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)',
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Confirmar contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input className="input" type={showPass ? 'text' : 'password'} placeholder="Repite tu contraseña"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    required style={{ paddingLeft: '38px' }} />
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: '#FEE2E2', color: 'var(--color-error)', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: '0 0 auto', padding: '11px 16px' }}>
                  ←
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Crear cuenta'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
