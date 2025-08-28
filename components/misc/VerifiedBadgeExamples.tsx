import { UserVerifiedBadge, ListingVerifiedBadge, ApplicationVerifiedBadge } from "@/components/ui/verified-badge"

// This component demonstrates how to use the verified badges throughout the application
export function VerifiedBadgeExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Verified Badge Examples</h2>
      
      {/* User Profile Badge */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">User Profile Badge</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-semibold">JD</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">John Doe</span>
              <UserVerifiedBadge verified={true} />
            </div>
            <p className="text-sm text-gray-600">Verified user since 2024</p>
          </div>
        </div>
      </div>

      {/* Listing Badge */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Listing Badge</h3>
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">Cozy Studio in City Center</h4>
              <p className="text-sm text-gray-600">€800/month • 1 bedroom</p>
            </div>
            <ListingVerifiedBadge verified={true} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Verified owner</p>
        </div>
      </div>

      {/* Application Badge */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Application Badge</h3>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Application from John Doe</h4>
              <p className="text-sm text-gray-600">Applied 2 days ago</p>
            </div>
            <ApplicationVerifiedBadge verified={true} />
          </div>
        </div>
      </div>

      {/* Unverified Examples */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Unverified Examples</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">JS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Jane Smith</span>
                <UserVerifiedBadge verified={false} />
              </div>
              <p className="text-sm text-gray-600">Unverified user</p>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">Room in Shared House</h4>
                <p className="text-sm text-gray-600">€600/month • Shared bathroom</p>
              </div>
              <ListingVerifiedBadge verified={false} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Unverified owner</p>
          </div>
        </div>
      </div>
    </div>
  )
}
