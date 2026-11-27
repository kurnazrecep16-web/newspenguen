-- COATNEWS — Global Brand Intelligence (GBI) veri modeli
-- Sürüm: 1 · Geri alma: 20261127190000_brand_intelligence.down.sql
-- Mevcut news_items / feed_runs tablolarına ve collect-news akışına dokunmaz.
-- Tüm yeni nesneler "bi_" önekiyle public şemada, RLS açık.

begin;

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- enum tipleri
create type bi_entity_type   as enum ('manufacturer', 'corporate_group', 'consumer_brand', 'product_brand');
create type bi_story_status  as enum ('discovered', 'under_review', 'approved', 'published', 'rejected', 'archived');
create type bi_entity_role   as enum ('main', 'mentioned', 'parent');
create type bi_reliability   as enum ('high', 'medium', 'low', 'unreliable', 'unknown');
create type bi_content_type  as enum ('news', 'press_release', 'opinion', 'sponsored', 'unknown');
create type bi_storage_right as enum ('link_only', 'snippet');
create type bi_follow_kind   as enum ('entity', 'segment', 'country', 'topic');
create type bi_staff_role    as enum ('admin', 'editor');

-- ---------------------------------------------------------------- yetki
create table bi_staff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       bi_staff_role not null default 'editor',
  created_at timestamptz not null default now()
);

create or replace function bi_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bi_staff where user_id = auth.uid());
$$;

create or replace function bi_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bi_staff where user_id = auth.uid() and role = 'admin');
$$;

create or replace function bi_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- sözlükler
create table bi_segments (
  key        text primary key check (key in ('marine', 'protective', 'powder', 'decorative', 'energy')),
  name_tr    text not null,
  name_en    text not null,
  sort_order smallint not null
);
insert into bi_segments values
  ('marine', 'Marine', 'Marine', 1),
  ('protective', 'Protective', 'Protective', 2),
  ('powder', 'Toz Boya', 'Powder', 3),
  ('decorative', 'Dekoratif', 'Decorative', 4),
  ('energy', 'Enerji', 'Energy', 5);

create table bi_topics (
  code     char(1) primary key,
  key      text not null unique,
  name_tr  text not null,
  name_en  text not null
);
insert into bi_topics values
  ('A', 'investment',      'Şirket yatırımı',               'Company investment'),
  ('B', 'expansion',       'Fabrika / kapasite artışı',      'Factory or production expansion'),
  ('C', 'product_launch',  'Yeni ürün',                      'New product launch'),
  ('D', 'technology',      'Teknoloji ve inovasyon',         'Technology and innovation'),
  ('E', 'acquisition',     'Satın alma ve birleşme',         'Acquisition and merger'),
  ('F', 'partnership',     'Ortaklık ve distribütörlük',     'Partnership and distributor agreements'),
  ('G', 'industrial_project','Endüstriyel proje referansı',  'Industrial project reference'),
  ('H', 'marine_project',  'Marine projesi',                 'Marine project'),
  ('I', 'protective_project','Protective proje',             'Protective coating project'),
  ('J', 'powder_dev',      'Toz boya gelişmesi',             'Powder coating development'),
  ('K', 'decorative_dev',  'Dekoratif boya gelişmesi',       'Decorative paint development'),
  ('L', 'energy_dev',      'Enerji sektörü gelişmesi',       'Energy-sector development'),
  ('M', 'sustainability',  'Sürdürülebilirlik ve çevre',     'Sustainability and environmental news'),
  ('N', 'corporate',       'Finans ve kurumsal',             'Financial and corporate news'),
  ('O', 'incidental',      'Dolaylı marka geçişi',           'Incidental brand mention');

create table bi_languages (
  code        text primary key,           -- ISO 639-1
  name        text not null,
  gdelt_name  text,                       -- GDELT sourcelang değeri
  is_active   boolean not null default true
);
insert into bi_languages values
  ('en', 'English', 'english', true), ('tr', 'Türkçe', 'turkish', true), ('de', 'Deutsch', 'german', true),
  ('fr', 'Français', 'french', true), ('it', 'Italiano', 'italian', true), ('es', 'Español', 'spanish', true),
  ('nl', 'Nederlands', 'dutch', true), ('pt', 'Português', 'portuguese', true), ('pl', 'Polski', 'polish', true),
  ('zh', '中文', 'chinese', true);

