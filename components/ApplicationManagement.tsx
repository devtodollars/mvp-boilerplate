"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Eye,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Star,
  FileText,
  GraduationCap,
  Briefcase,
  Heart
} from "lucide-react"

import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { createApiClient } from "@/utils/supabase/api"
import Image from "next/image"


type Listing = {
  id: string
  property_name: string
  address: string
  user_id: string
  [key: string]: any
}

interface Application {
  id: string
  listing_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  message?: string
  position: number
  applied_at: string
  reviewed_at?: string
  notes?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    email: string
    full_name: string
    phone?: string
    avatar_url?: string
    date_of_birth?: string
    occupation?: string
    employer?: string
    annual_income?: number
    smoking?: boolean
    pets?: boolean
    references?: string
    bio?: string
    created_at: string
  }
}

interface ApplicationManagementProps {
  listing: Listing
}

export default function ApplicationManagement({ listing }: ApplicationManagementProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("position")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null)
  const [processingAction, setProcessingAction] = useState(false)
  const [activeTab, setActiveTab] = useState('all')


  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchApplications()
  }, [listing.id])

  useEffect(() => {
    filterAndSortApplications()
  }, [applications, searchTerm, statusFilter, sortBy])

  const fetchApplications = async () => {
    try {
      const supabase = createClient()

      // First, get the applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: false })

      if (applicationsError) {
        console.error('Applications error:', applicationsError)
        throw applicationsError
      }

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([])
        return
      }

      // Then, get the user data for each application
      const userIds = applicationsData.map(app => app.user_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      if (usersError) {
        console.error('Users error:', usersError)
        throw usersError
      }

      // Combine the data
      const data = applicationsData.map(app => ({
        ...app,
        user: usersData?.find(user => user.id === app.user_id) || null
      }))

      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        listing_id: item.listing_id,
        user_id: item.user_id,
        status: item.status as 'pending' | 'accepted' | 'rejected' | 'withdrawn',
        message: item.notes || '',
        position: item.position,
        applied_at: item.applied_at,
        reviewed_at: item.reviewed_at,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          id: item.user?.id || '',
          email: item.user?.email || '',
          full_name: item.user?.full_name || `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || 'Unknown',
          phone: item.user?.phone || '',
          avatar_url: item.user?.avatar_url || '',
          date_of_birth: item.user?.date_of_birth || '',
          occupation: item.user?.occupation || '',
          employer: '', // Not in the schema
          annual_income: 0, // Not in the schema
          smoking: item.user?.smoker || false,
          pets: item.user?.pets || false,
          references: '', // Not in the schema
          bio: item.user?.bio || '',
          created_at: item.user?.created_at || ''
        }
      }))
      setApplications(transformedData)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortApplications = () => {
    let filtered = applications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.user.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.message?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "position":
          return a.position - b.position
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "name":
          return (a.user.full_name || "").localeCompare(b.user.full_name || "")
        default:
          return a.position - b.position
      }
    })

    setFilteredApplications(filtered)
  }

  const handleAction = async (application: Application, action: 'accept' | 'reject') => {
    setSelectedApplication(application)
    setActionType(action)
    setShowActionDialog(true)
  }

  const confirmAction = async () => {
    if (!selectedApplication || !actionType) return

    setProcessingAction(true)
    try {
      const response = await fetch(`/api/applications/${selectedApplication.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: actionType === 'accept' ? 'accepted' : 'rejected'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update application')
      }

      const result = await response.json()

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === selectedApplication.id
            ? { ...app, status: actionType === 'accept' ? 'accepted' : 'rejected' }
            : app
        )
      )

      toast({
        title: `Application ${actionType === 'accept' ? 'Accepted' : 'Rejected'}`,
        description: `Successfully ${actionType}ed application from ${selectedApplication.user.full_name}`,
        variant: "default",
      })

      setShowActionDialog(false)
      setSelectedApplication(null)
      setActionType(null)
    } catch (error) {
      console.error('Error updating application:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${actionType} application.`,
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          label: 'Pending',
          color: 'bg-amber-100 text-amber-800 border-amber-200'
        }
      case 'accepted':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Accepted',
          color: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'rejected':
        return {
          icon: <XCircle className="h-4 w-4" />,
          label: 'Rejected',
          color: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'withdrawn':
        return {
          icon: <XCircle className="h-4 w-4" />,
          label: 'Withdrawn',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        }
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const getApplicationStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      withdrawn: applications.filter(app => app.status === 'withdrawn').length,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Applications</h3>
              <p className="text-gray-600">Gathering application data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
              <p className="text-gray-600">{listing.property_name}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{getApplicationStats().total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-700 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-amber-900">{getApplicationStats().pending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">Accepted</p>
                  <p className="text-2xl font-bold text-green-900">{getApplicationStats().accepted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">{getApplicationStats().rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm font-medium">Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-900">{getApplicationStats().withdrawn}</p>
                </div>
                <XCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, occupation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="position">Queue Position</SelectItem>
                    <SelectItem value="date">Application Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setSortBy("position")
                  }}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({getApplicationStats().total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({getApplicationStats().pending})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({getApplicationStats().accepted})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({getApplicationStats().rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ApplicationsList
              applications={filteredApplications}
              onAction={handleAction}
              getStatusInfo={getStatusInfo}
              onViewDetails={(app) => {
                setSelectedApplication(app)
                setShowActionDialog(true)
              }}
              onChat={(app) => {
                // Dispatch custom event to open chat in global ChatTabs
                window.dispatchEvent(new CustomEvent('openChat', {
                  detail: { applicationId: app.id }
                }))
              }}
            />
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <ApplicationsList
              applications={filteredApplications.filter(app => app.status === 'pending')}
              onAction={handleAction}
              getStatusInfo={getStatusInfo}
              onViewDetails={(app) => {
                setSelectedApplication(app)
                setShowActionDialog(true)
              }}
              onChat={(app) => {
                // Dispatch custom event to open chat in global ChatTabs
                window.dispatchEvent(new CustomEvent('openChat', {
                  detail: { applicationId: app.id }
                }))
              }}
            />
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            <ApplicationsList
              applications={filteredApplications.filter(app => app.status === 'accepted')}
              onAction={handleAction}
              getStatusInfo={getStatusInfo}
              onViewDetails={(app) => {
                setSelectedApplication(app)
                setShowActionDialog(true)
              }}
              onChat={(app) => {
                // Dispatch custom event to open chat in global ChatTabs
                window.dispatchEvent(new CustomEvent('openChat', {
                  detail: { applicationId: app.id }
                }))
              }}
            />
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <ApplicationsList
              applications={filteredApplications.filter(app => app.status === 'rejected')}
              onAction={handleAction}
              getStatusInfo={getStatusInfo}
              onViewDetails={(app) => {
                setSelectedApplication(app)
                setShowActionDialog(true)
              }}
              onChat={(app) => {
                // Dispatch custom event to open chat in global ChatTabs
                window.dispatchEvent(new CustomEvent('openChat', {
                  detail: { applicationId: app.id }
                }))
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Action Confirmation Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="w-[92vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionType ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Confirm {actionType === 'accept' ? 'Acceptance' : 'Rejection'}
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5 text-blue-600" />
                    Application Details
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {actionType ?
                  `Are you sure you want to ${actionType} this application? This action cannot be undone.` :
                  'View detailed information about this application.'
                }
              </DialogDescription>
            </DialogHeader>

            {selectedApplication && (
              <div className="space-y-6">
                {/* Applicant Information */}
                <div className="bg-gray-50 border rounded-lg p-6 overflow-hidden">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={selectedApplication.user.avatar_url || '/defaultAvatar.png'}
                        alt={selectedApplication.user.full_name}
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-lg">
                        {selectedApplication.user.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{selectedApplication.user.full_name}</h4>
                      <p className="text-gray-600">{selectedApplication.user.occupation || 'No occupation specified'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getStatusInfo(selectedApplication.status).color} flex items-center gap-1`}>
                          {getStatusInfo(selectedApplication.status).icon}
                          {getStatusInfo(selectedApplication.status).label}
                        </Badge>
                        {selectedApplication.status === 'pending' && (
                          <Badge variant="outline" className="text-xs">
                            Position #{selectedApplication.position}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Applied {new Date(selectedApplication.applied_at).toLocaleDateString()}</span>
                    </div>

                    {selectedApplication.user.annual_income && selectedApplication.user.annual_income > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="h-4 w-4" />
                        <span>€{selectedApplication.user.annual_income.toLocaleString()}/year</span>
                      </div>
                    )}
                  </div>

                  {/* User Preferences */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedApplication.user.smoking && (
                      <Badge variant="outline" className="text-xs">
                        Smoking
                      </Badge>
                    )}
                    {selectedApplication.user.pets && (
                      <Badge variant="outline" className="text-xs">
                        Pets
                      </Badge>
                    )}
                  </div>

                  {/* Bio */}
                  {selectedApplication.user.bio && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Bio</h5>
                      <p className="text-sm text-gray-600 break-words">{selectedApplication.user.bio}</p>
                    </div>
                  )}
                </div>

                {/* Application Message */}
                {selectedApplication.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Application Message
                    </h4>
                    <p className="text-sm text-blue-800 leading-relaxed break-words">
                      {selectedApplication.message}
                    </p>
                  </div>
                )}

                {/* Action Warnings - Only show for accept/reject actions */}
                {actionType && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-2">
                      What happens when you {actionType}:
                    </h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {actionType === 'accept' ? (
                        <>
                          <li>• The applicant will be notified of acceptance</li>
                          <li>• Other pending applications will remain in queue</li>
                          <li>• You can still manage other applications</li>
                        </>
                      ) : (
                        <>
                          <li>• The applicant will be notified of rejection</li>
                          <li>• Other applications will move up in queue</li>
                          <li>• The applicant can apply to other properties</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionDialog(false)
                  setSelectedApplication(null)
                  setActionType(null)
                }}
                disabled={processingAction}
              >
                {actionType ? 'Cancel' : 'Close'}
              </Button>
              {actionType && (
                <Button
                  variant={actionType === 'accept' ? 'default' : 'destructive'}
                  onClick={confirmAction}
                  disabled={processingAction}
                  className="flex items-center gap-2"
                >
                  {processingAction ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {actionType === 'accept' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {actionType === 'accept' ? 'Accept' : 'Reject'} Application
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </div>
  )
}

// Applications List Component
function ApplicationsList({
  applications,
  onAction,
  getStatusInfo,
  onViewDetails,
  onChat
}: {
  applications: Application[]
  onAction: (app: Application, action: 'accept' | 'reject') => void
  getStatusInfo: (status: string) => any
  onViewDetails: (app: Application) => void
  onChat: (app: Application) => void
}) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications</h3>
        <p className="text-gray-600">No applications match your current filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {applications.map((application) => {
        const statusInfo = getStatusInfo(application.status)

        return (
          <ApplicationCard
            key={application.id}
            application={application}
            statusInfo={statusInfo}
            onAction={onAction}
            onViewDetails={onViewDetails}
            onChat={onChat}
          />
        )
      })}
    </div>
  )
}

// Individual Application Card Component
function ApplicationCard({
  application,
  statusInfo,
  onAction,
  onViewDetails,
  onChat
}: {
  application: Application
  statusInfo: any
  onAction: (app: Application, action: 'accept' | 'reject') => void
  onViewDetails: (app: Application) => void
  onChat: (app: Application) => void
}) {
  const [showFullMessage, setShowFullMessage] = useState(false)
  return (
    <Card className="border shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={application.user.avatar_url || '/defaultAvatar.png'}
                alt={application.user.full_name}
              />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-lg">
                {application.user.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {application.user.full_name}
              </h3>
              <p className="text-gray-600">{application.user.occupation}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
                {application.status === 'pending' && (
                  <Badge variant="outline" className="text-xs">
                    Position #{application.position}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Application Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
          </div>

        </div>

        {/* Application Message */}
        {application.message && (
          <div className="bg-gray-50 border rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Application Message
            </h4>
            <div className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words ${showFullMessage ? '' : 'max-h-24 overflow-hidden'}`}>
              {application.message}
            </div>
            {application.message.length > 180 && (
              <div className="mt-2">
                <Button
                  variant="link"
                  className="h-auto p-0 text-blue-600"
                  onClick={() => setShowFullMessage(v => !v)}
                >
                  {showFullMessage ? 'Show less' : 'Show more'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* User Preferences */}
        <div className="flex flex-wrap gap-2">
          {application.user.smoking && (
            <Badge variant="outline" className="text-xs">
              Smoking
            </Badge>
          )}
          {application.user.pets && (
            <Badge variant="outline" className="text-xs">
              Pets
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        {application.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onAction(application, 'accept')}
              className="flex-1"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button
              onClick={() => onAction(application, 'reject')}
              variant="destructive"
              className="flex-1"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {application.status === 'accepted' && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              onClick={() => onViewDetails(application)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              onClick={() => onChat(application)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button
              onClick={() => onAction(application, 'reject')}
              variant="destructive"
              className="flex-1"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {(application.status === 'rejected' || application.status === 'withdrawn') && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={() => onViewDetails(application)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 