/**
 * Enhanced Service Comparator AI Page
 * Compare insurance, utilities, and service providers with comprehensive multi-factor analysis
 */

import { ComprehensiveServiceComparator } from '@/components/service-comparator/comprehensive-service-comparator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComparisonHistoryDashboard } from '@/components/service-comparator/comparison-history-dashboard';

export const metadata = {
  title: 'Service Comparator AI | LifeHub',
  description: 'Compare insurance, utilities, and service providers with AI-powered comprehensive analysis',
};

export default function ServiceComparatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Tabs defaultValue="compare" className="w-full">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Service Comparator AI</h1>
                <p className="text-sm text-muted-foreground">
                  Comprehensive multi-factor analysis for accurate estimates
                </p>
              </div>
              <TabsList>
                <TabsTrigger value="compare">Compare Services</TabsTrigger>
                <TabsTrigger value="history">History & Analytics</TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>
        <TabsContent value="compare" className="mt-0">
          <ComprehensiveServiceComparator />
        </TabsContent>
        <TabsContent value="history" className="mt-6 container mx-auto px-4">
          <ComparisonHistoryDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}









