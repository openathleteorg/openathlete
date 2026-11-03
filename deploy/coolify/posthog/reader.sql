-- Read-only access for the PostHog data warehouse (hosted instance only).
--
-- PostHog sees every user's rows in the tables listed below, but never
-- credentials, other people's emails, nor the heavy data: activity streams,
-- weather samples, embeddings, records and profile bins.
--
-- Apply as the database owner, and again after a migration that adds a table
-- (new tables stay hidden until listed below):
--   psql -v reader_password='...' -f reader.sql
-- Idempotent.

\set ON_ERROR_STOP on
begin;

select format('create role posthog_reader login password %L', :'reader_password')
where not exists (select from pg_roles where rolname = 'posthog_reader') \gexec
alter role posthog_reader password :'reader_password';
alter role posthog_reader connection limit 4;
alter role posthog_reader set default_transaction_read_only = on;
alter role posthog_reader set statement_timeout = '15min';
-- The hosted database does not grant it to PUBLIC.
grant usage on schema public to posthog_reader;

-- Until November 2026 the role saw only the users who accepted analytics,
-- through row-level security: remove it where it was set up.
select format('drop policy posthog_reader on %I.%I', schemaname, tablename)
from pg_policies where policyname = 'posthog_reader' \gexec
select format('alter table public.%I disable row level security', c.relname)
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relrowsecurity
  and not exists (select from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) \gexec
drop schema if exists posthog cascade;

create temp table posthog_tables (tbl text primary key) on commit drop;
insert into posthog_tables values
  ('user'), ('athlete'), ('athlete_availability'), ('athlete_injury'),
  ('athlete_invitation'), ('athlete_metric'), ('athlete_settings'),
  ('agent_thread'), ('agent_message'), ('agent_message_block'),
  ('ai_credential'), ('ai_model_preference'), ('ai_usage'),
  ('coach_athlete'), ('coach_invitation'), ('coach_activity_alert_settings'),
  ('cycle'), ('equipment'), ('mcp_grant'), ('subscription'),
  ('event'), ('event_activity'), ('event_competition'), ('event_note'),
  ('event_training'), ('event_template'), ('event_template_folder'),
  ('activity_chat_notice'), ('activity_feedback_embedding'),
  ('activity_feedback_question'), ('activity_segment'),
  ('event_activity_normalization'), ('event_activity_normalization_factor'),
  ('event_activity_weather'), ('record_exclusion'),
  ('provider_account'), ('provider_workout_export'),
  ('training_load_calculation'), ('training_load_entry'), ('training_plan'),
  ('training_week'), ('training_zone'), ('training_zone_value'),
  ('workout'), ('workout_repeat'), ('workout_step'), ('workout_step_target'),
  ('message_thread'), ('message_thread_participant'), ('message'),
  ('message_read_receipt');

-- Credentials, other people's emails, and heavy columns.
create temp table posthog_hidden (tbl text, col text, primary key (tbl, col)) on commit drop;
insert into posthog_hidden values
  ('user', 'password'),
  ('user', 'push_token'),
  ('athlete', 'calendar_feed_token'),
  ('ai_credential', 'encrypted_api_key'),
  ('provider_account', 'access_token'),
  ('provider_account', 'refresh_token'),
  ('mcp_grant', 'token_hash'),
  ('athlete_invitation', 'token'),
  ('athlete_invitation', 'email'),
  ('coach_invitation', 'token'),
  ('coach_invitation', 'email'),
  ('event_activity', 'stream'),
  ('event_activity', 'original_stream'),
  ('event_activity_weather', 'samples'),
  ('activity_feedback_embedding', 'embedding');

-- Start from nothing, so a table or column dropped from the lists loses access.
revoke all on all tables in schema public from posthog_reader;

-- Fails here if a listed table no longer exists.
select format('select from public.%I limit 0', tbl) from posthog_tables \gexec

-- Whole tables where nothing is hidden: PostHog's xmin sync reads a system
-- column, which column grants cannot cover. Their new columns become visible,
-- so a credential added to one of them must go in posthog_hidden.
select format('grant select on public.%I to posthog_reader', t.tbl)
from posthog_tables t
where not exists (select from posthog_hidden h where h.tbl = t.tbl) \gexec

select format('grant select (%s) on public.%I to posthog_reader',
              string_agg(quote_ident(c.column_name), ', ' order by c.ordinal_position), t.tbl)
from posthog_tables t
join information_schema.columns c on c.table_schema = 'public' and c.table_name = t.tbl
where exists (select from posthog_hidden h where h.tbl = t.tbl)
  and not exists (select from posthog_hidden h where h.tbl = t.tbl and h.col = c.column_name)
group by t.tbl \gexec

commit;
