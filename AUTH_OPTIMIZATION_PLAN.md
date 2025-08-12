# 🚨 CRITICAL: Auth Request Optimization Plan

## Current Problem: 13,000+ auth requests per hour

## Root Causes Identified:

### 1. **Direct `auth.getUser()` calls everywhere** (Major Issue)
- Every component calls `supabase.auth.getUser()` directly
- Should use `AuthProvider` context instead
- Found in: ChatRoom, ChatNotificationBell, NotificationBell, PropertyView, SearchComponent, Dashboard, etc.

### 2. **Redundant auth checks in API functions** (Major Issue)
- Every API function in `utils/supabase/api.ts` calls `getUser()`
- Functions like `getUserApplications`, `getUserLikedListings`, etc.
- Should pass user from context instead

### 3. **Frequent re-renders triggering auth checks** (Medium Issue)
- Components re-render and trigger new auth requests
- Need better memoization and dependency management

### 4. **Server-side auth checks** (Medium Issue)
- Every page component calls `createClient().auth.getUser()`
- Should be optimized with proper caching

## IMMEDIATE FIXES NEEDED:

### Phase 1: Use AuthProvider Context (Reduces ~80% of requests)

**Replace all instances of:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

**With:**
```typescript
const { user } = useAuth() // from AuthProvider context
```

**Files to fix:**
- ✅ `components/ChatRoom.tsx` - FIXED
- ✅ `components/ChatNotificationBell.tsx` - PARTIALLY FIXED
- ⚠️ `components/NotificationBell.tsx` - NEEDS FIXING
- ⚠️ `components/search/searchComponent.tsx` - NEEDS FIXING
- ⚠️ `components/search/propertyView.tsx` - NEEDS FIXING
- ⚠️ `components/EditListing.tsx` - NEEDS FIXING
- ⚠️ `components/ListARoom.tsx` - NEEDS FIXING
- ⚠️ `components/misc/ProfileNotification.tsx` - NEEDS FIXING
- ⚠️ `components/misc/accountCreationForm.tsx` - NEEDS FIXING

### Phase 2: Optimize API Functions (Reduces ~15% of requests)

**Modify API functions to accept user parameter:**
```typescript
// Instead of:
const getUserApplications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  // ...
}

// Use:
const getUserApplications = async (user: User) => {
  // ...
}
```

**Files to fix:**
- ⚠️ `utils/supabase/api.ts` - ALL functions need user parameter

### Phase 3: Server-Side Optimization (Reduces ~5% of requests)

**Add proper caching for server-side auth checks:**
- ⚠️ `app/page.tsx` - RECENTLY FIXED but needs caching
- ⚠️ `app/dashboard/page.tsx` - NEEDS OPTIMIZATION
- ⚠️ All other page components

## CRITICAL ACTIONS:

1. **STOP using `supabase.auth.getUser()` in components**
2. **USE `useAuth()` hook from AuthProvider**
3. **PASS user to API functions instead of fetching again**
4. **ADD proper memoization to prevent re-renders**

## Expected Results:
- **Before**: 13,000+ requests/hour
- **After Phase 1**: ~2,600 requests/hour (80% reduction)
- **After Phase 2**: ~2,200 requests/hour (85% reduction)  
- **After Phase 3**: ~1,950 requests/hour (90% reduction)

## URGENT: Apply Phase 1 fixes immediately!