# 🚨 COMPLETE BAD PRACTICES AUDIT - ALL ISSUES FOUND

## **CRITICAL ISSUES CAUSING 228 AUTH REQUESTS/20MIN**

### **1. API UTILITY FUNCTIONS - HIGHEST PRIORITY** 🔥
**Location**: `utils/supabase/api.ts`
**Issue**: **10+ functions** with fallback auth calls
**Impact**: **MASSIVE** - These are called constantly

```typescript
// ❌ BAD PATTERN (found in 10+ functions)
const currentUser = user || (await supabase.auth.getUser()).data.user;
```

**Functions affected:**
- `createUserProfile` (line 322)
- `checkProfileCompletion` (line 423)
- `getUserApplications` (line 471)
- `applyToProperty` (line 509)
- `getListingApplications` (line 550)
- `updateApplicationStatus` (line 606)
- `checkUserApplication` (line 642)
- `toggleLikeListing` (line 676)
- `getUserLikedListings` (line 729)
- `checkIfListingLiked` (line 801)

### **2. API ROUTES - HIGH PRIORITY** 🔥
**Issue**: Direct `supabase.auth.getUser()` calls in API routes

**Files affected:**
- `app/api/notifications/delete-chat/[chatRoomId]/route.ts`
- `app/api/applications/[id]/status/route.ts`
- `app/api/test-apply/route.ts`
- `app/api/payments/simulate/route.ts`
- `app/api/auth_callback/route.ts` (2 instances)
- `app/api/debug-applications/route.ts`
- `app/api/delete-account/route.ts`
- `app/api/chat/messages/[chatRoomId]/route.ts` (2 instances)
- `app/api/chat/mark-read/[chatRoomId]/route.ts`

### **3. UTILITY FILES - MEDIUM PRIORITY** ⚠️
**Files with auth calls:**
- `utils/supabase/client.ts` - Has auth call (line 19)
- `utils/supabase/queries.ts` - Has auth call (line 13)
- `utils/supabase/middleware.ts` - Has auth call (line 115)

### **4. OTHER POTENTIAL ISSUES** ⚠️

#### **Memory Monitoring (Minor)**
- `utils/cache.ts` - Has `setInterval` for memory monitoring
- `utils/cache/apiCache.ts` - Has cleanup `setInterval`

#### **Auth Callback Route (Concerning)**
- `app/api/auth_callback/route.ts` - Makes 2 auth calls per callback

## **IMPACT ANALYSIS**

### **Current State**: 228 requests/20min = ~16,000/day
### **Expected After Fixes**: <20 requests/20min = ~1,400/day

## **PRIORITY FIX ORDER**

### **🔥 CRITICAL (Fix First)**
1. **Remove ALL fallback auth calls** from `utils/supabase/api.ts`
2. **Update remaining API routes** to use `getApiUser()`

### **⚠️ IMPORTANT (Fix Second)**
3. **Review auth callback route** - might be called frequently
4. **Check utility files** for unnecessary auth calls

### **✅ MINOR (Fix Later)**
5. **Review memory monitoring intervals**
6. **Audit any remaining edge cases**

## **ESTIMATED IMPACT**

**Fixing Priority 1 & 2 should reduce auth requests by 90%+**
- From: 228 requests/20min
- To: <20 requests/20min

**This is the difference between 16,000/day and 1,400/day!**