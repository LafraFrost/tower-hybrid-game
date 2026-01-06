# Supabase Realtime Setup Guide

## Overview
This document guides you through setting up Supabase Realtime Channels for multiplayer tabletop sessions.

## Prerequisites
- Supabase account
- Project created on supabase.com

## Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `SUPABASE_MIGRATION.sql`
5. Click **Run** to execute the migration
6. Verify the `game_sessions` table appears in **Table Editor**

### Expected Schema
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'lobby' NOT NULL,
  host_id UUID NOT NULL,
  players JSONB DEFAULT '[]'::jsonb,
  current_floor INTEGER DEFAULT 0,
  node_counter INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Step 2: Configure Environment Variables

Add these variables to your `.env` file (or Vite environment):

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Finding Your Keys
1. Go to **Project Settings** → **API**
2. Copy **Project URL** → `VITE_SUPABASE_URL`
3. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

## Step 3: Enable Realtime (Optional but Recommended)

1. Navigate to **Database** → **Replication**
2. Find the `game_sessions` table
3. Toggle **Enable Realtime** to ON
4. Save changes

This ensures postgres_changes events are published instantly.

## Step 4: Test Authentication

The app currently expects Supabase Auth to be configured. If you haven't set up authentication:

### Option A: Anonymous Sign-in (Development)
Add this to your `supabaseClient.ts`:
```typescript
// Auto sign-in anonymously for development
const signInAnon = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    await supabase.auth.signInAnonymously();
  }
};
signInAnon();
```

### Option B: Email/Password Auth (Production)
1. Enable **Email** provider in **Authentication** → **Providers**
2. Implement sign-up/sign-in UI in your app
3. Users must be authenticated before hosting/joining rooms

## Step 5: Test the Flow

### Host Flow
1. Navigate to `/tabletop`
2. Click **CREA STANZA**
3. Verify:
   - QR code appears
   - Room code is generated
   - Player list shows host hero
4. Click **INIZIA PARTITA**
5. All clients should navigate to `/dungeon`

### Client Flow
1. Navigate to `/tabletop?join=ROOMCODE`
2. Enter the room code
3. Click **UNISCITI ALLA STANZA**
4. Verify:
   - Status changes to "Connesso!"
   - Room code displays
5. Wait for host to start game
6. Should auto-navigate to `/dungeon`

## Architecture Overview

### Database Layer
- **Table**: `game_sessions` (defined in `shared/schema.ts`)
- **Storage**: `server/storage.ts` implements CRUD operations
- **Types**: `GameSession`, `InsertGameSession`

### Frontend Layer
- **Client**: `client/src/lib/supabaseClient.ts` (Supabase JS client)
- **Page**: `client/src/pages/TabletopSession.tsx` (room host/join UI)
- **Hook**: `client/src/hooks/useGameRoom.ts` (custom Realtime hook, optional)

### Realtime Flow
1. Host creates room → Insert row in `game_sessions`
2. Host and clients subscribe to `postgres_changes` for that `room_code`
3. When player joins → Update `players` JSONB array
4. When host clicks "INIZIA PARTITA" → Update `status` to 'tactical'
5. All subscribed clients receive event → Navigate to `/dungeon`

## Troubleshooting

### "Non autenticato" Error
- Ensure Supabase Auth is enabled
- User must be signed in (anonymous or email/password)
- Check browser console for `supabase.auth.getUser()` errors

### QR Code Not Generating
- Verify `qrcode` npm package is installed: `npm install qrcode`
- Check browser console for QRCode errors
- Ensure `window.location.origin` is correct

### Realtime Updates Not Working
1. Verify Realtime is enabled for `game_sessions` table
2. Check Supabase logs: **Logs** → **Realtime Logs**
3. Ensure `filter` parameter matches: `room_code=eq.ROOMCODE`
4. Check browser console for subscription status

### Players Array Not Updating
- Verify `players` column is JSONB (not JSON)
- Check `DEFAULT '[]'::jsonb` is set in table schema
- Use `JSON.stringify()` if debugging payload

## Security Considerations (Production)

### Row Level Security (RLS)
The migration includes commented RLS policies. To enable:
```sql
-- Allow users to read any game session
CREATE POLICY "Allow read game_sessions" ON game_sessions
  FOR SELECT USING (true);

-- Allow users to create game sessions
CREATE POLICY "Allow create game_sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Allow host to update their game session
CREATE POLICY "Allow host update game_sessions" ON game_sessions
  FOR UPDATE USING (auth.uid() = host_id);
```

### API Key Protection
- Never commit `.env` files
- Use environment variables in production (Vercel/Netlify/etc.)
- Rotate keys if accidentally exposed

## Next Steps

1. ✅ Deploy schema (run migration)
2. ✅ Configure environment variables
3. ✅ Test host flow locally
4. ✅ Test client flow (scan QR or manual code entry)
5. ⏳ Deploy to production
6. ⏳ Enable RLS policies (optional)
7. ⏳ Add Supabase Presence for player activity indicators (optional)

## Files Modified/Created

### Backend
- `shared/schema.ts` - Added `gameSessions` table definition
- `server/storage.ts` - Added GameSession CRUD methods
- `SUPABASE_MIGRATION.sql` - Database setup SQL

### Frontend
- `client/src/lib/supabaseClient.ts` - Supabase client initialization
- `client/src/hooks/useGameRoom.ts` - Custom Realtime hook (optional)
- `client/src/pages/TabletopSession.tsx` - Complete rewrite for Supabase
- `client/src/pages/ModeMenu.tsx` - New Solo/Tavolo branching menu

### Configuration
- `.env` - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs/guides/realtime
2. Review browser console for errors
3. Check Supabase project logs
4. Verify table schema matches migration SQL