-- ---------------------------------------------------------------- marka kaydı
create table bi_entities (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  entity_type        bi_entity_type not null,
  parent_id          uuid references bi_entities(id) on delete set null,
  parent_note        text,                        -- ör. "Polisan Holding ile ortak girişim"
  country_iso2       char(2),
  website            text,
  newsroom_url       text,
  newsroom_feed_url  text,
  logo_url           text,
  logo_authorized    boolean not null default false,
  segments           text[] not null default '{}',
  product_families   text[] not null default '{}',
  search_keywords    text[] not null default '{}',
  exclusion_keywords text[] not null default '{}',
  languages          text[] not null default '{en}',
  is_active          boolean not null default true,
  priority           smallint not null default 3 check (priority between 1 and 5),  -- 1 = en yüksek
  data_verified      boolean not null default false,  -- web sitesi / ana şirket bilgisi elle doğrulandı mı
  merged_into_id     uuid references bi_entities(id) on delete set null,
  last_scan_at       timestamptz,
  article_count      integer not null default 0,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);
create index bi_entities_parent_idx on bi_entities(parent_id);
create index bi_entities_active_idx on bi_entities(is_active, priority);
create trigger bi_entities_touch before update on bi_entities for each row execute function bi_touch();

create table bi_entity_aliases (
  id             uuid primary key default gen_random_uuid(),
  entity_id      uuid not null references bi_entities(id) on delete cascade,
  alias          text not null,
  alias_norm     text not null,
  lang           text,                 -- null = dil bağımsız
  is_ambiguous   boolean not null default false,  -- tek başına geçmesi yetmez, kaplama bağlamı şart
  case_sensitive boolean not null default false,  -- ör. "DAW", "TOA"
  use_in_search  boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (entity_id, alias_norm)
);
create index bi_alias_norm_idx on bi_entity_aliases using gin (alias_norm gin_trgm_ops);

-- ---------------------------------------------------------------- kaynaklar
create table bi_providers (
  key                 text primary key,     -- gdelt, thenewsapi, newsapi, rss
  name                text not null,
  kind                text not null check (kind in ('api', 'rss')),
  is_enabled          boolean not null default false,
  requires_key        boolean not null default false,
  key_env             text,                 -- yalnızca ortam değişkeninin ADI, değer asla burada tutulmaz
  daily_quota         integer,
  used_today          integer not null default 0,
  quota_day           date,
  rate_limited_until  timestamptz,
  min_interval_ms     integer not null default 0,
  last_attempt_at     timestamptz,
  last_success_at     timestamptz,
  last_error          text,
  consecutive_errors  integer not null default 0,
  articles_retrieved  bigint not null default 0,
  config              jsonb not null default '{}',
  terms_notes         text,
  updated_at          timestamptz not null default now()
);
create trigger bi_providers_touch before update on bi_providers for each row execute function bi_touch();

insert into bi_providers (key, name, kind, is_enabled, requires_key, key_env, daily_quota, min_interval_ms, config, terms_notes) values
  ('gdelt', 'GDELT DOC 2.0', 'api', true, false, null, null, 5500,
   '{"maxrecords": 250, "timespan": "3h"}',
   'Ücretsiz, anahtar gerektirmez. Son 3 ay aranabilir. Yalnızca başlık + bağlantı + meta döner; tam metin yok.'),
  ('thenewsapi', 'TheNewsAPI', 'api', false, true, 'THENEWSAPI_TOKEN', 100, 1000,
   '{"limit": 3}',
   'Ücretsiz plan: günde 100 istek, istek başına 3 makale. Basic $19/ay: 2.500 istek, 25 makale. Yalnızca kısa snippet + bağlantı. Ticari kullanım koşulları /tos sayfasında doğrulanmalı.'),
  ('newsapi', 'NewsAPI.org', 'api', false, true, 'NEWSAPI_KEY', 100, 1000,
   '{"pageSize": 100}',
   'Ücretsiz Developer planı canlı/üretim ortamında YASAK (dahili kullanım dahil). Üretim için Business $449/ay. İçerik 200 karakterle kesilir; yeniden yayın yasak.'),
  ('rss', 'RSS / resmi haber odaları', 'rss', true, false, null, null, 0, '{}',
   'Yayıncının kendi beslemesi. Yalnızca başlık, kısa açıklama ve bağlantı saklanır.');

create table bi_sources (
  id           uuid primary key default gen_random_uuid(),
  domain       text not null unique,       -- yayıncı alan adı (www olmadan)
  name         text,
  country_iso2 char(2),
  reliability  bi_reliability not null default 'unknown',
  is_official  boolean not null default false,   -- marka/şirketin kendi sitesi
  entity_id    uuid references bi_entities(id) on delete set null,
  is_blocked   boolean not null default false,
  notes        text,
  updated_at   timestamptz not null default now()
);
create trigger bi_sources_touch before update on bi_sources for each row execute function bi_touch();

