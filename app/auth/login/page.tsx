'use client'

// ============================================================
//  app/auth/login/page.tsx
//  Página de inicio de sesión
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import siteConfig from '@/site.config'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Correo o contraseña incorrectos')
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
      <div style={{ width: '100%', maxWidth: '400px' }}>
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>{siteConfig.name}</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Inicia sesión en tu cuenta
          </p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="input" type="email" placeholder="tu@correo.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required style={{ paddingLeft: '38px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required style={{ paddingLeft: '38px', paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)',
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: '#FEE2E2', color: 'var(--color-error)', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Iniciar sesión'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Regístrate
            </Link>
          </div>

          <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '13px' }}>
            <Link href="/" style={{ color: 'var(--color-text-muted)' }}>
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
