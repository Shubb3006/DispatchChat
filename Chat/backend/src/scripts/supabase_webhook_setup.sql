-- ====================================================================
-- SUPABASE DATABASE WEBHOOK VIA STANDARD 'http' EXTENSION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Enable standard http extension (supported on all Supabase databases)
CREATE EXTENSION IF NOT EXISTS "http";

-- 2. Create the trigger function using http_post
CREATE OR REPLACE FUNCTION notify_chat_app_on_load()
RETURNS trigger AS $$
DECLARE
  response http_response;
BEGIN
  BEGIN
    -- Sends POST request with inserted load record to your backend Chat API endpoint
    -- Replace with your public backend server URL (e.g. ngrok URL like https://xxxx.ngrok-free.app/api/load/webhook)
    response := http_post(
      'http://localhost:5500/api/load/webhook',
      json_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW)
      )::text,
      'application/json'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Prevent webhook network failures from aborting the load creation transaction
    RAISE WARNING 'Chat app webhook call failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to loads table
DROP TRIGGER IF EXISTS trigger_notify_chat_app_load ON loads;

CREATE TRIGGER trigger_notify_chat_app_load
AFTER INSERT ON loads
FOR EACH ROW EXECUTE FUNCTION notify_chat_app_on_load();
