-- Single statement: paste all, click Run.
DO $schema$
BEGIN
  BEGIN
    CREATE TYPE public.pricing_plan AS ENUM('free','essentials','pro','group');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE TYPE public.subscription_status AS ENUM('trialing','active','canceled','incomplete','incomplete_expired','past_due','unpaid','paused');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE TYPE public.venue_status AS ENUM('draft','active','archived');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  CREATE TABLE IF NOT EXISTS public.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), auth_id text NOT NULL UNIQUE, email text NOT NULL UNIQUE, full_name text, avatar_url text, stripe_customer_id text UNIQUE, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
  CREATE TABLE IF NOT EXISTS public.venues (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, name text NOT NULL, description text, address text, city text, state text, postcode text, country text DEFAULT 'AU' NOT NULL, status public.venue_status DEFAULT 'draft' NOT NULL, metadata jsonb, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
  CREATE TABLE IF NOT EXISTS public.subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, stripe_subscription_id text NOT NULL UNIQUE, stripe_customer_id text NOT NULL, stripe_price_id text NOT NULL, plan public.pricing_plan DEFAULT 'free' NOT NULL, status public.subscription_status DEFAULT 'trialing' NOT NULL, current_period_start timestamptz, current_period_end timestamptz, cancel_at_period_end boolean DEFAULT false NOT NULL, metadata jsonb, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
  CREATE TABLE IF NOT EXISTS public.design_projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, name text NOT NULL, description text, ai_prompt text, ai_result jsonb, generation_count integer DEFAULT 0 NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
  BEGIN
    CREATE TYPE public.venue_type AS ENUM('restaurant','cafe','bar','pub','hotel_fb','large_format');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS venue_type public.venue_type;
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS staff_count integer;
  BEGIN
    CREATE TYPE public.domain AS ENUM('throughput','defaults','signals','pacing','endings','people_load','operational_memory');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  CREATE TABLE IF NOT EXISTS public.checkins (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, responses jsonb NOT NULL, calm_index real NOT NULL, created_at timestamptz DEFAULT now() NOT NULL);
  CREATE TABLE IF NOT EXISTS public.domain_scores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE, domain public.domain NOT NULL, score real NOT NULL, checkin_count integer DEFAULT 1 NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
END $schema$;
