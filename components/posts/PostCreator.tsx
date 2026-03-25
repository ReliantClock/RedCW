'use client'

// ============================================================
//  components/posts/PostCreator.tsx
//  Caja para crear publicaciones con texto, imágenes y archivos
// ============================================================

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Profile, PostSection } from '@/lib/types'
import siteConfig from '@/site.config'
import { Image, Paperclip, EyeOff, X, Loader2, Send } from 'lucide-react'

interface PostCreatorProps {
  profile: Profile
  section: PostSection
  forumId?: string
  groupId?: string
  onPost?: () => void
}

export default function PostCreator({ profile, section, forumId, groupId, onPost }: PostCreatorProps) {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [posting, setPosting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const canPostAnon = profile.can_post_anonymously || profile.role === 'admin'
  const maxImg = siteConfig.posts.maxImagesPerPost
  const maxImgMB = siteConfig.posts.maxImageSizeMB
  const maxFileMB = siteConfig.posts.maxFileSizeMB
  const charLimit = 5000

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const valid = selected.filter(f => {
      if (!siteConfig.posts.allowedImageTypes.includes(f.type)) return false
      if (f.size > maxImgMB * 1024 * 1024) return false
      return true
    })
    setImages(prev => [...prev, ...valid].slice(0, maxImg))
    e.target.value = ''
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const valid = selected.filter(f => {
      if (!siteConfig.posts.allowedFileTypes.includes(f.type)) return false
      if (f.size > maxFileMB * 1024 * 1024) return false
      return true
    })
    setFiles(prev => [...prev, ...valid].slice(0, 3))
    e.target.value = ''
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return publicUrl
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return
    setPosting(true)
    setError(null)

    try {
      const timestamp = Date.now()

      // Subir imágenes
      const imageUrls: string[] = []
      for (const img of images) {
        const ext = img.name.split('.').pop()
        const url = await uploadFile(img, 'posts', `${profile.id}/${timestamp}-${Math.random()}.${ext}`)
        imageUrls.push(url)
      }

      // Subir archivos
      const fileData: { name: string; url: string; size: number; type: string }[] = []
      for (const file of files) {
        const url = await uploadFile(file, 'files', `${profile.id}/${timestamp}-${file.name}`)
        fileData.push({ name: file.name, url, size: file.size, type: file.type })

        // Guardar en galería si es imagen
        if (file.type.startsWith('image/')) {
          await supabase.from('gallery').insert({ user_id: profile.id, url, size_bytes: file.size })
        }
      }

      // Crear post
      const { error: postError } = await supabase.from('posts').insert({
        author_id: profile.id,
        section,
        forum_id: forumId || null,
        group_id: groupId || null,
        content: content.trim(),
        images: imageUrls,
        files: fileData,
        is_anonymous: isAnonymous && canPostAnon,
        is_featured: false,
      })

      if (postError) throw postError

      // Guardar imágenes del post en galería
      for (const url of imageUrls) {
        await supabase.from('gallery').insert({ user_id: profile.id, url })
      }

      // Reset
      setContent('')
      setImages([])
      setFiles([])
      setIsAnonymous(false)
      setExpanded(false)
      onPost?.()
    } catch (err: any) {
      setError(err.message || 'Error al publicar. Intenta de nuevo.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>

        {/* Avatar */}
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.alias} className="avatar"
            style={{ width: '40px', height: '40px', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '16px',
          }}>
            {profile.alias[0].toUpperCase()}
          </div>
        )}

        {/* Área de texto */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            className="input textarea"
            placeholder={isAnonymous ? '¿Qué quieres decir? (anónimo)' : `¿Qué está pasando, ${profile.alias}?`}
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            rows={expanded ? 3 : 1}
            maxLength={charLimit}
            style={{ resize: 'none', transition: 'all var(--transition)' }}
          />

          {/* Preview imágenes */}
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(img)} alt=""
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'var(--color-error)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white',
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Preview archivos */}
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg-hover)', fontSize: '13px',
                }}>
                  <Paperclip size={13} color="var(--color-primary)" />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                  }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: '#FEE2E2', color: 'var(--color-error)',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          {/* Barra de acciones */}
          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Imagen */}
              <input ref={imgRef} type="file" accept={siteConfig.posts.allowedImageTypes.join(',')}
                multiple onChange={handleImageSelect} style={{ display: 'none' }} />
              <button onClick={() => imgRef.current?.click()} className="btn btn-ghost"
                style={{ padding: '7px 12px', fontSize: '13px' }}>
                <Image size={15} />
                Foto
              </button>

              {/* Archivo */}
              <input ref={fileRef} type="file" accept={siteConfig.posts.allowedFileTypes.join(',')}
                multiple onChange={handleFileSelect} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current?.click()} className="btn btn-ghost"
                style={{ padding: '7px 12px', fontSize: '13px' }}>
                <Paperclip size={15} />
                Archivo
              </button>

              {/* Anónimo */}
              {canPostAnon && (
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className="btn"
                  style={{
                    padding: '7px 12px', fontSize: '13px',
                    background: isAnonymous ? 'var(--color-anon-bg)' : 'transparent',
                    color: isAnonymous ? 'var(--color-anon)' : 'var(--color-text-muted)',
                    border: `1px solid ${isAnonymous ? 'var(--color-anon)' : 'var(--color-border)'}`,
                  }}>
                  <EyeOff size={15} />
                  {isAnonymous ? 'Anónimo ✓' : 'Anónimo'}
                </button>
              )}

              {/* Contador */}
              <span style={{
                marginLeft: 'auto', fontSize: '12px',
                color: content.length > charLimit * 0.9 ? 'var(--color-error)' : 'var(--color-text-muted)',
              }}>
                {content.length}/{charLimit}
              </span>

              {/* Publicar */}
              <button
                onClick={handleSubmit}
                disabled={posting || (!content.trim() && images.length === 0)}
                className="btn btn-primary"
                style={{ padding: '7px 20px', fontSize: '14px' }}
              >
                {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
