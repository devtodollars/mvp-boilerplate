'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Zap, Info } from 'lucide-react';

const otherPlatformsFeatures = [
  'Lack of transparency',
  'Random WhatsApp Call at 2pm',
  'Applications lost in emails',
  'Outdated Technology',
  'Lack of control',
  'No identity verification',
  'Zero security for deposits'
];

const goletFeatures = [
  'Bookable Viewing Times',
  'In-App messaging',
  'In-App Application Queue',
  'Providing fresh features',
  'Secure and encrypted',
  'Tenant and Landlord ID Verification',
  'Deposits are held until key handover'
];

export const Comparison = () => {
  return (
    <section id="comparison" className="container py-24 sm:py-32 space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-900">OTHER PLATFORMS</h2>
          <div className="relative">
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center transform rotate-12 shadow-sm">
              <span className="text-gray-600 font-bold text-lg">VS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img 
              src="/landing/goletNameLogo.png" 
              alt="GoLet.ie Logo" 
              className="h-20 w-auto"
            />
          </div>
        </div>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          See how GoLet.ie outperforms other platforms with superior features, high transparency and unmatched efficiency.
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Other Platforms Card */}
        <Card className="bg-gray-50 border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              OTHER PLATFORMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherPlatformsFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                    <Info className="w-3 h-3 text-gray-600" />
                  </div>
                </div>
                <span className="text-gray-700 leading-relaxed text-sm">{feature}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* GoLet.ie Card */}
        <Card className="bg-white border-teal-200 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-600"></div>
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2">
              <img 
                src="/landing/goletNameLogo.png" 
                alt="GoLet.ie Logo" 
                className="h-8 w-auto"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {goletFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Zap className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-gray-700 leading-relaxed text-sm">{feature}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="text-center pt-8">
        <Badge variant="secondary" className="text-sm px-4 py-2">
          Choose the platform that puts you first
        </Badge>
      </div>
    </section>
  );
}; 