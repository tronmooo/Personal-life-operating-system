'use client';

/**
 * Deal Alert Setup Component
 * Allow users to set up automatic monitoring for better deals
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createServiceDealAlert } from '@/lib/notifications/service-deal-alerts';
import type { ServiceType } from '@/types/service-comparator';
import { SERVICE_TYPE_LABELS } from '@/types/service-comparator';

interface DealAlertSetupProps {
  serviceType: ServiceType;
  currentProvider?: string;
  currentMonthlyCost?: number;
  onComplete?: () => void;
}

export function DealAlertSetup({
  serviceType,
  currentProvider = '',
  currentMonthlyCost = 0,
  onComplete,
}: DealAlertSetupProps) {
  const [provider, setProvider] = useState(currentProvider);
  const [monthlyCost, setMonthlyCost] = useState(currentMonthlyCost);
  const [threshold, setThreshold] = useState(50);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!provider || monthlyCost <= 0) {
      toast.error('Please enter your current provider and monthly cost');
      return;
    }

    setSaving(true);

    try {
      // In real implementation, get userId from auth
      const userId = 'current-user'; 

      await createServiceDealAlert(
        userId,
        serviceType,
        provider,
        monthlyCost,
        threshold,
        frequency
      );

      toast.success('Deal alert created!', {
        description: `We'll check ${frequency} for better ${SERVICE_TYPE_LABELS[serviceType]} deals`,
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
      toast.error('Failed to create deal alert');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Set Up Deal Alerts</CardTitle>
            <CardDescription>
              Get notified automatically when better deals are available for {SERVICE_TYPE_LABELS[serviceType]}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Provider</Label>
          <Input
            placeholder="e.g., State Farm, Verizon"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Current Monthly Cost</Label>
          <Input
            type="number"
            placeholder="150"
            value={monthlyCost || ''}
            onChange={(e) => setMonthlyCost(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Alert Threshold (Annual Savings)</Label>
          <Input
            type="number"
            placeholder="50"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 50)}
          />
          <p className="text-xs text-muted-foreground">
            Only alert me if I can save at least ${threshold}/year
          </p>
        </div>

        <div className="space-y-2">
          <Label>Check Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(value) => setFrequency(value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly (Recommended)</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label>Enable Alerts</Label>
            <p className="text-xs text-muted-foreground">
              Receive notifications when better deals are found
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !provider || monthlyCost <= 0}
          className="w-full"
        >
          {saving ? (
            'Creating Alert...'
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Create Deal Alert
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          We'll run comparisons in the background and notify you only when we find deals meeting your threshold
        </p>
      </CardContent>
    </Card>
  );
}
















