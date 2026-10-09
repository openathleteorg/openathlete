/**
 * A fully populated account for the account deletion integration test:
 * user 1001 is an athlete (athlete 2001) coached by user 1002, who must
 * survive the deletion. Plain SQL with fixed ids, so the fixture follows the
 * database schema rather than the Prisma client API.
 */
export const DELETED_USER_ID = 1001;
export const DELETED_ATHLETE_ID = 2001;
export const COACH_USER_ID = 1002;
export const COACH_ATHLETE_ID = 2002;

const now = 'now()';

export const accountFixtureSql = [
  // Users and athletes
  `INSERT INTO "user" (user_id, email, password, first_name, last_name, updated_at) VALUES
    (1001, 'athlete@example.com', 'x', 'Ath', 'Lete', ${now}),
    (1002, 'coach@example.com', 'x', 'Co', 'Ach', ${now})`,
  `INSERT INTO athlete (athlete_id, user_id, updated_at) VALUES (2001, 1001, ${now}), (2002, 1002, ${now})`,
  `INSERT INTO athlete_settings (athlete_id, updated_at) VALUES (2001, ${now})`,
  `INSERT INTO athlete_metric (type, date, value, athlete_id, updated_at) VALUES ('WEIGHT', '2026-01-01', 70, 2001, ${now})`,
  `INSERT INTO athlete_availability (day_of_week, start_time, end_time, athlete_id, updated_at) VALUES (1, '07:00', '08:00', 2001, ${now})`,
  `INSERT INTO training_zone (training_zone_id, name, description, index, type, color, athlete_id, updated_at) VALUES (2201, 'Z1', 'Easy', 1, 'HEARTRATE', '#000', 2001, ${now})`,
  `INSERT INTO training_zone_value (min, max, training_zone_id, updated_at) VALUES (100, 130, 2201, ${now})`,
  `INSERT INTO equipment (equipment_id, name, type, athlete_id, updated_at) VALUES (2101, 'Shoes', 'SHOE', 2001, ${now})`,
  `INSERT INTO provider_account (provider, access_token, athlete_id, updated_at) VALUES ('GARMIN', 'token', 2001, ${now})`,
  `INSERT INTO athlete_injury (location, pain_score, context, status, athlete_id, updated_at) VALUES ('knee', 0.3, 'ctx', 'STABLE', 2001, ${now})`,

  // Coaching relationships and invitations, in both directions
  `INSERT INTO coach_athlete (user_id, athlete_id, updated_at) VALUES (1002, 2001, ${now}), (1001, 2002, ${now})`,
  `INSERT INTO coach_invitation (email, coach_user_id, athlete_user_id, updated_at) VALUES ('athlete@example.com', 1002, 1001, ${now}), ('coach@example.com', 1001, 1002, ${now})`,
  `INSERT INTO athlete_invitation (email, user_id, updated_at) VALUES ('friend@example.com', 1001, ${now})`,
  `INSERT INTO token (token, user_id, type, updated_at) VALUES ('reset', 1001, 'PASSWORD_RESET', ${now})`,
  `INSERT INTO subscription (plan, user_id, updated_at) VALUES ('SUPPORTER', 1001, ${now})`,

  // Training plan, cycle and week
  `INSERT INTO training_plan (training_plan_id, name, goal, start_date, end_date, athlete_id, updated_at) VALUES (3901, 'Plan', 'Marathon', '2026-01-01', '2026-06-01', 2001, ${now})`,
  `INSERT INTO cycle (cycle_id, name, start_date, end_date, athlete_id, training_plan_id, updated_at) VALUES (3902, 'Base', '2026-01-01', '2026-02-01', 2001, 3901, ${now})`,
  `INSERT INTO training_week (training_week_id, week_number, start_date, end_date, cycle_id, updated_at) VALUES (3903, 1, '2026-01-05', '2026-01-12', 3902, ${now})`,

  // Planned training with a structured workout exported to a watch
  `INSERT INTO event (event_id, start_date, end_date, name, type, athlete_id, training_week_id, updated_at) VALUES (3001, '2026-01-06', '2026-01-06', 'Intervals', 'TRAINING', 2001, 3903, ${now})`,
  `INSERT INTO event_training (event_training_id, event_id, sport) VALUES (3101, 3001, 'RUNNING')`,
  `INSERT INTO workout (workout_id, event_training_id, updated_at) VALUES (3201, 3101, ${now})`,
  `INSERT INTO workout_step (workout_step_id, workout_id, order_index, step_type, duration_type, updated_at) VALUES (3301, 3201, 0, 'WARMUP', 'TIME', ${now}), (3302, 3201, 1, 'REPEAT', 'OPEN', ${now})`,
  `INSERT INTO workout_repeat (workout_repeat_id, repetitions, step_id, updated_at) VALUES (3401, 5, 3302, ${now})`,
  `INSERT INTO workout_step (workout_step_id, repeat_parent_id, order_index, step_type, duration_type, updated_at) VALUES (3303, 3401, 0, 'INTERVAL_ACTIVE', 'TIME', ${now})`,
  `INSERT INTO workout_step_target (target_type, step_id, updated_at) VALUES ('HEARTRATE', 3303, ${now})`,
  `INSERT INTO provider_workout_export (athlete_id, provider, workout_id, planned_date, content_hash, updated_at) VALUES (2001, 'GARMIN', 3201, '2026-01-06', 'hash', ${now})`,

  // Completed activity and everything computed from it
  `INSERT INTO event (event_id, start_date, end_date, name, type, athlete_id, updated_at) VALUES (3002, '2026-01-06', '2026-01-06', 'Run', 'ACTIVITY', 2001, ${now})`,
  `INSERT INTO event_activity (event_activity_id, event_id, equipment_id, distance, elevation_gain, external_id, average_speed, max_speed, moving_time, sport) VALUES (3501, 3002, 2101, 10000, 100, 'garmin-1', 3, 5, 3300, 'RUNNING')`,
  `UPDATE event_training SET related_activity_id = 3501 WHERE event_training_id = 3101`,
  `INSERT INTO event_activity_normalization (event_activity_normalization_id, event_activity_id, updated_at) VALUES (3601, 3501, ${now})`,
  `INSERT INTO event_activity_normalization_factor (factor, time_seconds, percent, event_activity_normalization_id, updated_at) VALUES ('SLOPE', 10, 0.1, 3601, ${now})`,
  `INSERT INTO event_activity_weather (samples, event_activity_id, updated_at) VALUES ('[]', 3501, ${now})`,
  `INSERT INTO record (distance, date, athlete_id, event_activity_id, type, value, updated_at) VALUES (1000, '2026-01-06', 2001, 3501, 'SPEED', 4, ${now}), (5000, '2026-01-06', 2001, NULL, 'SPEED', 3.5, ${now})`,
  `INSERT INTO activity_feedback_question (question_text, event_activity_id, updated_at) VALUES ('How was it?', 3501, ${now})`,
  `INSERT INTO activity_feedback_embedding (text_content, embedding, event_activity_id, updated_at) VALUES ('felt good', array_fill(0, ARRAY[1536])::vector, 3501, ${now})`,
  `INSERT INTO activity_segment (segment_type, order_index, start_time_seconds, end_time_seconds, event_activity_id, updated_at) VALUES ('LAP', 0, 0, 300, 3501, ${now})`,
  `UPDATE athlete_injury SET source_activity_id = 3501 WHERE athlete_id = 2001`,
  `INSERT INTO training_load_calculation (training_load_calculation_id, type, athlete_id, updated_at) VALUES (3701, 'TRIMP', 2001, ${now})`,
  `INSERT INTO training_load_entry (date, value, calculation_id, activity_id, updated_at) VALUES ('2026-01-06', 80, 3701, 3501, ${now})`,

  // Competition and note
  `INSERT INTO event (event_id, start_date, end_date, name, type, athlete_id, updated_at) VALUES (3003, '2026-05-01', '2026-05-01', 'Race', 'COMPETITION', 2001, ${now}), (3004, '2026-01-07', '2026-01-07', 'Note', 'NOTE', 2001, ${now})`,
  `INSERT INTO event_competition (event_id, sport, related_activity_id) VALUES (3003, 'RUNNING', 3501)`,
  `INSERT INTO event_note (event_id) VALUES (3004)`,

  // Templates: a template is a copy of an event with no athlete
  `INSERT INTO event_template_folder (event_template_folder_id, name, user_id, updated_at) VALUES (4001, 'Folder', 1001, ${now})`,
  `INSERT INTO event (event_id, start_date, end_date, name, type, updated_at) VALUES (3005, '2026-01-06', '2026-01-06', 'Template', 'TRAINING', ${now})`,
  `INSERT INTO event_training (event_training_id, event_id, sport) VALUES (3102, 3005, 'RUNNING')`,
  `INSERT INTO workout (workout_id, event_training_id, updated_at) VALUES (3202, 3102, ${now})`,
  `INSERT INTO event_template (event_id, user_id, folder_id, updated_at) VALUES (3005, 1001, 4001, ${now})`,

  // Messages with the coach, about the activity and in a direct thread
  `INSERT INTO message_thread (message_thread_id, event_activity_id, updated_at) VALUES (3801, 3501, ${now}), (3802, NULL, ${now})`,
  `INSERT INTO message_thread_participant (message_thread_id, user_id, updated_at) VALUES (3801, 1001, ${now}), (3801, 1002, ${now}), (3802, 1001, ${now}), (3802, 1002, ${now})`,
  `INSERT INTO message (message_id, content, message_thread_id, sender_id, updated_at) VALUES (5001, 'Nice run', 3802, 1002, ${now}), (5002, 'Thanks', 3802, 1001, ${now})`,
  `INSERT INTO message_read_receipt (message_id, user_id) VALUES (5001, 1001), (5002, 1002)`,

  // The coach's notice about the activity and their alert preferences: both
  // hold the athlete's data, so they go with the account
  `INSERT INTO activity_chat_notice (coach_user_id, delivery_key, kind, event_name, rpe, event_id) VALUES (1002, 'RPE:fixture', 'RPE', 'Run', 6, 3002)`,
  `INSERT INTO coach_activity_alert_settings (coach_user_id, athlete_id) VALUES (1002, 2001)`,

  // AI provider keys and model choices (the coach keeps theirs)
  `INSERT INTO ai_credential (ai_credential_id, provider, label, encrypted_api_key, api_key_hint, user_id, updated_at) VALUES (7001, 'openai', 'OpenAI', 'v1:a:b:c', '••••1234', 1001, ${now}), (7002, 'anthropic', 'Anthropic', 'v1:a:b:c', '••••5678', 1002, ${now})`,
  `INSERT INTO ai_model_preference (task, model_id, user_id, ai_credential_id, updated_at) VALUES ('DEFAULT', 'gpt-5.1', 1001, 7001, ${now}), ('DEFAULT', 'claude-sonnet-4-5', 1002, 7002, ${now})`,

  // AI agents connected through MCP: an OAuth client both users approved,
  // and a personal token. The client and the coach's access must survive.
  `INSERT INTO oauth_client (client_id, name, redirect_uris, updated_at) VALUES ('client-1', 'Agent', '{https://agent.example/callback}', ${now})`,
  `INSERT INTO mcp_grant (mcp_grant_id, kind, name, scopes, token_hash, user_id, client_id, updated_at) VALUES (7101, 'OAUTH', 'Agent', '{read,write}', NULL, 1001, 'client-1', ${now}), (7102, 'PERSONAL_TOKEN', 'Script', '{read}', 'hash-1', 1001, NULL, ${now}), (7103, 'OAUTH', 'Agent', '{read}', NULL, 1002, 'client-1', ${now})`,
  `INSERT INTO mcp_token (token_hash, type, expires_at, grant_id) VALUES ('access-1', 'ACCESS', now(), 7101), ('access-2', 'ACCESS', now(), 7103)`,
  `INSERT INTO oauth_authorization_code (code_hash, redirect_uri, code_challenge, scopes, resource, expires_at, client_id, user_id) VALUES ('code-1', 'https://agent.example/callback', 'x', '{read}', 'https://api.example/mcp', now(), 'client-1', 1001)`,

  // AI assistant conversation
  `INSERT INTO agent_thread (thread_id, user_id, updated_at) VALUES (6001, 1001, ${now})`,
  `INSERT INTO agent_message (message_id, role, thread_id, updated_at) VALUES (6101, 'USER', 6001, ${now})`,
  `INSERT INTO agent_message_block (type, "order", content, message_id, updated_at) VALUES ('TEXT', 0, 'hi', 6101, ${now})`,
];
