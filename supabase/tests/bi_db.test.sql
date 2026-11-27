-- Veritabanı testleri: yetki (RLS), bildirim kuyruğu, Share of Voice, idempotent tekrar engeli.
-- Çalıştırma: scripts/bi-db-test.sh (yerel Postgres, Supabase iskeleti ile). TEST VERİSİDİR.
\set ON_ERROR_STOP 1
begin;

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.invalid'),
  ('00000000-0000-0000-0000-00000000000e', 'editor@test.invalid'),
  ('00000000-0000-0000-0000-000000000001', 'reader@test.invalid'),
  ('00000000-0000-0000-0000-000000000002', 'reader2@test.invalid');
insert into bi_staff values ('00000000-0000-0000-0000-00000000000a', 'admin', now()), ('00000000-0000-0000-0000-00000000000e', 'editor', now());

-- İki haber: biri Jotun ana konu, biri Hempel ana konu + Jotun geçiyor
insert into bi_stories (id, status, title, segments, topics, overall_score, first_published_at, country_iso2) values
  ('10000000-0000-0000-0000-000000000001', 'discovered', 'Test: Jotun plant', '{protective}', '{B}', 88, now() - interval '1 day', 'EG'),
  ('10000000-0000-0000-0000-000000000002', 'discovered', 'Test: Hempel and Jotun', '{marine}', '{G,H}', 80, now() - interval '2 day', 'TR'),
  ('10000000-0000-0000-0000-000000000003', 'discovered', 'Test: incidental', '{marine}', '{O}', 60, now() - interval '2 day', 'TR');
insert into bi_articles (story_id, provider_key, url, canonical_url, title, title_norm) values
  ('10000000-0000-0000-0000-000000000001', 'gdelt', 'https://a.example/1', 'https://a.example/1', 'Test: Jotun plant', 'test jotun plant'),
  ('10000000-0000-0000-0000-000000000002', 'gdelt', 'https://a.example/2', 'https://a.example/2', 'Test: Hempel and Jotun', 'test hempel and jotun'),
  ('10000000-0000-0000-0000-000000000003', 'gdelt', 'https://a.example/3', 'https://a.example/3', 'Test: incidental', 'test incidental');
insert into bi_story_entities (story_id, entity_id, role)
  select '10000000-0000-0000-0000-000000000001'::uuid, id, 'main'::bi_entity_role from bi_entities where slug = 'jotun' union all
  select '10000000-0000-0000-0000-000000000002'::uuid, id, 'main'::bi_entity_role from bi_entities where slug = 'hempel' union all
  select '10000000-0000-0000-0000-000000000002'::uuid, id, 'mentioned'::bi_entity_role from bi_entities where slug = 'jotun' union all
  select '10000000-0000-0000-0000-000000000003'::uuid, id, 'mentioned'::bi_entity_role from bi_entities where slug = 'hempel';

-- Takipler
insert into bi_follows (user_id, kind, ref)
  select '00000000-0000-0000-0000-000000000001', 'entity', id::text from bi_entities where slug = 'jotun';
insert into bi_follows values ('00000000-0000-0000-0000-000000000002', 'segment', 'marine', now());
insert into bi_notification_prefs (user_id, min_score) values ('00000000-0000-0000-0000-000000000002', 85);

-- 1) İdempotentlik: aynı kanonik URL ikinci kez eklenemez
do $$ begin
  begin
    insert into bi_articles (story_id, provider_key, url, canonical_url, title, title_norm)
    values ('10000000-0000-0000-0000-000000000001', 'rss', 'https://a.example/1?utm=x', 'https://a.example/1', 'x', 'x');
    raise exception 'FAIL: kanonik URL tekrarı kabul edildi';
  exception when unique_violation then null;
  end;
end $$;

-- 2) Yayımlama → bildirim kuyruğu (takip + puan eşiği + tekrar yok)
update bi_stories set status = 'published' where id in ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003');
do $$ declare n1 int; n2 int; begin
  select count(*) into n1 from bi_notifications where user_id = '00000000-0000-0000-0000-000000000001';
  select count(*) into n2 from bi_notifications where user_id = '00000000-0000-0000-0000-000000000002';
  if n1 <> 2 then raise exception 'FAIL: Jotun takipçisi 2 bildirim almalıydı, % aldı', n1; end if;
  if n2 <> 0 then raise exception 'FAIL: min_score=85 olan marine takipçisi 80 ve 60 puanlı haberler için bildirim almamalıydı, % aldı', n2; end if;
