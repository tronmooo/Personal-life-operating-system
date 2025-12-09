/**
 * Service Deal Alert Notifications
 * Monitors for better deals on service providers and alerts users
 */

import type { ServiceType } from '@/types/service-comparator';

export interface ServiceDealAlert {
  id: string;
  userId: string;
  serviceType: ServiceType;
  currentProvider: string;
  currentMonthlyCost: number;
  alertThreshold: number; // Minimum savings to trigger alert
  frequency: 'weekly' | 'monthly' | 'quarterly';
  enabled: boolean;
  lastChecked?: string;
  createdAt: string;
}

export interface DealAlertResult {
  alertId: string;
  foundBetterDeal: boolean;
  potentialSavings?: number;
  newProvider?: string;
  newMonthlyCost?: number;
  comparisonDetails?: any;
}

/**
 * Create a new service deal alert
 */
export async function createServiceDealAlert(
  userId: string,
  serviceType: ServiceType,
  currentProvider: string,
  currentMonthlyCost: number,
  alertThreshold: number = 50, // Default: alert if can save $50+/year
  frequency: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
): Promise<ServiceDealAlert> {
  const alert: ServiceDealAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    serviceType,
    currentProvider,
    currentMonthlyCost,
    alertThreshold,
    frequency,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  // In a real implementation, save to database
  console.log('Creating service deal alert:', alert);

  return alert;
}

/**
 * Check for better deals (called by cron job)
 */
export async function checkForBetterDeals(
  alert: ServiceDealAlert,
  userProfile: any
): Promise<DealAlertResult> {
  // This would run the comparison engine in the background
  try {
    const response = await fetch('/api/ai-tools/service-comparator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_type: alert.serviceType,
        user_profile: userProfile,
        usage_profile: {},
        preferences: {},
      }),
    });

    if (!response.ok) {
      throw new Error('Comparison failed');
    }

    const data = await response.json();

    // Check if any provider offers better deal than current
    const betterDeals = data.provider_breakdown.filter(
      (p: any) => p.name !== alert.currentProvider && 
                  p.cost_analysis.monthly_cost < alert.currentMonthlyCost
    );

    if (betterDeals.length > 0) {
      const bestDeal = betterDeals.sort(
        (a: any, b: any) => a.cost_analysis.monthly_cost - b.cost_analysis.monthly_cost
      )[0];

      const potentialSavings = (alert.currentMonthlyCost - bestDeal.cost_analysis.monthly_cost) * 12;

      if (potentialSavings >= alert.alertThreshold) {
        // Found a deal worth alerting about!
        return {
          alertId: alert.id,
          foundBetterDeal: true,
          potentialSavings,
          newProvider: bestDeal.name,
          newMonthlyCost: bestDeal.cost_analysis.monthly_cost,
          comparisonDetails: data,
        };
      }
    }

    return {
      alertId: alert.id,
      foundBetterDeal: false,
    };
  } catch (error) {
    console.error('Error checking for better deals:', error);
    return {
      alertId: alert.id,
      foundBetterDeal: false,
    };
  }
}

/**
 * Send notification about better deal
 */
export async function sendDealNotification(
  userId: string,
  result: DealAlertResult
): Promise<void> {
  if (!result.foundBetterDeal) return;

  const notification = {
    user_id: userId,
    title: '💰 Better Deal Found!',
    message: `You could save $${result.potentialSavings}/year by switching to ${result.newProvider} ($${result.newMonthlyCost}/month)`,
    category: 'service-deal-alert',
    priority: 'high',
    action_url: `/tools/service-comparator?alert_id=${result.alertId}`,
    metadata: result.comparisonDetails,
  };

  // Send notification via notification system
  try {
    await fetch('/api/notifications/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
  } catch (error) {
    console.error('Failed to send deal notification:', error);
  }
}

/**
 * Utility: Get next check date based on frequency
 */
export function getNextCheckDate(frequency: 'weekly' | 'monthly' | 'quarterly'): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'quarterly':
      now.setMonth(now.getMonth() + 3);
      break;
  }
  
  return now;
}


















