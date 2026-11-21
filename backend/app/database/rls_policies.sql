-- ============================================================================
-- Qubira / SkillBattle — PostgreSQL Row-Level Security (RLS) Policies
-- Control 11: Multi-Tenant Data Isolation & Defense-in-Depth RLS
--
-- TARGET: PostgreSQL 14+ (Neon PostgreSQL)
-- STATUS: MIGRATION-READY (Do NOT execute directly against live DB until
--         migration activation gate is officially opened).
-- ============================================================================

-- Ensure the session variable exists for application-level user context
-- In application middleware: SET LOCAL app.current_user_id = '<uuid_or_id>';
-- In application middleware: SET LOCAL app.current_user_role = '<role>';

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own complete record; allow superuser/admins to view all
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (
        id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
        OR current_setting('app.is_superuser', true) = 'true'
    );

-- Allow users to modify only their own record
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (
        id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    )
    WITH CHECK (
        id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    );

-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT
    USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    );

CREATE POLICY profiles_update_policy ON profiles
    FOR UPDATE
    USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    )
    WITH CHECK (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    );

-- ----------------------------------------------------------------------------
-- 3. RESUMES TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY resumes_isolation_policy ON resumes
    FOR ALL
    USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN', 'RECRUITER')
        OR current_setting('app.is_superuser', true) = 'true'
    )
    WITH CHECK (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    );

-- ----------------------------------------------------------------------------
-- 4. SUBMISSIONS & BATTLE RESULTS
-- ----------------------------------------------------------------------------
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_submissions_policy ON user_submissions
    FOR ALL
    USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    )
    WITH CHECK (
        user_id::text = current_setting('app.current_user_id', true)
    );

-- ----------------------------------------------------------------------------
-- 5. COLLEGE STUDENTS (Institutional Multi-Tenancy)
-- ----------------------------------------------------------------------------
ALTER TABLE college_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY college_students_isolation ON college_students
    FOR ALL
    USING (
        college_id::text = current_setting('app.current_college_id', true)
        OR user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    )
    WITH CHECK (
        college_id::text = current_setting('app.current_college_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    );

-- ----------------------------------------------------------------------------
-- 6. COMPANY MEMBERS (Enterprise Multi-Tenancy)
-- ----------------------------------------------------------------------------
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_members_isolation ON company_members
    FOR ALL
    USING (
        company_id::text = current_setting('app.current_company_id', true)
        OR user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    )
    WITH CHECK (
        company_id::text = current_setting('app.current_company_id', true)
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'PLATFORM_ADMIN')
    );

-- ============================================================================
-- BYPASS ROLES & SERVICE ACCOUNTS
-- ============================================================================
-- Migrations, background cron workers, and replication users should have BYPASSRLS
-- Example:
-- ALTER ROLE qubira_migration_user BYPASSRLS;
-- ALTER ROLE neon_superuser BYPASSRLS;
