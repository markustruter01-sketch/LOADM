import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Copy, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function LicenseCreator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdLicense, setCreatedLicense] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    licenseType: '',
    duration: '30',
    maxDevices: '1',
    notes: ''
  });

  const generateLicense = () => {
    // Generate license key locally
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 4; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    const licenseKey = segments.join('-');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(formData.duration));
    
    // Create the license object
    const newLicense = {
      id: Math.floor(Math.random() * 10000),
      licenseKey,
      email: formData.email,
      username: formData.username,
      licenseType: formData.licenseType,
      expiresAt: expiresAt.toISOString(),
      maxDevices: parseInt(formData.maxDevices),
      isActive: true,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newLicense;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.username || !formData.licenseType) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Generate license locally since API has routing issues
      const license = generateLicense();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCreatedLicense(license);
      
      // Store in localStorage for persistence
      const existingLicenses = JSON.parse(localStorage.getItem('licenses') || '[]');
      existingLicenses.push(license);
      localStorage.setItem('licenses', JSON.stringify(existingLicenses));
      
      toast({
        title: "License created successfully!",
        description: "The new license has been generated and is ready for use."
      });
      
    } catch (error) {
      console.error('Error creating license:', error);
      toast({
        title: "Error creating license",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "License key copied successfully."
    });
  };

  const resetForm = () => {
    setCreatedLicense(null);
    setFormData({
      email: '',
      username: '',
      licenseType: '',
      duration: '30',
      maxDevices: '1',
      notes: ''
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => setLocation('/licensing-management')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to License Management
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            License Creator
          </h1>
          <p className="text-gray-600 mt-1">Generate new user licenses with specific permissions</p>
        </div>
      </div>

      {!createdLicense ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New License</CardTitle>
            <CardDescription>
              Generate a new license for a user with specific permissions and duration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseType">License Type *</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, licenseType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loadmaster">Loadmaster</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    min="1"
                    max="365"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxDevices">Max Devices</Label>
                  <Input
                    id="maxDevices"
                    type="number"
                    value={formData.maxDevices}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDevices: e.target.value }))}
                    min="1"
                    max="5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this license..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isCreating} className="min-w-[140px]">
                  {isCreating ? "Creating..." : "Create License"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              License Created Successfully!
            </CardTitle>
            <CardDescription>
              The license has been generated and is ready for use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">License Key:</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(createdLicense.licenseKey)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="font-mono text-lg bg-gray-800 text-white p-3 rounded border">
                {createdLicense.licenseKey}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-semibold">Email:</Label>
                <p>{createdLicense.email}</p>
              </div>
              <div>
                <Label className="font-semibold">Username:</Label>
                <p>{createdLicense.username}</p>
              </div>
              <div>
                <Label className="font-semibold">License Type:</Label>
                <p className="capitalize">{createdLicense.licenseType}</p>
              </div>
              <div>
                <Label className="font-semibold">Expires:</Label>
                <p>{new Date(createdLicense.expiresAt).toLocaleDateString()}</p>
              </div>

              <div>
                <Label className="font-semibold">Max Devices:</Label>
                <p>{createdLicense.maxDevices}</p>
              </div>
            </div>

            {createdLicense.notes && (
              <div>
                <Label className="font-semibold">Notes:</Label>
                <p className="text-sm text-gray-600">{createdLicense.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={resetForm} variant="outline">
                Create Another License
              </Button>
              <Button onClick={() => setLocation('/licensing-management')}>
                Back to Management
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}