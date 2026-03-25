-- ============================================================
--  EDULINK - SCHEMA COMPLETO SUPABASE
--  Ejecutar en el SQL Editor de Supabase en orden
-- ============================================================

-- ── Extensiones ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
--  ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('user', 'manager', 'admin');
CREATE TYPE plan_id AS ENUM ('free', 'anon_basic', 'anon_pro');
CREATE TYPE post_section AS ENUM ('home', 'news', 'forum');
CREATE TYPE forum_type AS ENUM ('public', 'private', 'anonymous');
CREATE TYPE notification_type AS ENUM ('comment', 'like', 'mention', 'plan_activated', 'plan_expired', 'forum_invite', 'system');

-- ============================================================
--  TABLA: profiles
--  Extiende auth.users de Supabase
-- ============================================================

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,                        -- nombre real (no editable por usuario)
  alias           TEXT NOT NULL UNIQUE,                 -- nombre público editable
  avatar_url      TEXT,
  banner_url      TEXT,
  bio             TEXT CHECK (char_length(bio) <= 200),
  role            user_role NOT NULL DEFAULT 'user',
  plan            plan_id NOT NULL DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_banned       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Permisos del plan (se sincronizan automáticamente)
  can_create_anon_forum   BOOLEAN NOT NULL DEFAULT FALSE,
  max_anon_forums         INT NOT NULL DEFAULT 0,
  can_post_anonymously    BOOLEAN NOT NULL DEFAULT FALSE,
  has_feed_badge          BOOLEAN NOT NULL DEFAULT FALSE,
  has_featured_posts      BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_plan ON profiles(plan);
CREATE INDEX idx_profiles_alias ON profiles(alias);

-- ============================================================
--  TABLA: whitelist
--  Lista blanca de correos permitidos para registrarse
-- ============================================================

CREATE TABLE whitelist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT NOT NULL UNIQUE,
  added_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  TABLA: site_settings
--  Configuración global del sitio (manejada por admin)
-- ============================================================

CREATE TABLE site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valores por defecto
INSERT INTO site_settings (key, value) VALUES
  ('whitelist_enabled', 'true'),
  ('maintenance_mode', 'false'),
  ('allow_registrations', 'true'),
  ('featured_posts_limit', '5');

-- ============================================================
--  TABLA: groups
--  Grupos de colegios (para sección Noticias)
-- ============================================================

CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  banner_url  TEXT,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  TABLA: group_members
--  Miembros y encargados de grupos
-- ============================================================

CREATE TABLE group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager', 'owner')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- ============================================================
--  TABLA: forums
--  Foros de la sección Comunidades
-- ============================================================

CREATE TABLE forums (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  description    TEXT,
  avatar_url     TEXT,
  type           forum_type NOT NULL DEFAULT 'public',
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,      -- foro anónimo predeterminado
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  member_count   INT NOT NULL DEFAULT 0,
  post_count     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear el foro anónimo predeterminado
INSERT INTO forums (id, name, description, type, is_default, created_by)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Anónimo',
  'Publica sin que nadie sepa quién eres. Espacio libre y seguro.',
  'anonymous',
  TRUE,
  NULL
);

-- ============================================================
--  TABLA: forum_members
--  Miembros de foros
-- ============================================================

CREATE TABLE forum_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id  UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'owner')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (forum_id, user_id)
);

CREATE INDEX idx_forum_members_forum ON forum_members(forum_id);
CREATE INDEX idx_forum_members_user ON forum_members(user_id);

-- ============================================================
--  TABLA: posts
--  Publicaciones en todas las secciones
-- ============================================================

CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section       post_section NOT NULL DEFAULT 'home',
  forum_id      UUID REFERENCES forums(id) ON DELETE CASCADE,   -- solo si section = 'forum'
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE,   -- solo si section = 'news'
  content       TEXT NOT NULL CHECK (char_length(content) <= 5000),
  images        TEXT[] DEFAULT '{}',                             -- URLs de imágenes
  files         JSONB DEFAULT '[]',                              -- [{name, url, size, type}]
  is_anonymous  BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  likes_count   INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_section ON posts(section);
CREATE INDEX idx_posts_forum ON posts(forum_id);
CREATE INDEX idx_posts_group ON posts(group_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_featured ON posts(is_featured) WHERE is_featured = TRUE;

-- ============================================================
--  TABLA: comments
--  Comentarios de publicaciones
-- ============================================================

CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES comments(id) ON DELETE CASCADE,  -- para respuestas anidadas
  content      TEXT NOT NULL CHECK (char_length(content) <= 1000),
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  likes_count  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ============================================================
--  TABLA: likes
--  Likes de posts y comentarios
-- ============================================================

CREATE TABLE likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, comment_id)
);

