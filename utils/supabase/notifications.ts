import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types_db'

type Notification = Database['public']['Tables']['notifications']['Row']

/**
 * Fetches notifications for a user
 */
export async function fetchNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const supabase = createClient()
  
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return notifications || []
}

/**
 * Gets the count of notifications for a user
 */
export async function getNotificationCount(userId: string): Promise<number> {
  const supabase = createClient()
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error getting notification count:', error)
    return 0
  }

  return count || 0
}

/**
 * Deletes a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    return false
  }

  return true
}

/**
 * Deletes all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<number> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting all notifications:', error)
    return 0
  }

  return 1
}

/**
 * Handles notification click with navigation and deletion on success
 */
export async function handleNotificationClick(
  notification: Notification,
  router: any
): Promise<boolean> {
  try {
    let navigationSuccess = false

    // Use the navigation_target field if available, otherwise fall back to type-based navigation
    if (notification.navigation_target) {
      const [targetType, targetId] = notification.navigation_target.split(':')
      
      switch (targetType) {
        case 'application_detail':
          if (targetId) {
            router.push(`/applications/${targetId}`)
            navigationSuccess = true
          }
          break
          
        case 'chat_room':
          if (targetId) {
            // Open chat tab
            window.dispatchEvent(new CustomEvent('openChat', {
              detail: { applicationId: targetId }
            }))
            navigationSuccess = true
          }
          break
          
        case 'applications_list':
          router.push('/applications')
          navigationSuccess = true
          break
          
        case 'dashboard':
          router.push('/dashboard')
          navigationSuccess = true
          break
          
        case 'profile':
          router.push('/account/profile')
          navigationSuccess = true
          break
          
        default:
          // Fall back to type-based navigation
          navigationSuccess = await handleTypeBasedNavigation(notification, router)
      }
    } else {
      // Fall back to type-based navigation for backward compatibility
      navigationSuccess = await handleTypeBasedNavigation(notification, router)
    }

    // Only delete notification if navigation was successful
    if (navigationSuccess) {
      const deleted = await deleteNotification(notification.id)
      return deleted
    }

    return false
  } catch (error) {
    console.error('Error handling notification click:', error)
    return false
  }
}

/**
 * Fallback navigation based on notification type
 */
async function handleTypeBasedNavigation(notification: Notification, router: any): Promise<boolean> {
  try {
    if (notification.type === 'application' || notification.type === 'application_status') {
      const applicationId = notification.data && typeof notification.data === 'object' && 'application_id' in notification.data 
        ? notification.data.application_id as string 
        : null
      
      if (applicationId) {
        router.push(`/applications/${applicationId}`)
        return true
      }
    } else if (notification.type === 'message') {
      const applicationId = notification.data && typeof notification.data === 'object' && 'application_id' in notification.data 
        ? notification.data.application_id as string 
        : null
      
      if (applicationId) {
        // Open chat tab
        window.dispatchEvent(new CustomEvent('openChat', {
          detail: { applicationId }
        }))
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('Error in type-based navigation:', error)
    return false
  }
}