create table bi_feeds (
  id              uuid primary key default gen_random_uuid(),
  url             text not null unique,
  name            text not null,
  entity_id       uuid references bi_entities(id) on delete set null,   -- resmi haber odası ise
  lang            text,
  segments        text[] not null default '{}',
  is_active       boolean not null default true,
  etag            text,
  last_modified   text,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error      text,
  consecutive_errors integer not null default 0,
  items_seen      bigint not null default 0,
  created_at      timestamptz not null default now()
);

-- Arama şablonları: marka adına eklenen bağlam terimleri (dil başına)
create table bi_query_terms (
  id          uuid primary key default gen_random_uuid(),
  lang        text not null references bi_languages(code),
  term        text not null,
  kind        text not null check (kind in ('context', 'business', 'segment')),
  segment_key text references bi_segments(key),
  is_active   boolean not null default true,
  unique (lang, term)
);

create table bi_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
insert into bi_settings values
  ('thresholds', '{"very_high": 90, "high": 75, "medium": 50}', now()),
  ('publishing', '{"auto_publish": false, "auto_publish_min": 90, "review_below": 75, "reject_below": 25}', now()),
  ('scan', '{"interval_minutes": 60, "overlap_minutes": 30, "time_budget_ms": 120000, "queries_per_run": 18}', now()),
  ('weights', '{"brand": 0.40, "segment": 0.25, "source": 0.20, "freshness": 0.15}', now()),
  ('notifications', '{"min_score": 75, "max_per_user_per_day": 5}', now());

-- ---------------------------------------------------------------- haberler
-- Bir "story" aynı olayın tek COATNEWS kaydıdır; birden fazla kaynak makalesi ona bağlanır.
create table bi_stories (
  id                 uuid primary key default gen_random_uuid(),
  status             bi_story_status not null default 'discovered',
  primary_article_id uuid,
  title              text not null,          -- orijinal başlık (birincil kaynak)
  headline_override  text,                   -- editör düzeltmesi
  summary            text,                   -- COATNEWS'in kendi kısa özeti
  summary_is_ai      boolean not null default false,
  language           text,
  country_iso2       char(2),
  region             text,
  segments           text[] not null default '{}',
  topics             char(1)[] not null default '{}',
  tags               text[] not null default '{}',
  main_entity_id     uuid references bi_entities(id) on delete set null,
  content_type       bi_content_type not null default 'unknown',
  is_promotional     boolean not null default false,
  first_published_at timestamptz,
  source_count       integer not null default 1,
  brand_score        smallint,
  segment_score      smallint,
  source_confidence  smallint,
  overall_score      smallint,
  score_breakdown    jsonb not null default '{}',
  review_reason      text,
  reviewed_by        uuid references auth.users(id) on delete set null,
  reviewed_at        timestamptz,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index bi_stories_status_idx on bi_stories(status, first_published_at desc);
create index bi_stories_pub_idx    on bi_stories(first_published_at desc) where status = 'published';
create index bi_stories_seg_idx    on bi_stories using gin (segments);
create index bi_stories_topic_idx  on bi_stories using gin (topics);
create index bi_stories_main_idx   on bi_stories(main_entity_id);
create trigger bi_stories_touch before update on bi_stories for each row execute function bi_touch();

create table bi_articles (
  id               uuid primary key default gen_random_uuid(),
  story_id         uuid not null references bi_stories(id) on delete cascade,
  provider_key     text not null references bi_providers(key),
  external_id      text,
  url              text not null,
  canonical_url    text not null unique,     -- idempotent tekrar engeli
  title            text not null,
  title_norm       text not null,
  description      text,                     -- yalnızca sağlayıcının verdiği kısa açıklama
  storage_right    bi_storage_right not null default 'link_only',
  publisher        text,
  source_domain    text,
  language         text,
  source_country   text,
  published_at     timestamptz,
  discovered_at    timestamptz not null default now(),
  simhash          bigint,
  is_syndicated    boolean not null default false
);
alter table bi_stories add constraint bi_stories_primary_fk
  foreign key (primary_article_id) references bi_articles(id) on delete set null;
create index bi_articles_story_idx  on bi_articles(story_id);
create index bi_articles_pub_idx    on bi_articles(published_at desc);
create index bi_articles_title_trgm on bi_articles using gin (title_norm gin_trgm_ops);
create index bi_articles_domain_idx on bi_articles(source_domain);

create table bi_story_entities (
  story_id      uuid not null references bi_stories(id) on delete cascade,
  entity_id     uuid not null references bi_entities(id) on delete cascade,
  role          bi_entity_role not null default 'mentioned',
  mention_count smallint not null default 1,
  in_headline   boolean not null default false,
  evidence      text[] not null default '{}',   -- metinden birebir alıntılar
  confidence    smallint,
  editor_set    boolean not null default false,
  primary key (story_id, entity_id)
);
create index bi_story_entities_entity_idx on bi_story_entities(entity_id, story_id);

create table bi_story_segments (
  story_id    uuid not null references bi_stories(id) on delete cascade,
  segment_key text not null references bi_segments(key),
  score       smallint,
  evidence    text[] not null default '{}',
  editor_set  boolean not null default false,
  primary key (story_id, segment_key)
);

-- ---------------------------------------------------------------- tarama günlükleri
create table bi_scan_runs (
  id          uuid primary key default gen_random_uuid(),
  trigger     text not null default 'cron',
  status      text not null default 'running' check (status in ('running', 'ok', 'partial', 'failed')),
  window_from timestamptz,
  window_to   timestamptz,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  stats       jsonb not null default '{}',
  error       text
);
create index bi_scan_runs_started_idx on bi_scan_runs(started_at desc);

create table bi_scan_logs (
  id           bigint generated always as identity primary key,
  run_id       uuid references bi_scan_runs(id) on delete cascade,
  provider_key text,
  level        text not null check (level in ('info', 'warn', 'error')),
  message      text not null,
  data         jsonb,
  created_at   timestamptz not null default now()
);
create index bi_scan_logs_run_idx on bi_scan_logs(run_id);
create index bi_scan_logs_err_idx on bi_scan_logs(created_at desc) where level = 'error';

-- ---------------------------------------------------------------- takip ve bildirim
create table bi_follows (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       bi_follow_kind not null,
  ref        text not null,      -- entity uuid, segment key, ISO2 ülke, konu kodu
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);

create table bi_notification_prefs (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  enabled      boolean not null default true,
  min_score    smallint not null default 75,
  max_per_day  smallint not null default 5,
  updated_at   timestamptz not null default now()
);

create table bi_notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  story_id   uuid not null references bi_stories(id) on delete cascade,
  reason     text not null,
  created_at timestamptz not null default now(),
  sent_at    timestamptz,
  read_at    timestamptz,
  unique (user_id, story_id)        -- aynı haber için tekrar bildirim yok
);
create index bi_notifications_user_idx on bi_notifications(user_id, created_at desc);