-- ============================================================
--  TABLA: notifications
--  Notificaciones en tiempo real
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',   -- {post_id, comment_id, from_user_id, etc.}
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
--  TABLA: plan_requests
--  Solicitudes de plan enviadas por usuarios
-- ============================================================

CREATE TABLE plan_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id      plan_id NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note         TEXT,                                               -- nota del usuario
  reviewed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_requests_user ON plan_requests(user_id);
CREATE INDEX idx_plan_requests_status ON plan_requests(status);

-- ============================================================
--  TABLA: gallery
--  Imágenes subidas por cada usuario
-- ============================================================

CREATE TABLE gallery (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  post_id    UUID REFERENCES posts(id) ON DELETE SET NULL,
  size_bytes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gallery_user ON gallery(user_id);

-- ============================================================
--  FUNCIONES Y TRIGGERS
-- ============================================================

-- ── 1. Crear perfil automáticamente al registrarse ────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, alias)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'alias', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. Verificar whitelist al registrarse ─────────────────────
CREATE OR REPLACE FUNCTION check_whitelist()
RETURNS TRIGGER AS $$
DECLARE
  whitelist_on BOOLEAN;
BEGIN
  SELECT (value::text)::boolean INTO whitelist_on
  FROM site_settings WHERE key = 'whitelist_enabled';

  IF whitelist_on THEN
    IF NOT EXISTS (SELECT 1 FROM whitelist WHERE email = NEW.email) THEN
      RAISE EXCEPTION 'Email no autorizado para registrarse.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_whitelist_check
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION check_whitelist();

-- ── 3. Actualizar updated_at automáticamente ──────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER forums_updated_at BEFORE UPDATE ON forums FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. Actualizar contador de comentarios ─────────────────────
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- ── 5. Actualizar contador de likes ───────────────────────────
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- ── 6. Sincronizar permisos al cambiar de plan ────────────────
CREATE OR REPLACE FUNCTION sync_plan_permissions()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.plan
    WHEN 'free' THEN
      NEW.can_create_anon_forum := FALSE;
      NEW.max_anon_forums := 0;
      NEW.can_post_anonymously := FALSE;
      NEW.has_feed_badge := FALSE;
      NEW.has_featured_posts := FALSE;
    WHEN 'anon_basic' THEN
      NEW.can_create_anon_forum := TRUE;
      NEW.max_anon_forums := 1;
      NEW.can_post_anonymously := FALSE;
      NEW.has_feed_badge := TRUE;
      NEW.has_featured_posts := FALSE;
    WHEN 'anon_pro' THEN
      NEW.can_create_anon_forum := TRUE;
      NEW.max_anon_forums := 2;
      NEW.can_post_anonymously := TRUE;
      NEW.has_feed_badge := TRUE;
      NEW.has_featured_posts := TRUE;
  END CASE;

  -- El admin siempre tiene todos los permisos
  IF NEW.role = 'admin' THEN
    NEW.can_create_anon_forum := TRUE;
    NEW.max_anon_forums := 999;
    NEW.can_post_anonymously := TRUE;
    NEW.has_feed_badge := TRUE;
    NEW.has_featured_posts := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_plan_change
  BEFORE UPDATE OF plan, role ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_plan_permissions();

-- ── 7. Expirar planes automáticamente (cron diario) ──────────
CREATE OR REPLACE FUNCTION expire_plans()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET plan = 'free',
      plan_expires_at = NULL
  WHERE plan != 'free'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < NOW()
    AND role != 'admin';

  -- Notificar a usuarios cuyo plan expiró
  INSERT INTO notifications (user_id, type, title, body)
  SELECT id, 'plan_expired', 'Tu plan ha expirado',
    'Tu plan de pago ha vencido. Renuévalo para seguir disfrutando de los beneficios.'
  FROM profiles
  WHERE plan = 'free'
    AND plan_expires_at IS NULL
    AND updated_at > NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar diariamente a medianoche (requiere pg_cron habilitado en Supabase)
-- SELECT cron.schedule('expire-plans', '0 0 * * *', 'SELECT expire_plans()');

