-- ============================================================
-- Supabase User & Session Lookup
-- Email: tuyishimirehonore3@gmail.com
-- 
-- Run this in your Supabase SQL Editor (SQL Editor → New Query)
-- NOTE: auth.users.id is VARCHAR (text), while other tables use UUID.
--       Using ::text casts to fix type mismatches.
-- ============================================================

-- 1. Check app's admin/users table
SELECT id, name, email, role, created_at, updated_at
FROM users
WHERE email = 'tuyishimirehonore3@gmail.com';

-- 2. Check student profiles table
SELECT id, name, email, nationality, education_level, profile_complete, created_at
FROM student_profiles
WHERE email = 'tuyishimirehonore3@gmail.com';

-- 3. Check Supabase's built-in auth.users
SELECT id, email, created_at, last_sign_in_at, confirmed_at, email_confirmed_at
FROM auth.users
WHERE email = 'tuyishimirehonore3@gmail.com';

-- 4. Check active Supabase auth sessions
SELECT 
  u.email,
  s.id AS session_id,
  s.created_at,
  s.updated_at,
  s.not_after,
  s.user_agent,
  s.ip
FROM auth.users u
JOIN auth.sessions s ON s.user_id::text = u.id::text
WHERE u.email = 'tuyishimirehonore3@gmail.com'
ORDER BY s.created_at DESC;

-- 5. Check Supabase refresh tokens (active = not revoked)
SELECT 
  u.email,
  rt.id AS refresh_token_id,
  rt.created_at,
  rt.updated_at,
  rt.revoked,
  rt.parent
FROM auth.users u
JOIN auth.refresh_tokens rt ON rt.user_id::text = u.id::text
WHERE u.email = 'tuyishimirehonore3@gmail.com'
ORDER BY rt.created_at DESC;

-- 6. Check identity providers linked
SELECT 
  u.email,
  i.provider,
  i.identity_data->>'email' AS identity_email,
  i.created_at,
  i.last_sign_in_at
FROM auth.users u
JOIN auth.identities i ON i.user_id::text = u.id::text
WHERE u.email = 'tuyishimirehonore3@gmail.com';

-- 7. Check MFA factors if any
SELECT 
  u.email,
  f.id AS factor_id,
  f.factor_type,
  f.status,
  f.created_at,
  f.last_challenged_at
FROM auth.users u
JOIN auth.mfa_factors f ON f.user_id::text = u.id::text
WHERE u.email = 'tuyishimirehonore3@gmail.com';

-- 8. User found! ID = a7db68a4-7c32-4d85-b152-b0328b2beaf3
-- Now check for Supabase auth sessions using that ID:
--
-- UNCOMMENT AND RUN THE QUERIES BELOW:

-- Check Supabase auth sessions (JWT sessions)
-- SELECT * FROM auth.sessions 
-- WHERE user_id::text = 'a7db68a4-7c32-4d85-b152-b0328b2beaf3'
-- ORDER BY created_at DESC;

-- Check Supabase refresh tokens
-- SELECT * FROM auth.refresh_tokens 
-- WHERE user_id::text = 'a7db68a4-7c32-4d85-b152-b0328b2beaf3'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- Check identities linked to this user
-- SELECT * FROM auth.identities
-- WHERE user_id::text = 'a7db68a4-7c32-4d85-b152-b0328b2beaf3';

-- Quick summary of auth data for this user
SELECT 
  'a7db68a4-7c32-4d85-b152-b0328b2beaf3' AS user_id,
  (SELECT count(*) FROM auth.sessions WHERE user_id::text = 'a7db68a4-7c32-4d85-b152-b0328b2beaf3') AS active_sessions,
  (SELECT count(*) FROM auth.refresh_tokens WHERE user_id::text = 'a7db68a4-7c32-4d85-b152-b0328b2beaf3' AND revoked IS FALSE) AS active_refresh_tokens,
  (SELECT count(*) FROM auth.identities WHERE user_id::text = 'a7db68a4-7c32-4d85-b152-b0328b2beaf3') AS linked_providers;

-- ============================================================
-- LOGIN DIAGNOSTIC: Check the password hash format
-- Run this to see if the hash looks valid
-- ============================================================
SELECT 
  id,
  email,
  name,
  role,
  password_hash,
  LENGTH(password_hash) AS hash_length,
  CASE 
    WHEN password_hash LIKE '%:%' THEN 'Has salt:hash format (looks valid)'
    ELSE 'MISSING colon separator (INVALID — needs reset)'
  END AS hash_status
FROM users
WHERE email = 'tuyishimirehonore3@gmail.com';

-- ============================================================
-- PASSWORD RESET (Only run if you need to reset the password)
-- ============================================================
-- 
-- Step 1: Run a Node.js script to generate a proper hash
-- Create and run a file `reset_password.mjs` with this content:
--
-- import crypto from "crypto";
-- const password = "YourNewPassword123";
-- const salt = crypto.randomBytes(16).toString("hex");
-- const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
-- console.log(`${salt}:${hash}`);
--
-- Step 2: Copy the output and run:
-- UPDATE users 
-- SET password_hash = 'paste_the_hash_here' 
-- WHERE email = 'tuyishimirehonore3@gmail.com';
--