-- ---------------------------------------------------------------- bildirim kuyruğu
-- Haber "published" olduğunda takip eden kullanıcılar için kuyruğa kayıt atar.
-- Kurallar: kullanıcının min_score'u, günlük üst sınırı, aynı habere tek bildirim.
-- Teslim (APNs push / e-posta) ayrı bir işçinin işidir; bu yalnızca kuyruktur.
create or replace function bi_enqueue_notifications() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and (old.status is distinct from 'published') then
    insert into bi_notifications (user_id, story_id, reason)
    select f.user_id, new.id, min(f.kind::text || ':' || f.ref)
    from bi_follows f
    left join bi_notification_prefs p on p.user_id = f.user_id
    where coalesce(p.enabled, true)
      and coalesce(new.overall_score, 0) >= coalesce(p.min_score, 75)
      and (
        (f.kind = 'entity'  and exists (select 1 from bi_story_entities se where se.story_id = new.id and se.entity_id::text = f.ref and se.role in ('main', 'mentioned')))
     or (f.kind = 'segment' and f.ref = any(new.segments))
     or (f.kind = 'country' and f.ref = new.country_iso2)
     or (f.kind = 'topic'   and f.ref = any(new.topics::text[]))
      )
      and (select count(*) from bi_notifications n where n.user_id = f.user_id and n.created_at > now() - interval '1 day')
          < coalesce(p.max_per_day, 5)
    group by f.user_id
    on conflict (user_id, story_id) do nothing;
  end if;
  if new.status = 'published' and new.published_at is null then new.published_at = now(); end if;
  return new;
end $$;
create trigger bi_stories_notify before update on bi_stories for each row execute function bi_enqueue_notifications();