-- ── 8. Actualizar contador de miembros del foro ───────────────
CREATE OR REPLACE FUNCTION update_forum_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forums SET member_count = member_count + 1 WHERE id = NEW.forum_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forums SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.forum_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_forum_member_change
  AFTER INSERT OR DELETE ON forum_members
  FOR EACH ROW EXECUTE FUNCTION update_forum_member_count();

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- ── Helper: verificar si el usuario es admin ──────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('manager', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Policies: profiles ────────────────────────────────────────
CREATE POLICY "Perfiles visibles para todos" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Usuario edita su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin edita cualquier perfil" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admin inserta perfiles" ON profiles FOR INSERT WITH CHECK (is_admin());

-- ── Policies: posts ───────────────────────────────────────────
CREATE POLICY "Posts visibles para todos" ON posts FOR SELECT USING (TRUE);
CREATE POLICY "Usuario crea posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Usuario borra sus posts" ON posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Manager/admin borra cualquier post" ON posts FOR DELETE USING (is_manager_or_admin());
CREATE POLICY "Usuario actualiza sus posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admin actualiza cualquier post" ON posts FOR UPDATE USING (is_admin());

-- ── Policies: comments ────────────────────────────────────────
CREATE POLICY "Comentarios visibles para todos" ON comments FOR SELECT USING (TRUE);
CREATE POLICY "Usuario autenticado comenta" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Usuario borra su comentario" ON comments FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Manager/admin borra comentarios" ON comments FOR DELETE USING (is_manager_or_admin());

-- ── Policies: likes ───────────────────────────────────────────
CREATE POLICY "Likes visibles para todos" ON likes FOR SELECT USING (TRUE);
CREATE POLICY "Usuario da like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario quita su like" ON likes FOR DELETE USING (auth.uid() = user_id);

-- ── Policies: notifications ───────────────────────────────────
CREATE POLICY "Usuario ve sus notificaciones" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sistema inserta notificaciones" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Usuario marca leídas" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── Policies: forums ──────────────────────────────────────────
CREATE POLICY "Foros públicos visibles para todos" ON forums FOR SELECT USING (
  type = 'public' OR type = 'anonymous' OR is_default = TRUE OR
  EXISTS (SELECT 1 FROM forum_members WHERE forum_id = forums.id AND user_id = auth.uid()) OR
  is_admin()
);
CREATE POLICY "Usuario crea foros con permiso" ON forums FOR INSERT WITH CHECK (
  auth.uid() = created_by AND (
    is_admin() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_create_anon_forum = TRUE)
  )
);
CREATE POLICY "Admin borra cualquier foro" ON forums FOR DELETE USING (is_admin());
CREATE POLICY "Dueño borra su foro" ON forums FOR DELETE USING (
  created_by = auth.uid() AND is_default = FALSE
);

-- ── Policies: whitelist ───────────────────────────────────────
CREATE POLICY "Solo admin ve whitelist" ON whitelist FOR SELECT USING (is_admin());
CREATE POLICY "Solo admin maneja whitelist" ON whitelist FOR ALL USING (is_admin());

-- ── Policies: site_settings ───────────────────────────────────
CREATE POLICY "Todos ven configuración pública" ON site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Solo admin modifica configuración" ON site_settings FOR ALL USING (is_admin());

-- ── Policies: plan_requests ───────────────────────────────────
CREATE POLICY "Usuario ve sus solicitudes" ON plan_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Usuario crea solicitud" ON plan_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin gestiona solicitudes" ON plan_requests FOR UPDATE USING (is_admin());

-- ── Policies: gallery ─────────────────────────────────────────
CREATE POLICY "Usuario ve su galería" ON gallery FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Usuario sube a galería" ON gallery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario borra sus imágenes" ON gallery FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ============================================================
--  STORAGE BUCKETS
-- ============================================================

-- Ejecutar desde el dashboard de Supabase > Storage o via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', false);

-- ============================================================
--  REALTIME
-- ============================================================

-- Habilitar realtime para notificaciones y posts
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;

-- ============================================================
--  VISTAS ÚTILES
-- ============================================================

-- Vista de posts con datos del autor (sin exponer datos sensibles de anonimos)
CREATE OR REPLACE VIEW posts_with_author AS
SELECT
  p.*,
  CASE
    WHEN p.is_anonymous THEN NULL
    ELSE pr.alias
  END AS author_alias,
  CASE
    WHEN p.is_anonymous THEN NULL
    ELSE pr.avatar_url
  END AS author_avatar,
  CASE
    WHEN p.is_anonymous THEN NULL
    ELSE pr.role
  END AS author_role,
  CASE
    WHEN p.is_anonymous THEN NULL
    ELSE pr.plan
  END AS author_plan,
  CASE
    WHEN p.is_anonymous THEN NULL
    ELSE pr.has_feed_badge
  END AS author_has_badge
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.id;

-- ============================================================
--  FIN DEL SCHEMA
-- ============================================================
