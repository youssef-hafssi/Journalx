# Journal Entry Cascade Deletion

## Overview

When a trade is deleted from the trades section, all associated journal entries are automatically deleted as well. This ensures data consistency and prevents orphaned journal entries.

## Implementation

The cascade deletion is implemented at two levels:

### 1. Application Level (Primary)
- **File**: `src/lib/trades.ts` - `deleteTrade()` function
- **Logic**: Before deleting a trade, the function:
  1. Finds all journal entries linked to the trade (`trade_id` matches)
  2. Deletes those journal entries first
  3. Then deletes the trade itself
- **Benefits**: 
  - Works regardless of database constraint setup
  - Provides detailed logging
  - Can show specific feedback to users

### 2. Database Level (Backup)
- **Files**: 
  - `deploy-database.sql` - Main deployment script
  - `supabase-schema-safe.sql` - Safe update script  
  - `cascade-journal-deletion.sql` - Specific constraint update
- **Logic**: Foreign key constraint changed from `ON DELETE SET NULL` to `ON DELETE CASCADE`
- **Benefits**:
  - Automatic deletion at database level
  - Prevents orphaned entries even if application logic fails
  - More efficient for bulk operations

## Database Schema

```sql
-- Old constraint (sets trade_id to NULL when trade is deleted)
trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL

-- New constraint (deletes journal entry when trade is deleted)  
trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE
```

## User Experience

- When a user deletes a trade, they see: "Trade and linked journal entries deleted successfully!"
- Console logs show detailed information about the deletion process
- Journal entries linked to the deleted trade will no longer appear in the journal page

## Testing

To test the cascade deletion:

1. Create a trade
2. Create a journal entry linked to that trade
3. Delete the trade from the trades section
4. Verify the journal entry is also deleted from the journal page

## Files Modified

- `src/lib/trades.ts` - Enhanced `deleteTrade()` function
- `src/hooks/use-trades.ts` - Updated success message
- `src/pages/AllTrades.tsx` - Enhanced deletion logging
- `deploy-database.sql` - Updated schema with CASCADE
- `supabase-schema-safe.sql` - Updated schema with CASCADE
- `cascade-journal-deletion.sql` - Constraint migration script
