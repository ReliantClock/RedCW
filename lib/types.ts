// ============================================================
//  TIPOS GLOBALES - EDULINK
//  Alineados con el schema de Supabase
// ============================================================

export type UserRole = 'user' | 'manager' | 'admin'
export type PlanId = 'free' | 'anon_basic' | 'anon_pro'
export type PostSection = 'home' | 'news' | 'forum'
export type ForumType = 'public' | 'private' | 'anonymous'
export type NotificationType = 'comment' | 'like' | 'mention' | 'plan_activated' | 'plan_expired' | 'forum_invite' | 'system'
export type PlanRequestStatus = 'pending' | 'approved' | 'rejected'

// ── Profile ──────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string
  alias: string
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  role: UserRole
  plan: PlanId
  plan_expires_at: string | null
  is_active: boolean
  is_banned: boolean
  // Permisos del plan
  can_create_anon_forum: boolean
  max_anon_forums: number
  can_post_anonymously: boolean
  has_feed_badge: boolean
  has_featured_posts: boolean
  created_at: string
  updated_at: string
}

// Perfil público (lo que ve otro usuario)
export interface PublicProfile {
  id: string
  alias: string
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  role: UserRole
  plan: PlanId
  has_feed_badge: boolean
  created_at: string
}

// ── Post ──────────────────────────────────────────────────────
export interface PostFile {
  name: string
  url: string
  size: number
  type: string
}

export interface Post {
  id: string
  author_id: string
  section: PostSection
  forum_id: string | null
  group_id: string | null
  content: string
  images: string[]
  files: PostFile[]
  is_anonymous: boolean
  is_featured: boolean
  is_pinned: boolean
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
}

// Post con datos del autor (desde la vista posts_with_author)
export interface PostWithAuthor extends Post {
  author_alias: string | null        // null si es anónimo
  author_avatar: string | null       // null si es anónimo
  author_role: UserRole | null       // null si es anónimo
  author_plan: PlanId | null         // null si es anónimo
  author_has_badge: boolean | null   // null si es anónimo
  // Estado del usuario actual
  user_liked?: boolean
}

// ── Comment ───────────────────────────────────────────────────
export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  is_anonymous: boolean
  likes_count: number
  created_at: string
  updated_at: string
  // Joins
  author?: PublicProfile
  replies?: Comment[]
  user_liked?: boolean
}

// ── Forum ─────────────────────────────────────────────────────
export interface Forum {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  type: ForumType
  is_default: boolean
  created_by: string | null
  is_active: boolean
  member_count: number
  post_count: number
  created_at: string
  updated_at: string
  // Estado del usuario actual
  user_is_member?: boolean
  user_role?: 'member' | 'moderator' | 'owner' | null
}

// ── Group (Colegio) ───────────────────────────────────────────
export interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  banner_url: string | null
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Joins
  member_count?: number
  user_role?: 'member' | 'manager' | 'owner' | null
}

// ── Notification ──────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// ── Plan Request ──────────────────────────────────────────────
export interface PlanRequest {
  id: string
  user_id: string
  plan_id: PlanId
  status: PlanRequestStatus
  note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  // Joins
  user?: PublicProfile
}

// ── Gallery ───────────────────────────────────────────────────
export interface GalleryImage {
  id: string
  user_id: string
  url: string
  post_id: string | null
  size_bytes: number | null
  created_at: string
}

// ── Whitelist ─────────────────────────────────────────────────
export interface WhitelistEntry {
  id: string
  email: string
  added_by: string | null
  created_at: string
}

// ── Site Settings ─────────────────────────────────────────────
export interface SiteSettings {
  whitelist_enabled: boolean
  maintenance_mode: boolean
  allow_registrations: boolean
  featured_posts_limit: number
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  profile: Profile
}

// ── API Response ──────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// ── Pagination ────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ── Feed filters ──────────────────────────────────────────────
export interface FeedFilters {
  section?: PostSection
  forum_id?: string
  group_id?: string
  featured_only?: boolean
  page?: number
  pageSize?: number
}

// ── Database types (para Supabase) ───────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      posts: { Row: Post; Insert: Partial<Post>; Update: Partial<Post> }
      comments: { Row: Comment; Insert: Partial<Comment>; Update: Partial<Comment> }
      forums: { Row: Forum; Insert: Partial<Forum>; Update: Partial<Forum> }
      groups: { Row: Group; Insert: Partial<Group>; Update: Partial<Group> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
      likes: { Row: { id: string; user_id: string; post_id: string | null; comment_id: string | null; created_at: string }; Insert: any; Update: any }
      whitelist: { Row: WhitelistEntry; Insert: Partial<WhitelistEntry>; Update: Partial<WhitelistEntry> }
      site_settings: { Row: { key: string; value: unknown; updated_by: string | null; updated_at: string }; Insert: any; Update: any }
      plan_requests: { Row: PlanRequest; Insert: Partial<PlanRequest>; Update: Partial<PlanRequest> }
      gallery: { Row: GalleryImage; Insert: Partial<GalleryImage>; Update: Partial<GalleryImage> }
    }
    Views: {
      posts_with_author: { Row: PostWithAuthor }
    }
    Functions: {
      is_admin: { Returns: boolean }
      is_manager_or_admin: { Returns: boolean }
      expire_plans: { Returns: void }
    }
  }
}