-- ---------------------------------------------------------------- RLS
alter table bi_staff              enable row level security;
alter table bi_segments           enable row level security;
alter table bi_topics             enable row level security;
alter table bi_languages          enable row level security;
alter table bi_entities           enable row level security;
alter table bi_entity_aliases     enable row level security;
alter table bi_providers          enable row level security;
alter table bi_sources            enable row level security;
alter table bi_feeds              enable row level security;
alter table bi_query_terms        enable row level security;
alter table bi_settings           enable row level security;
alter table bi_stories            enable row level security;
alter table bi_articles           enable row level security;
alter table bi_story_entities     enable row level security;
alter table bi_story_segments     enable row level security;
alter table bi_scan_runs          enable row level security;
alter table bi_scan_logs          enable row level security;
alter table bi_follows            enable row level security;
alter table bi_notification_prefs enable row level security;
alter table bi_notifications      enable row level security;

-- Herkese açık okuma: sözlükler, marka kaydı, yayımlanmış haberler
create policy bi_segments_read  on bi_segments  for select using (true);
create policy bi_topics_read    on bi_topics    for select using (true);
create policy bi_languages_read on bi_languages for select using (true);
create policy bi_entities_read  on bi_entities  for select using (is_active and merged_into_id is null or bi_is_staff());
create policy bi_aliases_read   on bi_entity_aliases for select using (true);
create policy bi_stories_read   on bi_stories   for select using (status = 'published' or bi_is_staff());
create policy bi_articles_read  on bi_articles  for select using (
  bi_is_staff() or exists (select 1 from bi_stories s where s.id = story_id and s.status = 'published'));
create policy bi_story_entities_read on bi_story_entities for select using (
  bi_is_staff() or exists (select 1 from bi_stories s where s.id = story_id and s.status = 'published'));
create policy bi_story_segments_read on bi_story_segments for select using (
  bi_is_staff() or exists (select 1 from bi_stories s where s.id = story_id and s.status = 'published'));
-- Kaynak sağlayıcı durumu şeffaflık için herkese açık (anahtar değerleri burada yok)
create policy bi_providers_read on bi_providers for select using (true);
create policy bi_sources_read   on bi_sources   for select using (true);

-- Editör / yönetici
create policy bi_staff_self      on bi_staff for select using (user_id = auth.uid() or bi_is_admin());
create policy bi_staff_admin     on bi_staff for all using (bi_is_admin()) with check (bi_is_admin());
create policy bi_entities_w      on bi_entities       for all using (bi_is_admin()) with check (bi_is_admin());
create policy bi_aliases_w       on bi_entity_aliases for all using (bi_is_admin()) with check (bi_is_admin());
create policy bi_providers_w     on bi_providers      for update using (bi_is_admin()) with check (bi_is_admin());
create policy bi_sources_w       on bi_sources        for all using (bi_is_staff()) with check (bi_is_staff());
create policy bi_feeds_rw        on bi_feeds          for all using (bi_is_admin()) with check (bi_is_admin());
create policy bi_query_terms_rw  on bi_query_terms    for all using (bi_is_admin()) with check (bi_is_admin());
create policy bi_settings_rw     on bi_settings       for all using (bi_is_admin()) with check (bi_is_admin());
create policy bi_stories_w       on bi_stories        for update using (bi_is_staff()) with check (bi_is_staff());
create policy bi_story_entities_w on bi_story_entities for all using (bi_is_staff()) with check (bi_is_staff());
create policy bi_story_segments_w on bi_story_segments for all using (bi_is_staff()) with check (bi_is_staff());
create policy bi_articles_w      on bi_articles       for update using (bi_is_staff()) with check (bi_is_staff());
create policy bi_scan_runs_read  on bi_scan_runs      for select using (bi_is_staff());
create policy bi_scan_logs_read  on bi_scan_logs      for select using (bi_is_staff());

-- Kullanıcının kendi takip / bildirim kayıtları
create policy bi_follows_own on bi_follows for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bi_prefs_own   on bi_notification_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bi_notif_own   on bi_notifications for select using (user_id = auth.uid());
create policy bi_notif_read  on bi_notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- analitik (yalnızca gerçek kayıtlardan)
-- Kapsam: yayımlanmış haberler. Pazar payı DEĞİL: "izlenen haber geçişlerindeki pay".
create or replace function bi_share_of_voice(p_entities uuid[], p_from timestamptz, p_to timestamptz, p_role text default 'any')
returns table (entity_id uuid, mentions bigint, share numeric)
language sql stable security invoker set search_path = public as $$
  with m as (
    select se.entity_id, count(distinct se.story_id) as mentions
    from bi_story_entities se
    join bi_stories s on s.id = se.story_id
    where s.status = 'published'
      and s.first_published_at >= p_from and s.first_published_at < p_to
      and se.entity_id = any(p_entities)
      and (p_role = 'any' or se.role = 'main')
      and 'O' <> all(s.topics)                -- dolaylı geçişler hariç (tutarlı dahil etme kuralı)
    group by se.entity_id
  )
  select e.id, coalesce(m.mentions, 0),
         case when sum(coalesce(m.mentions, 0)) over () = 0 then 0
              else round(100.0 * coalesce(m.mentions, 0) / sum(coalesce(m.mentions, 0)) over (), 1) end
  from unnest(p_entities) as e(id) left join m on m.entity_id = e.id;
