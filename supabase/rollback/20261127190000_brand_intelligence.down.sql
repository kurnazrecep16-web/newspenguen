-- Geri alma: Global Brand Intelligence. Yalnızca bi_ nesnelerini siler; news_items / feed_runs etkilenmez.
-- DİKKAT: toplanan bi_ verisi de silinir. Çalıştırmadan önce yedek alın.
begin;
drop function if exists bi_overview(timestamptz);
drop function if exists bi_share_of_voice(uuid[], timestamptz, timestamptz, text);
drop table if exists bi_notifications, bi_notification_prefs, bi_follows, bi_scan_logs, bi_scan_runs,
  bi_story_segments, bi_story_entities cascade;
alter table if exists bi_stories drop constraint if exists bi_stories_primary_fk;
drop table if exists bi_articles, bi_stories, bi_settings, bi_query_terms, bi_feeds, bi_sources, bi_providers,
  bi_entity_aliases, bi_entities, bi_languages, bi_topics, bi_segments, bi_staff cascade;
drop function if exists bi_is_staff();
drop function if exists bi_is_admin();
drop function if exists bi_touch();
drop function if exists bi_enqueue_notifications();
drop type if exists bi_staff_role, bi_follow_kind, bi_storage_right, bi_content_type, bi_reliability,
  bi_entity_role, bi_story_status, bi_entity_type;
commit;
