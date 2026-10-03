# SKILLBATTLE AI — DEMO ACCOUNT HANDOVER

This document is for development/demo use only. It is intentionally not committed with production secrets and it should be stored in a secure private location if real staging credentials are later created.

## Application

- URL: not yet deployed in this workspace
- Backend API: not yet deployed in this workspace
- Verification dashboard: not yet deployed in this workspace

## Demo accounts

The repository does not yet contain a live staging environment or a created demo auth dataset. No real credentials should be committed here until a live environment exists.

### Platform Admin
- Email: admin.demo@skillbattle.local
- Role: PLATFORM_ADMIN
- Status: ACTIVE
- Credential storage: generate in secure environment manager or staging secret store

### College Admin
- Email: college.admin.demo@skillbattle.local
- Role: COLLEGE_ADMIN
- Organization: SkillBattle Demo College
- Status: ACTIVE
- Credential storage: generate in secure environment manager or staging secret store

### Company Admin
- Email: company.admin.demo@skillbattle.local
- Role: COMPANY_ADMIN
- Organization: SkillBattle Demo Company
- Status: ACTIVE
- Credential storage: generate in secure environment manager or staging secret store

### Student
- Email: student.demo@skillbattle.local
- Role: STUDENT
- Status: ACTIVE
- Credential storage: generate in secure environment manager or staging secret store

## Notes

- Do not commit real passwords or secrets into the repository.
- Demo staging credentials should be created through the actual auth system and stored in the secure deployment environment.
- The verification dashboard should be used by an admin user to execute the live checks once a staging deployment exists.
- The demo accounts must exist in the real database and go through the real login flow.

## Safe future process

1. Deploy a real staging environment.
2. Create the demo accounts in the real database through the application auth flow.
3. Store generated passwords in a secret manager or private docs file outside Git.
4. Share only the secure credential location with the project owner.
5. Use the admin verification dashboard to confirm each major flow.
