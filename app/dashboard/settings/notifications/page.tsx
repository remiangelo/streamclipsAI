'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { trpc } from '@/lib/trpc/client';
import { Loader2, Save, Bell, Mail, AlertCircle, CheckCircle, TrendingUp, CalendarDays } from 'lucide-react';

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const { data: preferences, isLoading } = trpc.user.getNotificationPreferences.useQuery();
  
  const updatePreferencesMutation = trpc.user.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
      setIsSaving(false);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsSaving(false);
    },
  });

  const [formData, setFormData] = useState({
    emailNotifications: true,
    emailProcessingComplete: true,
    emailProcessingFailed: true,
    emailSubscriptionUpdates: true,
    emailProductUpdates: false,
    emailWeeklyDigest: false,
  });

  // Update form data when preferences load
  if (preferences && !isLoading) {
    if (JSON.stringify(formData) !== JSON.stringify(preferences)) {
      setFormData(preferences);
    }
  }

  const handleToggle = (field: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    updatePreferencesMutation.mutate(formData);
  };

  const hasChanges = preferences && JSON.stringify(formData) !== JSON.stringify(preferences);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="animate-fade-down">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-gray-400">Manage how you receive notifications from StreamClips AI</p>
      </div>

      {isLoading ? (
        <Card className="glass-dark border-0">
          <CardContent className="py-20">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-fade-up">
          {/* Master Toggle */}
          <Card className="glass-dark border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-400" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Control whether you receive any email notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="cursor-pointer">
                  Enable all email notifications
                </Label>
                <Switch
                  id="emailNotifications"
                  checked={formData.emailNotifications}
                  onCheckedChange={() => handleToggle('emailNotifications')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Processing Notifications */}
          <Card className="glass-dark border-0">
            <CardHeader>
              <CardTitle>Processing Notifications</CardTitle>
              <CardDescription>
                Get notified about your VOD processing status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailProcessingComplete" className="cursor-pointer flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Processing Complete
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive an email when your clips are ready
                  </p>
                </div>
                <Switch
                  id="emailProcessingComplete"
                  checked={formData.emailProcessingComplete}
                  onCheckedChange={() => handleToggle('emailProcessingComplete')}
                  disabled={!formData.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailProcessingFailed" className="cursor-pointer flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    Processing Failed
                  </Label>
                  <p className="text-sm text-gray-500">
                    Get notified if processing fails so you can retry
                  </p>
                </div>
                <Switch
                  id="emailProcessingFailed"
                  checked={formData.emailProcessingFailed}
                  onCheckedChange={() => handleToggle('emailProcessingFailed')}
                  disabled={!formData.emailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account & Subscription */}
          <Card className="glass-dark border-0">
            <CardHeader>
              <CardTitle>Account & Subscription</CardTitle>
              <CardDescription>
                Important updates about your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailSubscriptionUpdates" className="cursor-pointer flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-400" />
                    Subscription Updates
                  </Label>
                  <p className="text-sm text-gray-500">
                    Payment confirmations and subscription changes
                  </p>
                </div>
                <Switch
                  id="emailSubscriptionUpdates"
                  checked={formData.emailSubscriptionUpdates}
                  onCheckedChange={() => handleToggle('emailSubscriptionUpdates')}
                  disabled={!formData.emailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Marketing & Updates */}
          <Card className="glass-dark border-0">
            <CardHeader>
              <CardTitle>Product & Marketing</CardTitle>
              <CardDescription>
                Stay informed about new features and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailProductUpdates" className="cursor-pointer flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Product Updates
                  </Label>
                  <p className="text-sm text-gray-500">
                    New features, improvements, and tips
                  </p>
                </div>
                <Switch
                  id="emailProductUpdates"
                  checked={formData.emailProductUpdates}
                  onCheckedChange={() => handleToggle('emailProductUpdates')}
                  disabled={!formData.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailWeeklyDigest" className="cursor-pointer flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-amber-400" />
                    Weekly Digest
                  </Label>
                  <p className="text-sm text-gray-500">
                    Weekly summary of your clip performance
                  </p>
                </div>
                <Switch
                  id="emailWeeklyDigest"
                  checked={formData.emailWeeklyDigest}
                  onCheckedChange={() => handleToggle('emailWeeklyDigest')}
                  disabled={!formData.emailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}