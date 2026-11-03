-- Read-only access for the PostHog data warehouse (hosted instance only).
--
-- PostHog gets what AnalyticsService would send it: the rows of the users who
-- accepted analytics, enforced by row-level security on this role alone (the
-- app owns the tables, so its queries are unaffected). It never sees
-- credentials, nor the heavy data: activity streams, weather samples,
-- embeddings, records and profile bins.
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

-- A thread involves several people: it is visible only when all of them
-- consented. The owner runs this check, as the reader cannot see the others.
create schema if not exists posthog;
revoke all on schema posthog from public;
grant usage on schema posthog to posthog_reader;
create or replace function posthog.consented_threads() returns setof integer
language sql stable security definer set search_path = public as $$
  select t.message_thread_id from message_thread t
  where not exists (
    select from message_thread_participant p join "user" u using (user_id)
    where p.message_thread_id = t.message_thread_id
      and u.analytics_consent_at is null
  )
$$;
revoke all on function posthog.consented_threads() from public;
grant execute on function posthog.consented_threads() to posthog_reader;

-- Each table PostHog sees, and which of its rows. Parents are filtered by
-- their own policy, so `in (select ... from athlete)` means consented athletes.
create temp table posthog_tables (tbl text primary key, visible text not null) on commit drop;
insert into posthog_tables values
  ('user', 'analytics_consent_at is not null'),
  ('athlete', 'user_id in (select user_id from "user")'),
  ('agent_thread', 'user_id in (select user_id from "user")'),
  ('ai_credential', 'user_id in (select user_id from "user")'),
  ('ai_model_preference', 'user_id in (select user_id from "user")'),
  ('ai_usage', 'user_id in (select user_id from "user")'),
  ('athlete_invitation', 'user_id in (select user_id from "user")'),
  ('event_template', 'user_id in (select user_id from "user")'),
  ('event_template_folder', 'user_id in (select user_id from "user")'),
  ('mcp_grant', 'user_id in (select user_id from "user")'),
  ('subscription', 'user_id in (select user_id from "user")'),
  ('coach_athlete', 'user_id in (select user_id from "user") and athlete_id in (select athlete_id from athlete)'),
  ('coach_invitation', 'coach_user_id in (select user_id from "user") and athlete_user_id in (select user_id from "user")'),
  ('coach_activity_alert_settings', 'coach_user_id in (select user_id from "user") and athlete_id in (select athlete_id from athlete)'),
  ('athlete_availability', 'athlete_id in (select athlete_id from athlete)'),
  ('athlete_injury', 'athlete_id in (select athlete_id from athlete)'),
  ('athlete_metric', 'athlete_id in (select athlete_id from athlete)'),
  ('athlete_settings', 'athlete_id in (select athlete_id from athlete)'),
  ('cycle', 'athlete_id in (select athlete_id from athlete)'),
  ('equipment', 'athlete_id in (select athlete_id from athlete)'),
  ('event', 'athlete_id in (select athlete_id from athlete)'),
  ('provider_account', 'athlete_id in (select athlete_id from athlete)'),
  ('provider_workout_export', 'athlete_id in (select athlete_id from athlete)'),
  ('training_load_calculation', 'athlete_id in (select athlete_id from athlete)'),
  ('training_plan', 'athlete_id in (select athlete_id from athlete)'),
  ('training_zone', 'athlete_id in (select athlete_id from athlete)'),
  ('training_zone_value', 'training_zone_id in (select training_zone_id from training_zone)'),
  ('training_load_entry', 'calculation_id in (select training_load_calculation_id from training_load_calculation)'),
  ('training_week', 'cycle_id in (select cycle_id from cycle)'),
  ('event_activity', 'event_id in (select event_id from event)'),
  ('event_competition', 'event_id in (select event_id from event)'),
  ('event_note', 'event_id in (select event_id from event)'),
  ('event_training', 'event_id in (select event_id from event)'),
  ('activity_chat_notice', 'event_id in (select event_id from event) and coach_user_id in (select user_id from "user")'),
  ('activity_feedback_embedding', 'event_activity_id in (select event_activity_id from event_activity)'),
  ('activity_feedback_question', 'event_activity_id in (select event_activity_id from event_activity)'),
  ('activity_segment', 'event_activity_id in (select event_activity_id from event_activity)'),
  ('event_activity_normalization', 'event_activity_id in (select event_activity_id from event_activity)'),
  ('event_activity_weather', 'event_activity_id in (select event_activity_id from event_activity)'),
  ('record_exclusion', 'event_activity_id in (select event_activity_id from event_activity)'),
  ('event_activity_normalization_factor', 'event_activity_normalization_id in (select event_activity_normalization_id from event_activity_normalization)'),
  ('workout', 'event_training_id in (select event_training_id from event_training)'),
  ('workout_step', 'workout_id in (select workout_id from workout)'),
  ('workout_repeat', 'step_id in (select workout_step_id from workout_step)'),
  ('workout_step_target', 'step_id in (select workout_step_id from workout_step)'),
  ('agent_message', 'thread_id in (select thread_id from agent_thread)'),
  ('agent_message_block', 'message_id in (select message_id from agent_message)'),
  ('message_thread', 'message_thread_id in (select posthog.consented_threads())'),
  ('message_thread_participant', 'message_thread_id in (select message_thread_id from message_thread)'),
  ('message', 'message_thread_id in (select message_thread_id from message_thread)'),
  ('message_read_receipt', 'message_id in (select message_id from message)');

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

-- Fails here if a listed table no longer exists.
select format('alter table public.%I enable row level security', tbl) from posthog_tables \gexec
select format('drop policy if exists posthog_reader on public.%I', tbl) from posthog_tables \gexec
select format('create policy posthog_reader on public.%I for select to posthog_reader using (%s)', tbl, visible)
from posthog_tables \gexec

commit;
