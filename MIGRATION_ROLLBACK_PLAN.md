# localStorage Migration - Rollback Plan

**Created:** October 31, 2025  
**Purpose:** Emergency rollback procedures if migration causes issues in production

---

## ⚠️ When to Rollback

Consider rollback if:
- ❌ Data loss reported by users
- ❌ Migration failures > 10% of users
- ❌ Critical errors in Supabase queries
- ❌ Performance degradation > 2x slower
- ❌ IndexedDB quota errors affecting > 5% of users

**DO NOT rollback for:**
- ✅ Individual user migration failures (handle case-by-case)
- ✅ Minor performance variations
- ✅ Non-critical logging errors

---

## 🔄 Rollback Procedures

### Option 1: Quick Revert (Recommended)

**Time:** ~5 minutes  
**Risk:** Low  
**Data Loss:** None (data preserved in Supabase)

```bash
# 1. Revert the hook files
git revert <commit-hash-of-use-routines>
git revert <commit-hash-of-universal-ai-tool>

# 2. Restore RoutineManager to active use
# Remove deprecation warnings from lib/goals.ts
sed -i '' 's/console.warn.*RoutineManager.*//g' lib/goals.ts

# 3. Deploy immediately
npm run build
# Deploy to production

# 4. Verify
npm test
npm run lint
```

### Option 2: Feature Flag Disable

**Time:** ~1 minute  
**Risk:** Very Low  
**Data Loss:** None

```typescript
// Add to lib/feature-flags.ts
export const FEATURES = {
  USE_SUPABASE_ROUTINES: false,  // Disable new migration
  USE_INDEXEDDB_CACHE: false,    // Disable IndexedDB
}

// Update useRoutines to check flag
if (!FEATURES.USE_SUPABASE_ROUTINES) {
  return legacyRoutineManager.getRoutines()
}
```

### Option 3: Hybrid Mode (Temporary Fix)

**Time:** ~30 minutes  
**Risk:** Low  
**Data Loss:** None

Allow both localStorage and Supabase to work simultaneously:

```typescript
// In useRoutines hook
const routines = [
  ...supabaseRoutines,
  ...localStorageRoutines.filter(lr => 
    !supabaseRoutines.find(sr => sr.id === lr.id)
  )
]
```

This allows users to continue using localStorage while Supabase data loads.

---

## 🔍 Rollback Verification Checklist

After rollback, verify:

- [ ] Users can access their routines
- [ ] No console errors related to storage
- [ ] AI tools save/load working
- [ ] No Supabase query errors
- [ ] Performance metrics normal
- [ ] No user complaints in support

---

## 📊 Monitoring During Rollback

Monitor these metrics:
1. **Error rates** - Should return to pre-migration levels
2. **User sessions** - No drop in active users
3. **API response times** - Normal latency
4. **Support tickets** - No new storage-related issues

---

## 🔧 Post-Rollback Actions

### Immediate (0-24 hours)
1. **Communicate** - Notify team of rollback
2. **Investigate** - Root cause analysis
3. **Document** - Record what went wrong
4. **Plan** - Create fix strategy

### Short Term (1-7 days)
1. **Fix issues** - Address root cause
2. **Test thoroughly** - QA in staging
3. **Gradual rollout** - Canary deployment (5% → 25% → 50% → 100%)

### Long Term (1-4 weeks)
1. **Review metrics** - Ensure stability
2. **Re-attempt migration** - With fixes applied
3. **Post-mortem** - Learn from issues

---

## 🚨 Emergency Contacts

**During rollback, notify:**
- Tech Lead
- DevOps Team
- Customer Support
- Product Manager

---

## 📝 Rollback Log Template

```
Date: [YYYY-MM-DD HH:mm]
Triggered By: [Name]
Reason: [Brief description]
Option Used: [1, 2, or 3]
Time to Complete: [X minutes]
Data Loss: [None/Describe]
User Impact: [X users affected]
Resolution: [What fixed it]
Lessons Learned: [Key takeaways]
```

---

## 🎯 Prevention for Next Time

**Before next migration:**
1. ✅ Canary deployment (5% of users first)
2. ✅ Feature flags for easy disable
3. ✅ Comprehensive monitoring
4. ✅ User notification system
5. ✅ Automated rollback triggers
6. ✅ Backup strategy documented
7. ✅ Load testing completed

---

## 💾 Data Preservation

**Important:** Even after rollback, user data is preserved:

- **Supabase data** - Remains intact, can be synced later
- **localStorage data** - Not deleted by migration (backup exists)
- **IndexedDB data** - Preserved, can be exported

**To export user data for recovery:**
```typescript
// Run in browser console
const exportData = {
  routines: localStorage.getItem('routines'),
  supabaseData: await supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', userId)
}
console.log(JSON.stringify(exportData))
```

---

## ✅ Success Criteria for Rollback

Rollback is successful when:
1. ✅ Error rate returns to < 0.1%
2. ✅ No user-reported data loss
3. ✅ All features functioning normally
4. ✅ Performance metrics normalized
5. ✅ Support ticket volume normal

---

**Remember:** Rollback is a safety measure, not a failure. Better to rollback quickly than let issues persist.