$$;

create or replace function bi_overview(p_from timestamptz default now() - interval '30 days')
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'monitored_brands',   (select count(*) from bi_entities where is_active and merged_into_id is null),
    'stories_discovered', (select count(*) from bi_stories where created_at >= p_from),
    'stories_published',  (select count(*) from bi_stories where status = 'published' and first_published_at >= p_from),
    'awaiting_review',    (select count(*) from bi_stories where status in ('discovered', 'under_review')),
    'active_providers',   (select count(*) from bi_providers where is_enabled),
    'active_feeds',       (select count(*) from bi_feeds where is_active),
    'countries',          (select count(distinct country_iso2) from bi_stories where status = 'published' and first_published_at >= p_from and country_iso2 is not null),
    'segments',           (select count(*) from bi_segments),
    'from',               p_from
  );
$$;

-- ---------------------------------------------------------------- uygulama ve panel API'leri (RPC)
-- Hepsi security invoker: RLS geçerlidir, herkese açık çağrıda yalnızca yayımlanmış haberler sayılır.

-- Tek haber: tüm kaynaklar (birincil + ek), markalar ve segmentler
create or replace function bi_story(p_id uuid) returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'story', to_jsonb(s) - 'score_breakdown' - 'reviewed_by'
              || case when bi_is_staff() then jsonb_build_object('score_breakdown', s.score_breakdown) else '{}'::jsonb end,
    'sources', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'url', a.url, 'title', a.title, 'publisher', a.publisher,
                  'domain', a.source_domain, 'published_at', a.published_at, 'language', a.language, 'primary', a.id = s.primary_article_id,
                  'description', case when a.storage_right = 'snippet' then a.description end)
                  order by (a.id = s.primary_article_id) desc, a.published_at) from bi_articles a where a.story_id = s.id), '[]'),
    'brands', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'slug', e.slug, 'name', e.name, 'role', se.role,
                  'in_headline', se.in_headline, 'evidence', se.evidence, 'editor_set', se.editor_set)
                  order by se.role, e.name) from bi_story_entities se join bi_entities e on e.id = se.entity_id where se.story_id = s.id), '[]'),
    'segments', coalesce((select jsonb_agg(jsonb_build_object('key', g.segment_key, 'score', g.score, 'evidence', g.evidence) order by g.score desc nulls last)
                  from bi_story_segments g where g.story_id = s.id), '[]'))
  from bi_stories s where s.id = p_id;
$$;

-- Haber listesi (kart verisi). p_entity / p_topic / p_segment / p_country isteğe bağlı süzgeç.
create or replace function bi_stories_feed(p_limit int default 30, p_offset int default 0, p_entity uuid default null,
  p_topic text default null, p_segment text default null, p_country text default null, p_status text default 'published')
returns jsonb language sql stable security invoker set search_path = public as $$
  select coalesce(jsonb_agg(x order by x->>'first_published_at' desc nulls last), '[]') from (
    select jsonb_build_object('id', s.id, 'title', coalesce(s.headline_override, s.title), 'summary', s.summary, 'summary_is_ai', s.summary_is_ai,
      'status', s.status, 'segments', s.segments, 'topics', s.topics, 'country', s.country_iso2, 'first_published_at', s.first_published_at,
      'source_count', s.source_count, 'overall_score', s.overall_score, 'content_type', s.content_type, 'is_promotional', s.is_promotional,
      'review_reason', s.review_reason,
      'main', (select jsonb_build_object('slug', e.slug, 'name', e.name) from bi_entities e where e.id = s.main_entity_id),
      'publisher', a.publisher, 'url', a.url, 'domain', a.source_domain) as x
    from bi_stories s left join bi_articles a on a.id = s.primary_article_id
    where s.status::text = p_status
      and (p_entity is null or exists (select 1 from bi_story_entities se where se.story_id = s.id and se.entity_id = p_entity and se.role <> 'parent'))
      and (p_topic is null or p_topic = any(s.topics::text[]))
      and (p_segment is null or p_segment = any(s.segments))
      and (p_country is null or s.country_iso2 = p_country)
    order by s.first_published_at desc nulls last
    limit least(p_limit, 100) offset p_offset
  ) q;
$$;

