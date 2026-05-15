import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Loader2,
  Save,
  Mail,
  Smartphone
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    quizReminders: true,
    streakAlerts: true,
    newContent: false
  });
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    allowAnalytics: true,
    shareProgress: false
  });

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // API call to update profile
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="glass-card mb-6">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="organization">
              <Palette className="w-4 h-4 mr-2" />
              Organization
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="glass-input bg-white/5"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact admin for assistance.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Registration ID</Label>
                <Input
                  value={user?.registrationId}
                  disabled
                  className="glass-input bg-white/5"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={user?.role}
                  disabled
                  className="glass-input bg-white/5 capitalize"
                />
              </div>

              <Button
                onClick={handleProfileUpdate}
                disabled={isLoading}
                className="gradient-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>

              <div className="border-t border-white/10 pt-6">
                <h4 className="font-medium mb-4">Notification Types</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Quiz Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Reminders to take quizzes
                      </p>
                    </div>
                    <Switch
                      checked={notifications.quizReminders}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, quizReminders: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Streak Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Alerts about your learning streak
                      </p>
                    </div>
                    <Switch
                      checked={notifications.streakAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, streakAlerts: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Content</p>
                      <p className="text-sm text-muted-foreground">
                        Notifications about new study materials
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newContent}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, newContent: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="glass-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="glass-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="glass-input"
                />
              </div>

              <Button className="gradient-button">
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab (Admin Only) */}
        {user?.role === 'admin' && (
          <TabsContent value="organization">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-cyan-400" />
                  <span>Organization Branding</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organization branding settings can be configured here. 
                  Contact support for advanced customization options.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