end $$;
update bi_stories set status = 'archived' where id = '10000000-0000-0000-0000-000000000001';
update bi_stories set status = 'published' where id = '10000000-0000-0000-0000-000000000001';
do $$ begin
  if (select count(*) from bi_notifications where user_id = '00000000-0000-0000-0000-000000000001') <> 2 then
    raise exception 'FAIL: yeniden yayımlama tekrar bildirim üretti'; end if;
  if (select published_at from bi_stories where id = '10000000-0000-0000-0000-000000000001') is null then
    raise exception 'FAIL: published_at atanmadı'; end if;
end $$;

-- 3) Share of Voice: dolaylı (O) haber hariç; Jotun 2, Hempel 1 → %66.7 / %33.3
do $$ declare j numeric; h numeric; jm bigint; begin
  select share, mentions into j, jm from bi_share_of_voice(array[(select id from bi_entities where slug='jotun'), (select id from bi_entities where slug='hempel')], now() - interval '30 days', now())
    where entity_id = (select id from bi_entities where slug = 'jotun');
  select share into h from bi_share_of_voice(array[(select id from bi_entities where slug='jotun'), (select id from bi_entities where slug='hempel')], now() - interval '30 days', now())
    where entity_id = (select id from bi_entities where slug = 'hempel');
  if jm <> 2 or j <> 66.7 or h <> 33.3 then raise exception 'FAIL: SoV beklenmeyen: jotun % (% geçiş), hempel %', j, jm, h; end if;
  -- yalnızca ana konu
  select mentions into jm from bi_share_of_voice(array[(select id from bi_entities where slug='jotun')], now() - interval '30 days', now(), 'main');
  if jm <> 1 then raise exception 'FAIL: ana konu SoV jotun 1 olmalı, %', jm; end if;
end $$;

-- 4) Overview gerçek sayılardan
do $$ declare o jsonb; begin
  o := bi_overview(now() - interval '30 days');
  if (o->>'monitored_brands')::int <> 39 or (o->>'stories_published')::int <> 3 or (o->>'segments')::int <> 5 then
    raise exception 'FAIL: overview %', o; end if;
end $$;

-- 5) RLS: anonim yalnızca yayımlanmış haberi görür, yazamaz
insert into bi_stories (id, status, title) values ('10000000-0000-0000-0000-000000000009', 'under_review', 'Test: draft');
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if (select count(*) from bi_stories) <> 3 then raise exception 'FAIL: anonim taslak haberi gördü'; end if;
  if (select count(*) from bi_scan_runs) <> 0 then null; end if;
  begin
    update bi_entities set name = 'x' where slug = 'jotun';
    if found then raise exception 'FAIL: anonim marka güncelledi'; end if;
  end;
  begin
    insert into bi_entities (slug, name, entity_type) values ('hack', 'Hack', 'manufacturer');
    raise exception 'FAIL: anonim marka ekledi';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 6) RLS: okuyucu kendi takibini yönetir, başkasınınkini göremez; editör marka ekleyemez, haber düzenleyebilir; admin marka ekler
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$ begin
  if (select count(*) from bi_follows) <> 1 then raise exception 'FAIL: okuyucu başkasının takibini gördü'; end if;
  insert into bi_follows values ('00000000-0000-0000-0000-000000000001', 'country', 'TR', now());
  begin
    insert into bi_follows values ('00000000-0000-0000-0000-000000000002', 'country', 'TR', now());
    raise exception 'FAIL: başkası adına takip eklendi';
  exception when insufficient_privilege then null;
  end;
  update bi_stories set status = 'published' where id = '10000000-0000-0000-0000-000000000009';
  if found then raise exception 'FAIL: okuyucu haber yayımladı'; end if;
  if (select count(*) from bi_providers) <> 4 then raise exception 'FAIL: sağlayıcı durumu okunamadı'; end if;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', true);
do $$ begin
  if (select count(*) from bi_stories) <> 4 then raise exception 'FAIL: editör taslağı görmedi'; end if;
  update bi_stories set status = 'approved', headline_override = 'Düzeltilmiş' where id = '10000000-0000-0000-0000-000000000009';
  if not found then raise exception 'FAIL: editör haberi onaylayamadı'; end if;
  begin
    insert into bi_entities (slug, name, entity_type) values ('ed', 'Ed', 'manufacturer');
    raise exception 'FAIL: editör marka ekledi (yalnızca admin)';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$ begin
  insert into bi_entities (slug, name, entity_type) values ('test-brand', 'Test Brand', 'manufacturer');
  update bi_settings set value = '{"very_high": 92, "high": 80, "medium": 55}' where key = 'thresholds';
  if not found then raise exception 'FAIL: admin eşikleri değiştiremedi'; end if;
end $$;

reset role;
rollback;
select 'bi_db tests: OK' as result;