-- Gösterge paneli: genel bakış, en çok anılan / en hızlı yükselen markalar, ülke, segment, iş konuları
create or replace function bi_dashboard(p_days int default 30) returns jsonb
language sql stable security invoker set search_path = public as $$
  with win as (select now() - make_interval(days => p_days) as f, now() - make_interval(days => 2 * p_days) as pf),
  pub as (select s.* from bi_stories s, win where s.status = 'published' and s.first_published_at >= win.pf),
  cur as (select * from pub, win where pub.first_published_at >= win.f),
  m as (
    select se.entity_id,
           count(distinct se.story_id) filter (where p.first_published_at >= (select f from win)) as n,
           count(distinct se.story_id) filter (where p.first_published_at <  (select f from win)) as prev
    from bi_story_entities se join pub p on p.id = se.story_id
    where se.role <> 'parent' and 'O' <> all(p.topics)
    group by se.entity_id)
  select jsonb_build_object(
    'days', p_days,
    'overview', bi_overview((select f from win)),
    'top_brands', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'slug', e.slug, 'name', e.name, 'mentions', m.n, 'prev', m.prev)
                    order by m.n desc, e.name) from (select * from m where n > 0 order by n desc limit 10) m join bi_entities e on e.id = m.entity_id), '[]'),
    'rising', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'slug', e.slug, 'name', e.name, 'mentions', m.n, 'prev', m.prev)
                    order by (m.n - m.prev) desc) from (select * from m where n >= 2 and n > prev order by (n - prev) desc limit 5) m join bi_entities e on e.id = m.entity_id), '[]'),
    'by_country', coalesce((select jsonb_agg(jsonb_build_object('country', country_iso2, 'n', n) order by n desc)
                    from (select country_iso2, count(*) n from cur where country_iso2 is not null group by 1 order by 2 desc limit 12) c), '[]'),
    'by_segment', coalesce((select jsonb_agg(jsonb_build_object('segment', g, 'n', n) order by n desc)
                    from (select unnest(segments) g, count(*) n from cur group by 1) c), '[]'),
    'by_topic', coalesce((select jsonb_object_agg(t, n) from (select unnest(topics)::text t, count(*) n from cur group by 1) c), '{}'),
    'weekly', coalesce((select jsonb_agg(jsonb_build_object('week', w, 'n', n) order by w)
                    from (select date_trunc('week', first_published_at)::date w, count(*) n from cur group by 1) c), '[]'));
$$;

-- Marka profili: kimlik, ana/alt şirketler, haftalık zaman çizelgesi, ülke/segment/konu kırılımı
create or replace function bi_brand_profile(p_slug text, p_days int default 365) returns jsonb
language sql stable security invoker set search_path = public as $$
  with e as (select * from bi_entities where slug = p_slug),
  st as (select s.* from bi_stories s join bi_story_entities se on se.story_id = s.id join e on e.id = se.entity_id
         where s.status = 'published' and se.role <> 'parent' and s.first_published_at >= now() - make_interval(days => p_days))
  select jsonb_build_object(
    'entity', (select to_jsonb(e) - 'notes' - 'exclusion_keywords' - 'search_keywords' from e),
    'parent', (select jsonb_build_object('slug', p.slug, 'name', p.name) from bi_entities p, e where p.id = e.parent_id),
    'children', coalesce((select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name, 'type', c.entity_type) order by c.name)
                  from bi_entities c, e where c.parent_id = e.id and c.is_active), '[]'),
    'total', (select count(*) from st),
    'weekly', coalesce((select jsonb_agg(jsonb_build_object('week', w, 'n', n) order by w)
                  from (select date_trunc('week', first_published_at)::date w, count(*) n from st group by 1) c), '[]'),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('country', country_iso2, 'n', n) order by n desc)
                  from (select country_iso2, count(*) n from st where country_iso2 is not null group by 1) c), '[]'),
    'segments', coalesce((select jsonb_agg(jsonb_build_object('segment', g, 'n', n) order by n desc)
                  from (select unnest(segments) g, count(*) n from st group by 1) c), '[]'),
    'topics', coalesce((select jsonb_object_agg(t, n) from (select unnest(topics)::text t, count(*) n from st group by 1) c), '{}'))
  from e;
$$;

