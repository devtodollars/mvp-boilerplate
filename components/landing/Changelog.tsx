'use client';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface ChangelogEntry {
  date: string;
  type: string;
  title: string;
  description: string;
  focusPoints: string[];
}

const changelogEntries: ChangelogEntry[] = [
  {
    date: 'June 17, 2025',
    type: 'Announcement',
    title: 'Public Announcement',
    description: 'Planning and research phase, focusing on essential features for property listing and searching.',
    focusPoints: [
      'Starting with room sharing as a safe and transparent alternative to Facebook groups',
      'Offering a fixed pricing plan of €5 per listing for 30 days'
    ]
  },
  {
    date: 'Sept 1, 2025',
    type: 'Alpha Launch',
    title: 'Product Launch version Alpha',
    description: 'Focus on delivering developed features and seeking user feedback on the application\'s performance.',
    focusPoints: [
      'Goal to iterate with user help, directly working with users to improve and design features, fix bugs, and enhance the overall app'
    ]
  }
];

export const Changelog = () => {
  return (
    <section 
      id="changelog" 
      className="relative py-24 sm:py-32"
      style={{
        background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)'
      }}
    >
      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <RefreshCw className="w-4 h-4 text-gray-600" />
            <Badge variant="outline" className="text-sm font-medium">
              Changelog
            </Badge>
          </div>
          <h2 className="text-4xl font-bold text-gray-900">
            Recent Updates
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest changes, improvements, and bug fixes.
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
          
          {/* Timeline entries */}
          <div className="space-y-12">
            {changelogEntries.map((entry, index) => (
              <div key={index} className="relative flex items-start">
                {/* Timeline dot */}
                <div className="absolute left-6 w-4 h-4 bg-gray-900 rounded-full border-4 border-white shadow-sm transform -translate-x-1/2"></div>
                
                {/* Content */}
                <div className="ml-16 flex-1">
                  {/* Date and badge */}
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-600">
                      {entry.date}
                    </span>
                    <Badge variant="default" className="text-xs">
                      {entry.type}
                    </Badge>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {entry.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {entry.description}
                  </p>
                  
                  {/* Focus Points */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Focus Points
                    </h4>
                    <ul className="space-y-2">
                      {entry.focusPoints.map((point, pointIndex) => (
                        <li key={pointIndex} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-600 leading-relaxed">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}; 