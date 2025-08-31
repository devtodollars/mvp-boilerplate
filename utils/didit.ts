// Didit API integration utilities
// This file handles the integration with Didit's verification service

export interface DiditVerificationRequest {
  userId: string
  email: string
  firstName: string
  lastName: string
  workflowId?: string
  redirectUrl?: string
  metadata?: Record<string, any>
}

export interface DiditVerificationResponse {
  success: boolean
  verificationUrl?: string
  verificationId?: string
  error?: string
}

export interface DiditWebhookPayload {
  verificationId: string
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  metadata?: Record<string, any>
  timestamp: string
}

export class DiditAPI {
  private apiKey: string
  private workflowId: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.DIDIT_API_KEY || ''
    this.workflowId = process.env.DIDIT_WORKFLOW_ID || ''
    this.baseUrl = process.env.DIDIT_BASE_URL || 'https://verification.didit.me'
  }

  /**
   * Create a verification session with Didit
   */
  async createVerificationSession(request: DiditVerificationRequest): Promise<DiditVerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          workflow_id: this.workflowId || request.workflowId || 'default',
          vendor_data: request.userId,
          callback: request.redirectUrl,
          metadata: {
            ...request.metadata,
            source: 'golet_app',
            timestamp: new Date().toISOString(),
            user_email: request.email,
            user_first_name: request.firstName,
            user_last_name: request.lastName
          }
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Didit API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        verificationUrl: data.url,  // Didit returns 'url' field
        verificationId: data.session_id,  // Didit returns 'session_id' field
      }
    } catch (error) {
      console.error('Didit verification initiation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check the status of a verification
   */
  async checkVerificationStatus(verificationId: string): Promise<DiditVerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/verifications/${verificationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Didit API error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        verificationId: data.verification_id,
      }
    } catch (error) {
      console.error('Didit status check failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // TODO: Implement webhook signature verification
    // This is a placeholder for the actual signature verification logic
    return true
  }

  /**
   * Process webhook callback from Didit
   */
  async processWebhook(payload: DiditWebhookPayload): Promise<boolean> {
    try {
      // TODO: Update user verification status in database
      // This should update the 'verified' column in the users table
      
      console.log('Processing Didit webhook:', payload)
      
      // For now, return success
      return true
    } catch (error) {
      console.error('Failed to process Didit webhook:', error)
      return false
    }
  }
}

// Export singleton instance
export const diditAPI = new DiditAPI()

// Helper functions
export const diditHelpers = {
  /**
   * Generate a redirect URL for the verification process
   */
  generateRedirectUrl: (userId: string, returnPath: string = '/account/profile') => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return `${baseUrl}${returnPath}?verification=success&userId=${userId}`
  },

  /**
   * Extract verification parameters from URL
   */
  parseVerificationParams: (searchParams: URLSearchParams) => {
    return {
      verification: searchParams.get('verification'),
      userId: searchParams.get('userId'),
      verificationId: searchParams.get('verificationId'),
    }
  },

  /**
   * Check if verification was successful
   */
  isVerificationSuccessful: (searchParams: URLSearchParams): boolean => {
    const params = diditHelpers.parseVerificationParams(searchParams)
    return params.verification === 'success' && !!params.userId
  },
}
