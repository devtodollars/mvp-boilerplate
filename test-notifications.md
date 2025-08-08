# Notification System Test Guide

## Prerequisites
- Two user accounts (one for listing owner, one for applicant)
- At least one listing created

## Test Scenarios

### 1. Application Notification
1. Login as User A (listing owner)
2. Create a listing
3. Login as User B (applicant)
4. Apply to the listing
5. Login as User A again
6. Check notification bell - should show new application notification
7. Click notification - should navigate to application page
8. Refresh page - notification should be gone

### 2. Message Notification
1. Login as User A
2. Go to applications page
3. Start a chat with User B
4. Login as User B
5. Send a message in the chat
6. Login as User A
7. Check notification bell - should show new message notification
8. Click notification - should open chat tab
9. Refresh page - notification should be gone

### 3. Status Change Notification
1. Login as User A (listing owner)
2. Go to applications page
3. Change application status (e.g., approve/reject)
4. Login as User B (applicant)
5. Check notification bell - should show status change notification
6. Click notification - should navigate to application page

### 4. Mark All as Read
1. Create multiple notifications (applications, messages, status changes)
2. Click "Mark all as read" in notification dropdown
3. Verify all notifications are deleted
4. Verify count goes to 0

### 5. Error Handling
1. Create a notification
2. Try to navigate to a non-existent page
3. Verify notification stays and error toast appears
4. Verify notification is only deleted on successful navigation

## Expected Behavior
- Notifications are created automatically when events occur
- Notifications are deleted only when successfully navigated to
- Notifications persist across page refreshes until acted upon
- Error handling prevents accidental deletion
- Real-time updates every 30 seconds
