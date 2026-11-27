-- OTOMATİK ÜRETİLDİ: node scripts/bi-seed-sql.mjs (kaynak: supabase/seed/brands.json)
begin;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('jotun', 'Jotun', 'manufacturer', null, 'NO', 'https://www.jotun.com', array['marine', 'protective', 'powder', 'decorative', 'energy']::text[], array['Jotamastic', 'Hardtop', 'Penguard', 'SeaForce', 'Jotachar', 'Steelmaster', 'Jotashield', 'Fenomastic', 'HullSkater']::text[], '{}'::text[], array['en', 'tr', 'de', 'fr', 'it', 'es', 'nl', 'pt', 'pl', 'zh']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('jotun-turkiye', 'Jotun Türkiye', 'consumer_brand', null, 'TR', null, array['marine', 'protective', 'powder', 'decorative', 'energy']::text[], '{}'::text[], '{}'::text[], array['tr', 'en']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('hempel', 'Hempel', 'manufacturer', 'Hempel Foundation''a ait', 'DK', 'https://www.hempel.com', array['marine', 'protective', 'decorative', 'energy']::text[], array['Hempadur', 'Hempaguard', 'Hempathane', 'Hempacore', 'Avantguard', 'Hempaxtreme']::text[], array['Hempel Sağlık']::text[], array['en', 'tr', 'de', 'fr', 'it', 'es', 'nl', 'pt', 'pl', 'zh']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('hempel-turkiye', 'Hempel Türkiye', 'consumer_brand', null, 'TR', null, array['marine', 'protective', 'decorative']::text[], '{}'::text[], '{}'::text[], array['tr', 'en']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('ppg', 'PPG Industries', 'corporate_group', null, 'US', 'https://www.ppg.com', array['marine', 'protective', 'powder', 'decorative', 'energy']::text[], array['Sigma', 'Amercoat', 'PPG SteelGuard', 'PPG Envirocron', 'PPG Pitt-Char', 'PPG PSX']::text[], array['PPG Paints Arena', 'photoplethysmography', 'photoplethysmogram', 'PPG sensor', 'PPG signal']::text[], array['en', 'tr', 'de', 'fr', 'it', 'es', 'nl', 'pt', 'pl', 'zh']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('tikkurila', 'Tikkurila', 'manufacturer', null, 'FI', 'https://www.tikkurila.com', array['protective', 'decorative']::text[], array['Temaspeed', 'Temadur', 'Temacoat']::text[], '{}'::text[], array['en', 'de', 'pl', 'nl']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('akzonobel', 'AkzoNobel', 'corporate_group', null, 'NL', 'https://www.akzonobel.com', array['marine', 'protective', 'powder', 'decorative', 'energy']::text[], array['Interseal', 'Interzone', 'Intershield', 'Interchar', 'Chartek', 'Intertherm']::text[], '{}'::text[], array['en', 'tr', 'de', 'fr', 'it', 'es', 'nl', 'pt', 'pl', 'zh']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('international-paint', 'International (AkzoNobel)', 'product_brand', null, null, null, array['marine', 'protective']::text[], '{}'::text[], '{}'::text[], array['en']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('interpon', 'Interpon', 'product_brand', null, null, 'https://www.interpon.com', array['powder']::text[], '{}'::text[], '{}'::text[], array['en', 'tr', 'de', 'it', 'es', 'pl', 'zh']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('dulux-akzonobel', 'Dulux (AkzoNobel)', 'consumer_brand', null, null, null, array['decorative']::text[], '{}'::text[], '{}'::text[], array['en', 'nl', 'pl', 'it']::text[], 3, 'Dulux adı Avustralya/Yeni Zelanda''da Nippon Paint''e ait DuluxGroup tarafından kullanılır. Ülke bağlamı yoksa editör incelemesine düşer.')
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('sikkens', 'Sikkens', 'consumer_brand', null, null, null, array['decorative']::text[], '{}'::text[], '{}'::text[], array['en', 'de', 'nl', 'fr', 'it']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('marshall', 'Marshall Boya', 'consumer_brand', null, 'TR', 'https://www.marshallboya.com', array['decorative']::text[], '{}'::text[], array['Marshall Islands', 'Marshall Adaları', 'Marshall Plan', 'Marshall Planı', 'amplifier', 'amfi', 'hoparlör', 'speaker', 'headphones', 'kulaklık', 'Marshall Amplification', 'Marshall University', 'Thurgood Marshall', 'Marshall County', 'fire marshal', 'US Marshals']::text[], array['tr']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('sherwin-williams', 'Sherwin-Williams', 'corporate_group', null, 'US', 'https://www.sherwin-williams.com', array['marine', 'protective', 'powder', 'decorative', 'energy']::text[], array['Firetex', 'Macropoxy', 'Dura-Plate', 'Heat-Flex', 'Valspar']::text[], '{}'::text[], array['en', 'tr', 'de', 'fr', 'it', 'es', 'nl', 'pt', 'pl', 'zh']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('huarun', 'Huarun Paints', 'consumer_brand', null, 'CN', null, array['decorative']::text[], '{}'::text[], '{}'::text[], array['zh', 'en']::text[], 3, 'Ana şirket bilgisi doğrulanmalı.')
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('nippon-paint', 'Nippon Paint', 'corporate_group', null, 'JP', 'https://www.nipponpaint-holdings.com', array['marine', 'protective', 'powder', 'decorative']::text[], '{}'::text[], '{}'::text[], array['en', 'tr', 'zh', 'de', 'fr', 'es', 'pt']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('duluxgroup', 'DuluxGroup (Nippon Paint)', 'corporate_group', null, 'AU', null, array['decorative']::text[], '{}'::text[], '{}'::text[], array['en']::text[], 3, 'Avustralya ve Yeni Zelanda''daki Dulux. Avrupa''daki Dulux AkzoNobel''e aittir.')
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('filli-boya', 'Filli Boya', 'consumer_brand', 'Betek Boya ve Kimya (Nippon Paint grubu)', 'TR', 'https://www.filliboya.com', array['decorative', 'protective']::text[], '{}'::text[], '{}'::text[], array['tr']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('axalta', 'Axalta', 'manufacturer', null, 'US', 'https://www.axalta.com', array['powder', 'protective', 'energy']::text[], array['Alesta', 'Nap-Gard', 'Voltatex']::text[], '{}'::text[], array['en', 'tr', 'de', 'fr', 'it', 'es', 'pl', 'zh']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('kansai-paint', 'Kansai Paint', 'corporate_group', null, 'JP', 'https://www.kansai.co.jp', array['marine', 'protective', 'decorative', 'powder']::text[], '{}'::text[], '{}'::text[], array['en', 'tr', 'zh']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('kansai-helios', 'Helios (Kansai Helios)', 'manufacturer', null, 'SI', null, array['protective', 'powder', 'decorative']::text[], '{}'::text[], array['Helios Kliniken', 'Helios Klinikum', 'Helios hospital', 'Helios Towers', 'Helios Energy', 'Helios Technologies', 'Helios satellite', 'Helios Airways']::text[], array['en', 'de', 'pl']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('polisan-kansai', 'Polisan Kansai Boya', 'manufacturer', 'Polisan Holding ile Kansai Paint ortak girişimi', 'TR', 'https://www.polisankansai.com', array['decorative', 'protective', 'marine']::text[], '{}'::text[], array['Polisan Kimya', 'Polisan Holding hisse']::text[], array['tr', 'en']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('teknos', 'Teknos', 'manufacturer', null, 'FI', 'https://www.teknos.com', array['protective', 'powder', 'decorative']::text[], array['Teknodur', 'Inerta']::text[], '{}'::text[], array['en', 'de', 'pl', 'nl']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('chugoku', 'Chugoku Marine Paints', 'manufacturer', null, 'JP', 'https://www.cmp.co.jp', array['marine', 'protective']::text[], array['SEAFLO']::text[], '{}'::text[], array['en', 'zh']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('kcc', 'KCC Corporation', 'manufacturer', null, 'KR', 'https://www.kccworld.co.kr', array['marine', 'protective', 'decorative']::text[], '{}'::text[], array['Kansas City', 'Kenya Cooperative Creameries', 'KCC Glass Kenya']::text[], array['en']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('benjamin-moore', 'Benjamin Moore', 'consumer_brand', 'Berkshire Hathaway''e ait (kaplama grubu değil)', 'US', 'https://www.benjaminmoore.com', array['decorative']::text[], '{}'::text[], '{}'::text[], array['en']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('rpm', 'RPM International', 'corporate_group', null, 'US', 'https://www.rpminc.com', array['protective', 'decorative', 'energy']::text[], '{}'::text[], '{}'::text[], array['en']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('rust-oleum', 'Rust-Oleum', 'consumer_brand', null, 'US', 'https://www.rustoleum.com', array['decorative', 'protective']::text[], '{}'::text[], '{}'::text[], array['en', 'nl', 'de']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('carboline', 'Carboline', 'manufacturer', null, 'US', 'https://www.carboline.com', array['protective', 'energy', 'marine']::text[], array['Carbomastic', 'Carbozinc', 'Pyroclad']::text[], '{}'::text[], array['en', 'es', 'pt']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('berger-paints', 'Berger Paints', 'manufacturer', null, 'IN', 'https://www.bergerpaints.com', array['decorative', 'protective', 'powder']::text[], '{}'::text[], '{}'::text[], array['en']::text[], 3, 'Berger markası farklı ülkelerde farklı şirketlere ait olabilir; ülke bağlamı gerekir.')
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('asian-paints', 'Asian Paints', 'manufacturer', null, 'IN', 'https://www.asianpaints.com', array['decorative', 'protective']::text[], '{}'::text[], '{}'::text[], array['en']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('toa-paint', 'TOA Paint', 'manufacturer', null, 'TH', null, array['decorative', 'protective']::text[], '{}'::text[], array['TOA Corporation', 'TOA Electronics', 'TOA amplifier', 'time of arrival']::text[], array['en']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('beckers', 'Beckers', 'manufacturer', null, 'SE', 'https://www.beckers-group.com', array['protective', 'decorative']::text[], '{}'::text[], '{}'::text[], array['en', 'de']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('daw', 'DAW', 'corporate_group', null, 'DE', 'https://www.daw.de', array['decorative', 'protective']::text[], '{}'::text[], array['digital audio workstation', 'Ableton', 'FL Studio']::text[], array['de', 'en', 'pl', 'tr']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('caparol', 'Caparol', 'consumer_brand', null, 'DE', 'https://www.caparol.de', array['decorative']::text[], '{}'::text[], '{}'::text[], array['de', 'en', 'pl', 'tr', 'it']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('sika', 'Sika', 'manufacturer', null, 'CH', 'https://www.sika.com', array['protective', 'decorative', 'energy']::text[], '{}'::text[], array['sika deer', 'Sika geyiği']::text[], array['en', 'de', 'fr', 'tr', 'it', 'es']::text[], 2, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('dyo', 'DYO', 'manufacturer', 'Yaşar Holding', 'TR', 'https://www.dyo.com.tr', array['decorative', 'protective', 'powder']::text[], '{}'::text[], '{}'::text[], array['tr']::text[], 1, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('kalekim', 'Kalekim', 'manufacturer', 'Kale Grubu', 'TR', 'https://www.kalekim.com', array['decorative', 'protective']::text[], '{}'::text[], '{}'::text[], array['tr', 'en']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('permolit', 'Permolit', 'manufacturer', null, 'TR', null, array['decorative']::text[], '{}'::text[], '{}'::text[], array['tr']::text[], 3, null)
on conflict (slug) do nothing;
insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values ('bianca-boya', 'Bianca Boya', 'manufacturer', null, 'TR', null, array['decorative']::text[], '{}'::text[], '{}'::text[], array['tr']::text[], 3, null)
on conflict (slug) do nothing;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'jotun-turkiye' and p.slug = 'jotun' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'hempel-turkiye' and p.slug = 'hempel' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'tikkurila' and p.slug = 'ppg' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'international-paint' and p.slug = 'akzonobel' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'interpon' and p.slug = 'akzonobel' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'dulux-akzonobel' and p.slug = 'akzonobel' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'sikkens' and p.slug = 'akzonobel' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'marshall' and p.slug = 'akzonobel' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'duluxgroup' and p.slug = 'nippon-paint' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'filli-boya' and p.slug = 'nippon-paint' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'kansai-helios' and p.slug = 'kansai-paint' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'polisan-kansai' and p.slug = 'kansai-paint' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'rust-oleum' and p.slug = 'rpm' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'carboline' and p.slug = 'rpm' and c.parent_id is null;
update bi_entities c set parent_id = p.id from bi_entities p where c.slug = 'caparol' and p.slug = 'daw' and c.parent_id is null;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun', 'jotun', null, false, false from bi_entities where slug = 'jotun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun Paints', 'jotun paints', null, false, false from bi_entities where slug = 'jotun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun Coatings', 'jotun coatings', null, false, false from bi_entities where slug = 'jotun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun Group', 'jotun group', null, false, false from bi_entities where slug = 'jotun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun A/S', 'jotun a s', null, false, false from bi_entities where slug = 'jotun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '佐敦', '佐敦', null, false, false from bi_entities where slug = 'jotun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun Türkiye', 'jotun turkiye', null, false, false from bi_entities where slug = 'jotun-turkiye'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun Turkey', 'jotun turkey', null, false, false from bi_entities where slug = 'jotun-turkiye'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun Boya', 'jotun boya', null, false, false from bi_entities where slug = 'jotun-turkiye'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Jotun Boya Sanayi', 'jotun boya sanayi', null, false, false from bi_entities where slug = 'jotun-turkiye'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Hempel', 'hempel', null, false, false from bi_entities where slug = 'hempel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Hempel Coatings', 'hempel coatings', null, false, false from bi_entities where slug = 'hempel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Hempel Paints', 'hempel paints', null, false, false from bi_entities where slug = 'hempel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Hempel A/S', 'hempel a s', null, false, false from bi_entities where slug = 'hempel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '海虹老人', '海虹老人', null, false, false from bi_entities where slug = 'hempel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Hempel Türkiye', 'hempel turkiye', null, false, false from bi_entities where slug = 'hempel-turkiye'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Hempel Turkey', 'hempel turkey', null, false, false from bi_entities where slug = 'hempel-turkiye'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Hempel Boya', 'hempel boya', null, false, false from bi_entities where slug = 'hempel-turkiye'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'PPG', 'ppg', null, true, true from bi_entities where slug = 'ppg'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'PPG Industries', 'ppg industries', null, false, false from bi_entities where slug = 'ppg'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'PPG Paints', 'ppg paints', null, false, false from bi_entities where slug = 'ppg'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'PPG Coatings', 'ppg coatings', null, false, false from bi_entities where slug = 'ppg'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'PPG Protective & Marine Coatings', 'ppg protective marine coatings', null, false, false from bi_entities where slug = 'ppg'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'PPG涂料', 'ppg涂料', null, false, false from bi_entities where slug = 'ppg'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Tikkurila', 'tikkurila', null, false, false from bi_entities where slug = 'tikkurila'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Tikkurila Oyj', 'tikkurila oyj', null, false, false from bi_entities where slug = 'tikkurila'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'AkzoNobel', 'akzonobel', null, false, false from bi_entities where slug = 'akzonobel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Akzo Nobel', 'akzo nobel', null, false, false from bi_entities where slug = 'akzonobel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'AkzoNobel Coatings', 'akzonobel coatings', null, false, false from bi_entities where slug = 'akzonobel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Akzo Nobel Kemipol', 'akzo nobel kemipol', null, false, false from bi_entities where slug = 'akzonobel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '阿克苏诺贝尔', '阿克苏诺贝尔', null, false, false from bi_entities where slug = 'akzonobel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'International Paint', 'international paint', null, false, false from bi_entities where slug = 'international-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'International Marine Coatings', 'international marine coatings', null, false, false from bi_entities where slug = 'international-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'International Protective Coatings', 'international protective coatings', null, false, false from bi_entities where slug = 'international-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'International Yacht Paint', 'international yacht paint', null, false, false from bi_entities where slug = 'international-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Interpon', 'interpon', null, false, false from bi_entities where slug = 'interpon'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Interpon Powder Coatings', 'interpon powder coatings', null, false, false from bi_entities where slug = 'interpon'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Dulux', 'dulux', null, true, false from bi_entities where slug = 'dulux-akzonobel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Dulux UK', 'dulux uk', null, false, false from bi_entities where slug = 'dulux-akzonobel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Dulux Trade', 'dulux trade', null, false, false from bi_entities where slug = 'dulux-akzonobel'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Sikkens', 'sikkens', null, false, false from bi_entities where slug = 'sikkens'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Marshall Boya', 'marshall boya', null, false, false from bi_entities where slug = 'marshall'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Marshall', 'marshall', null, true, true from bi_entities where slug = 'marshall'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Sherwin-Williams', 'sherwin williams', null, false, false from bi_entities where slug = 'sherwin-williams'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Sherwin Williams', 'sherwin williams', null, false, false from bi_entities where slug = 'sherwin-williams'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Sherwin-Williams Protective & Marine', 'sherwin williams protective marine', null, false, false from bi_entities where slug = 'sherwin-williams'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '宣伟', '宣伟', null, false, false from bi_entities where slug = 'sherwin-williams'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Huarun', 'huarun', null, false, false from bi_entities where slug = 'huarun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Huarun Paints', 'huarun paints', null, false, false from bi_entities where slug = 'huarun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '华润涂料', '华润涂料', null, false, false from bi_entities where slug = 'huarun'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Nippon Paint', 'nippon paint', null, false, false from bi_entities where slug = 'nippon-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Nippon Paint Holdings', 'nippon paint holdings', null, false, false from bi_entities where slug = 'nippon-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Nippon Paint Marine', 'nippon paint marine', null, false, false from bi_entities where slug = 'nippon-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '立邦', '立邦', null, false, false from bi_entities where slug = 'nippon-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '日本ペイント', '日本ヘ イント', null, false, false from bi_entities where slug = 'nippon-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'DuluxGroup', 'duluxgroup', null, false, false from bi_entities where slug = 'duluxgroup'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Dulux Group', 'dulux group', null, false, false from bi_entities where slug = 'duluxgroup'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Dulux', 'dulux', null, true, false from bi_entities where slug = 'duluxgroup'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Filli Boya', 'filli boya', null, false, false from bi_entities where slug = 'filli-boya'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Betek Boya', 'betek boya', null, false, false from bi_entities where slug = 'filli-boya'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Betek Boya ve Kimya', 'betek boya ve kimya', null, false, false from bi_entities where slug = 'filli-boya'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Axalta', 'axalta', null, false, false from bi_entities where slug = 'axalta'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Axalta Coating Systems', 'axalta coating systems', null, false, false from bi_entities where slug = 'axalta'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '艾仕得', '艾仕得', null, false, false from bi_entities where slug = 'axalta'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Kansai Paint', 'kansai paint', null, false, false from bi_entities where slug = 'kansai-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '関西ペイント', '関西ヘ イント', null, false, false from bi_entities where slug = 'kansai-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '关西涂料', '关西涂料', null, false, false from bi_entities where slug = 'kansai-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Kansai Helios', 'kansai helios', null, false, false from bi_entities where slug = 'kansai-helios'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Helios Group', 'helios group', null, false, false from bi_entities where slug = 'kansai-helios'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Helios', 'helios', null, true, true from bi_entities where slug = 'kansai-helios'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Polisan Kansai', 'polisan kansai', null, false, false from bi_entities where slug = 'polisan-kansai'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Polisan Kansai Boya', 'polisan kansai boya', null, false, false from bi_entities where slug = 'polisan-kansai'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Polisan', 'polisan', null, true, false from bi_entities where slug = 'polisan-kansai'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Teknos', 'teknos', null, false, false from bi_entities where slug = 'teknos'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Teknos Group', 'teknos group', null, false, false from bi_entities where slug = 'teknos'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Teknos Oy', 'teknos oy', null, false, false from bi_entities where slug = 'teknos'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Chugoku Marine Paints', 'chugoku marine paints', null, false, false from bi_entities where slug = 'chugoku'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Chugoku Paints', 'chugoku paints', null, false, false from bi_entities where slug = 'chugoku'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'CMP coatings', 'cmp coatings', null, false, false from bi_entities where slug = 'chugoku'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '中国涂料', '中国涂料', null, false, false from bi_entities where slug = 'chugoku'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'KCC Corporation', 'kcc corporation', null, false, false from bi_entities where slug = 'kcc'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'KCC Paint', 'kcc paint', null, false, false from bi_entities where slug = 'kcc'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'KCC Coatings', 'kcc coatings', null, false, false from bi_entities where slug = 'kcc'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'KCC', 'kcc', null, true, true from bi_entities where slug = 'kcc'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Benjamin Moore', 'benjamin moore', null, false, false from bi_entities where slug = 'benjamin-moore'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Benjamin Moore & Co', 'benjamin moore co', null, false, false from bi_entities where slug = 'benjamin-moore'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'RPM International', 'rpm international', null, false, false from bi_entities where slug = 'rpm'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'RPM Performance Coatings', 'rpm performance coatings', null, false, false from bi_entities where slug = 'rpm'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Rust-Oleum', 'rust oleum', null, false, false from bi_entities where slug = 'rust-oleum'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Rustoleum', 'rustoleum', null, false, false from bi_entities where slug = 'rust-oleum'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Rust Oleum', 'rust oleum', null, false, false from bi_entities where slug = 'rust-oleum'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Carboline', 'carboline', null, false, false from bi_entities where slug = 'carboline'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Berger Paints', 'berger paints', null, false, false from bi_entities where slug = 'berger-paints'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Berger Paints India', 'berger paints india', null, false, false from bi_entities where slug = 'berger-paints'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Berger', 'berger', null, true, true from bi_entities where slug = 'berger-paints'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Asian Paints', 'asian paints', null, false, false from bi_entities where slug = 'asian-paints'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Asian Paints Ltd', 'asian paints ltd', null, false, false from bi_entities where slug = 'asian-paints'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, '亚洲涂料', '亚洲涂料', null, false, false from bi_entities where slug = 'asian-paints'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'TOA Paint', 'toa paint', null, false, false from bi_entities where slug = 'toa-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'TOA Paint (Thailand)', 'toa paint thailand', null, false, false from bi_entities where slug = 'toa-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'TOA', 'toa', null, true, true from bi_entities where slug = 'toa-paint'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Beckers Group', 'beckers group', null, false, false from bi_entities where slug = 'beckers'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Beckers coatings', 'beckers coatings', null, false, false from bi_entities where slug = 'beckers'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Beckers', 'beckers', null, true, true from bi_entities where slug = 'beckers'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'DAW SE', 'daw se', null, false, false from bi_entities where slug = 'daw'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Deutsche Amphibolin-Werke', 'deutsche amphibolin werke', null, false, false from bi_entities where slug = 'daw'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'DAW', 'daw', null, true, true from bi_entities where slug = 'daw'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Caparol', 'caparol', null, false, false from bi_entities where slug = 'caparol'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Sika AG', 'sika ag', null, false, false from bi_entities where slug = 'sika'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Sika Group', 'sika group', null, false, false from bi_entities where slug = 'sika'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Sika', 'sika', null, true, true from bi_entities where slug = 'sika'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'DYO Boya', 'dyo boya', null, false, false from bi_entities where slug = 'dyo'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'DYO Boya Fabrikaları', 'dyo boya fabrikalari', null, false, false from bi_entities where slug = 'dyo'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'DYO', 'dyo', null, false, true from bi_entities where slug = 'dyo'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Kalekim', 'kalekim', null, false, false from bi_entities where slug = 'kalekim'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Permolit', 'permolit', null, false, false from bi_entities where slug = 'permolit'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Permolit Boya', 'permolit boya', null, false, false from bi_entities where slug = 'permolit'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, 'Bianca Boya', 'bianca boya', null, false, false from bi_entities where slug = 'bianca-boya'
on conflict (entity_id, alias_norm) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'coatings', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'paint', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'paints', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'investment', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'factory', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'plant', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'acquisition', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'partnership', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'project', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'product launch', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('en', 'capacity', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'boya', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'kaplama', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'yatırım', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'fabrika', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'tesis', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'proje', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'ihale', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'yeni ürün', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'satın alma', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('tr', 'kapasite', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('de', 'Beschichtung', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('de', 'Farbe', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('de', 'Lack', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('de', 'Investition', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('de', 'Werk', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('de', 'Übernahme', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('de', 'Partnerschaft', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('de', 'Projekt', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('fr', 'peinture', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('fr', 'revêtement', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('fr', 'investissement', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('fr', 'usine', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('fr', 'acquisition', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('fr', 'partenariat', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('fr', 'projet', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('it', 'vernici', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('it', 'rivestimenti', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('it', 'pitture', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('it', 'investimento', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('it', 'stabilimento', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('it', 'acquisizione', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('it', 'progetto', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('es', 'pinturas', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('es', 'recubrimientos', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('es', 'inversión', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('es', 'planta', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('es', 'fábrica', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('es', 'adquisición', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('es', 'proyecto', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('nl', 'verf', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('nl', 'coatings', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('nl', 'investering', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('nl', 'fabriek', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('nl', 'overname', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('nl', 'project', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pt', 'tintas', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pt', 'revestimentos', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pt', 'investimento', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pt', 'fábrica', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pt', 'aquisição', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pt', 'projeto', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pl', 'farby', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pl', 'powłoki', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pl', 'lakiery', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pl', 'inwestycja', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pl', 'fabryka', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pl', 'przejęcie', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('pl', 'projekt', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('zh', '涂料', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('zh', '油漆', 'context') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('zh', '投资', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('zh', '工厂', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('zh', '收购', 'business') on conflict (lang, term) do nothing;
insert into bi_query_terms (lang, term, kind) values ('zh', '项目', 'business') on conflict (lang, term) do nothing;
commit;
