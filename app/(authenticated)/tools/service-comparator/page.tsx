/**
 * Enhanced Service Comparator AI Page
 * Compare insurance, utilities, and service providers with comprehensive multi-factor analysis
 */

import { EnhancedServiceComparatorAI } from '@/components/service-comparator/enhanced-service-comparator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComparisonHistoryDashboard } from '@/components/service-comparator/comparison-history-dashboard';

export const metadata = {
  title: 'Service Comparator AI | LifeHub',
  description: 'Compare insurance, utilities, and service providers with AI-powered comprehensive analysis',
};

export default function ServiceComparatorPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Service Comparator AI</h1>
        <p className="text-muted-foreground">
          Comprehensive multi-factor analysis considering location, usage patterns, financial constraints, risk profile, and more
        </p>
      </div>

      <Tabs defaultValue="compare" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="compare">Compare Services</TabsTrigger>
          <TabsTrigger value="history">History & Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="compare" className="mt-6">
          <EnhancedServiceComparatorAI />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <ComparisonHistoryDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}









