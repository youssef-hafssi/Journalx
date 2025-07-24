# Google OAuth Flow Fix - Sign-in vs Sign-up Distinction

## Problem Solved

Previously, the Google OAuth implementation had a critical issue:
- Both "Sign in with Google" and "Sign up with Google" buttons performed the same action
- Users who clicked "Sign in with Google" without having an account would automatically get an account created
- This bypassed the intended user registration flow where users should explicitly choose to sign up

## Solution Overview

We've implemented a sophisticated flow that distinguishes between Google sign-in and Google sign-up:

### 1. Separate OAuth Functions
- `signInWithGoogle()` - For existing users who want to sign in
- `signUpWithGoogle()` - For new users who want to create an account

### 2. Intent Tracking
- Uses `sessionStorage` to track whether the user intended to sign in or sign up
- This survives the OAuth redirect flow and allows us to handle the user appropriately

### 3. User Validation
- For Google sign-in attempts: Checks if a profile exists in the database
- If no profile exists and user tried to sign in: Shows error and signs them out
- If no profile exists and user tried to sign up: Creates the profile normally

## Technical Implementation

### AuthContext Changes

#### New Interface
```typescript
interface AuthContextType {
  // ... existing methods
  signInWithGoogle: () => Promise<void>;    // For existing users
  signUpWithGoogle: () => Promise<void>;    // For new users
}
```

#### Intent Tracking
```typescript
const setGoogleOAuthAction = (action: 'signin' | 'signup') => {
  sessionStorage.setItem('google_oauth_action', action);
};

const getGoogleOAuthAction = (): 'signin' | 'signup' | null => {
  return sessionStorage.getItem('google_oauth_action') as 'signin' | 'signup' | null;
};
```

#### Enhanced Profile Creation Logic
```typescript
const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
  // ... existing profile fetch logic
  
  const isGoogleUser = supabaseUser.app_metadata?.provider === 'google';
  const intendedAction = getGoogleOAuthAction();
  
  if (!profile) {
    if (isGoogleUser && intendedAction === 'signin') {
      // User tried to sign in but doesn't have an account
      clearGoogleOAuthAction();
      await supabase.auth.signOut();
      toast.error('No account found with this Google email. Please sign up first.');
      return null;
    }
    
    // Create profile for sign-up attempts or non-Google users
    // ... profile creation logic
  }
  
  // ... rest of function
};
```

### AuthPage Changes

#### Separate Button Handlers
```typescript
const handleGoogleSignIn = async () => {
  await signInWithGoogle();  // Uses signin intent
};

const handleGoogleSignUp = async () => {
  await signUpWithGoogle();  // Uses signup intent
};
```

#### Button Implementation
- **Login Tab**: Uses `handleGoogleSignIn` → "Sign in with Google"
- **Signup Tab**: Uses `handleGoogleSignUp` → "Sign up with Google"

### Database Schema Updates

#### Profiles Table
Added `provider` column to track authentication method:
```sql
CREATE TABLE public.profiles (
    -- ... existing columns
    provider TEXT DEFAULT 'email',
    -- ... rest of table
);
```

#### Enhanced Trigger Function
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, provider)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.app_metadata->>'provider', 'email')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## User Experience Flow

### Scenario 1: New User Signs Up with Google
1. User clicks "Sign up with Google" in signup tab
2. Intent set to 'signup' in sessionStorage
3. Google OAuth flow completes
4. No profile exists → Profile created successfully
5. User logged in with success message: "Account created successfully with Google!"

### Scenario 2: Existing User Signs In with Google
1. User clicks "Sign in with Google" in login tab
2. Intent set to 'signin' in sessionStorage
3. Google OAuth flow completes
4. Profile exists → User logged in successfully
5. Success message: "Welcome back!"

### Scenario 3: New User Tries to Sign In with Google (THE FIX)
1. User clicks "Sign in with Google" in login tab
2. Intent set to 'signin' in sessionStorage
3. Google OAuth flow completes
4. No profile exists → User signed out automatically
5. Error message: "No account found with this Google email. Please sign up first."

## Security Benefits

1. **Explicit User Consent**: Users must explicitly choose to create an account
2. **No Accidental Registrations**: Prevents unwanted account creation
3. **Clear User Intent**: System respects user's intended action
4. **Data Integrity**: Only users who want accounts get accounts

## Files Modified

1. `src/contexts/AuthContext-supabase.tsx` - Added separate OAuth functions and intent tracking
2. `src/pages/AuthPage.tsx` - Updated to use separate handlers for sign-in vs sign-up
3. `supabase-schema.sql` - Added provider column and enhanced trigger function

## Next Steps

1. **Deploy Database Schema**: Run the updated `supabase-schema.sql` in Supabase SQL Editor
2. **Configure Google OAuth**: Complete the OAuth provider setup in Supabase Dashboard
3. **Test Both Flows**: Verify both sign-in and sign-up work correctly
4. **User Testing**: Test with real users to ensure the flow is intuitive

## Testing Checklist

- [ ] New user can sign up with Google successfully
- [ ] Existing user can sign in with Google successfully  
- [ ] New user trying to sign in with Google gets proper error message
- [ ] Regular email/password authentication still works
- [ ] Error messages are user-friendly
- [ ] OAuth redirect works correctly
- [ ] Profile data is properly populated from Google
