
## Phase 2: Study Groups

### Database Tables
1. **groups** — id, name, description, created_by, group_code (unique 6-char), is_public (boolean), created_at
2. **group_members** — id, group_id, user_id, role (creator/admin/member), joined_at
3. **notifications** — id, user_id, type (invite/join_request/study_session/request_accepted/request_rejected), from_user_id, group_id, message, is_read, created_at
4. **group_study_sessions** — id, group_id, started_by, mode (pomodoro/target-study), subject, is_active, started_at

### Features
1. **Create Group** — Name, description, public/private toggle, auto-generated group code
2. **My Groups** — List groups user belongs to, with member count
3. **Search Groups** — Search public groups by name, send join request
4. **Invite by Username** — Send invite notification to any user
5. **Notifications Tab** — Bell icon on home page showing invites, join requests, session alerts
6. **Group Detail Page** — See members, their study time, who's studying now
7. **Start Group Study** — Pick Pomodoro or Target mode, notifies all members, each studies independently with own breaks
8. **Join Requests** — Creator approves/rejects for private groups

### UI Components
- `GroupsHome.tsx` — My groups list + create/search buttons
- `CreateGroup.tsx` — Group creation form
- `GroupDetail.tsx` — Group members, stats, start session
- `SearchGroups.tsx` — Search & join groups
- `Notifications.tsx` — Bell icon + notification list
- `GroupStudySession.tsx` — Active group study view

### Advanced Additions
- Group leaderboard (rank members by study time)
- Group activity feed
- Group code sharing for easy invite