-- Share of Voice (izlenen haber geçişleri). Tüm markalar aynı kaynak evreni ve aynı dahil etme kuralıyla sayılır.
create or replace function bi_sov(p_entities uuid[], p_days int default 90) returns jsonb
language sql stable security invoker set search_path = public as $$
  with st as (
    select s.id, s.first_published_at, s.country_iso2, s.segments, s.topics, se.entity_id
    from bi_stories s join bi_story_entities se on se.story_id = s.id
    where s.status = 'published' and se.role <> 'parent' and 'O' <> all(s.topics)
      and se.entity_id = any(p_entities) and s.first_published_at >= now() - make_interval(days => p_days))
  select jsonb_build_object(
    'days', p_days,
    'rule', 'Yayımlanmış COATNEWS GBI haberleri; dolaylı geçişler (O) hariç; ana şirket rolü sayılmaz.',
    'brands', (select jsonb_agg(jsonb_build_object('id', x.entity_id, 'slug', e.slug, 'name', e.name, 'mentions', x.mentions, 'share', x.share) order by x.mentions desc)
               from bi_share_of_voice(p_entities, now() - make_interval(days => p_days), now()) x join bi_entities e on e.id = x.entity_id),
    'weekly', coalesce((select jsonb_agg(jsonb_build_object('week', w, 'id', entity_id, 'n', n) order by w)
               from (select date_trunc('week', first_published_at)::date w, entity_id, count(distinct id) n from st group by 1, 2) c), '[]'),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('country', country_iso2, 'id', entity_id, 'n', n))
               from (select country_iso2, entity_id, count(distinct id) n from st where country_iso2 is not null group by 1, 2) c), '[]'),
    'segments', coalesce((select jsonb_agg(jsonb_build_object('segment', g, 'id', entity_id, 'n', n))
               from (select unnest(segments) g, entity_id, count(distinct id) n from st group by 1, 2) c), '[]'),
    'topics', coalesce((select jsonb_agg(jsonb_build_object('topic', t, 'id', entity_id, 'n', n))
               from (select unnest(topics)::text t, entity_id, count(distinct id) n from st group by 1, 2) c), '[]'));
$$;

-- Editör: iki haberi birleştir (kaynaklar ve marka/segment ilişkileri hedefe taşınır, kaynak haber arşivlenir)
create or replace function bi_merge_stories(p_from uuid, p_into uuid) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not bi_is_staff() then raise exception 'yetkisiz' using errcode = '42501'; end if;
  if p_from = p_into then raise exception 'aynı haber'; end if;
  update bi_articles set story_id = p_into, is_syndicated = true where story_id = p_from;
  insert into bi_story_entities (story_id, entity_id, role, mention_count, in_headline, evidence, confidence, editor_set)
    select p_into, entity_id, role, mention_count, in_headline, evidence, confidence, editor_set from bi_story_entities where story_id = p_from
    on conflict (story_id, entity_id) do nothing;
  insert into bi_story_segments (story_id, segment_key, score, evidence, editor_set)
    select p_into, segment_key, score, evidence, editor_set from bi_story_segments where story_id = p_from
    on conflict (story_id, segment_key) do nothing;
  update bi_stories t set source_count = (select count(*) from bi_articles where story_id = p_into),
    first_published_at = least(t.first_published_at, (select first_published_at from bi_stories where id = p_from))
    where t.id = p_into;
  update bi_stories set status = 'archived', primary_article_id = null, source_count = 0,
    review_reason = 'birleştirildi: ' || p_into, reviewed_by = auth.uid(), reviewed_at = now() where id = p_from;
end $$;

-- Yönetici: iki marka kaydını birleştir (alias'lar ve haber ilişkileri hedefe taşınır, kaynak pasifleşir)
create or replace function bi_merge_entities(p_from uuid, p_into uuid) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not bi_is_admin() then raise exception 'yetkisiz' using errcode = '42501'; end if;
  if p_from = p_into then raise exception 'aynı marka'; end if;
  insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive, use_in_search)
    select p_into, alias, alias_norm, lang, is_ambiguous, case_sensitive, use_in_search from bi_entity_aliases where entity_id = p_from
    on conflict (entity_id, alias_norm) do nothing;
  delete from bi_entity_aliases where entity_id = p_from;
  insert into bi_story_entities (story_id, entity_id, role, mention_count, in_headline, evidence, confidence, editor_set)
    select story_id, p_into, role, mention_count, in_headline, evidence, confidence, editor_set from bi_story_entities where entity_id = p_from
    on conflict (story_id, entity_id) do nothing;
  delete from bi_story_entities where entity_id = p_from;
  update bi_stories set main_entity_id = p_into where main_entity_id = p_from;
  update bi_entities set parent_id = p_into where parent_id = p_from;
  update bi_entities set is_active = false, merged_into_id = p_into where id = p_from;
  update bi_entities set article_count = (select count(distinct story_id) from bi_story_entities where entity_id = p_into and role <> 'parent') where id = p_into;
end $$;

commit;
