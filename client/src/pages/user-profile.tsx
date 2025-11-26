import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, User, Award, Plane, Calendar, Plus, Trash2, Edit2, Save, X, AlertCircle, CheckCircle2, RefreshCw, Camera, Upload } from "lucide-react";

export default function UserProfile() {
  const { user } = useIsolatedAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for adding qualifications
  const [showAddQualification, setShowAddQualification] = useState(false);
  const [newQualification, setNewQualification] = useState({
    name: "",
    customName: "",
    startDate: "",
    expiryDate: "",
    noEndDate: false,
  });

  // State for editing qualifications
  const [editingQualificationId, setEditingQualificationId] = useState<number | null>(null);
  const [editingQualification, setEditingQualification] = useState<any>(null);

  // State for adding flight records
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [newFlight, setNewFlight] = useState({
    date: "",
    callsign: "",
    departure: "",
    arrival: "",
    passengersCarried: 0,
    cargoWeight: 0,
    cargoWeightUnit: "kg",
    captain: "",
    nightHours: 0,
    dayHours: 0,
    aircraftType: "KC30A",
  });

  // State for editing flight records
  const [editingFlightId, setEditingFlightId] = useState<number | null>(null);
  const [editingFlight, setEditingFlight] = useState<any>(null);

  // State for editing user stats
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editedStats, setEditedStats] = useState({
    squadron: "",
    category: "",
  });

  // State for readiness toggle
  const [showReadinessConfirm, setShowReadinessConfirm] = useState(false);
  const [selectedNotReadyReason, setSelectedNotReadyReason] = useState<string>("");

  // Fetch user profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user
  });

  // Fetch qualifications
  const { data: qualifications = [], isLoading: qualificationsLoading } = useQuery<any[]>({
    queryKey: ['/api/user/qualifications'],
    enabled: !!user
  });

  // Fetch flight records
  const { data: flightRecords = [], isLoading: flightRecordsLoading } = useQuery<any[]>({
    queryKey: ['/api/user/flight-records'],
    enabled: !!user
  });

  // Fetch activity history
  const { data: activityHistory = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ['/api/user/activity-history'],
    enabled: !!user
  });

  // Fetch user squadron
  const { data: userSquadron } = useQuery({
    queryKey: ['/api/user/squadron'],
    enabled: !!user
  });

  // Fetch readiness status
  const { data: readinessData } = useQuery<{ isFlightReady: boolean; notReadyReason: string | null; readinessUpdatedAt: string | null }>({
    queryKey: ['/api/user/readiness'],
    enabled: !!user
  });

  // Update readiness status mutation
  const updateReadinessMutation = useMutation({
    mutationFn: async (data: { isFlightReady: boolean; notReadyReason?: string }) => {
      return await apiRequest({
        url: '/api/user/readiness',
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/readiness'] });
      setShowReadinessConfirm(false);
      setSelectedNotReadyReason("");
      toast({ title: "Success", description: "Flight readiness status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update readiness status", variant: "destructive" });
    }
  });

  // Profile photo upload mutation
  const uploadProfilePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/user/profile-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({ title: "Success", description: "Profile photo updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload profile photo", variant: "destructive" });
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Image size must be less than 5MB", variant: "destructive" });
        return;
      }
      
      uploadProfilePhotoMutation.mutate(file);
    }
  };

  // Add qualification mutation
  const addQualificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest({
        url: '/api/user/qualifications',
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/qualifications'] });
      setShowAddQualification(false);
      setNewQualification({ name: "", customName: "", startDate: "", expiryDate: "", noEndDate: false });
      toast({ title: "Success", description: "Qualification added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add qualification", variant: "destructive" });
    }
  });

  // Update qualification mutation
  const updateQualificationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest({
        url: `/api/user/qualifications/${id}`,
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/qualifications'] });
      setEditingQualificationId(null);
      setEditingQualification(null);
      toast({ title: "Success", description: "Qualification updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update qualification", variant: "destructive" });
    }
  });

  // Delete qualification mutation
  const deleteQualificationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        url: `/api/user/qualifications/${id}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/qualifications'] });
      toast({ title: "Success", description: "Qualification removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete qualification", variant: "destructive" });
    }
  });

  // Add flight record mutation
  const addFlightMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest({
        url: '/api/user/flight-records',
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/flight-records'] });
      setShowAddFlight(false);
      setNewFlight({ date: "", callsign: "", departure: "", arrival: "", passengersCarried: 0, cargoWeight: 0, cargoWeightUnit: "kg", captain: "", nightHours: 0, dayHours: 0, aircraftType: "KC30A" });
      toast({ title: "Success", description: "Flight record added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add flight record", variant: "destructive" });
    }
  });

  // Update flight record mutation
  const updateFlightMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest({
        url: `/api/user/flight-records/${id}`,
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/flight-records'] });
      setEditingFlightId(null);
      setEditingFlight(null);
      toast({ title: "Success", description: "Flight record updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update flight record", variant: "destructive" });
    }
  });

  // Delete flight record mutation
  const deleteFlightMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        url: `/api/user/flight-records/${id}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/flight-records'] });
      toast({ title: "Success", description: "Flight record deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete flight record", variant: "destructive" });
    }
  });

  // Update squadron mutation
  const updateSquadronMutation = useMutation({
    mutationFn: async (squadron: string) => {
      return await apiRequest({
        url: '/api/user/squadron',
        method: 'PUT',
        body: { squadron }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/squadron'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({ title: "Success", description: "Squadron updated successfully" });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: string) => {
      return await apiRequest({
        url: '/api/user/category',
        method: 'PUT',
        body: { category }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditingStats(false);
      toast({ title: "Success", description: "Stats updated successfully" });
    },
  });

  // Update user stats mutation
  const updateStatsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest({
        url: '/api/user/stats',
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditingStats(false);
      toast({ title: "Success", description: "Stats updated successfully" });
    },
  });

  const handleAddQualification = () => {
    if (!newQualification.name || !newQualification.startDate) {
      toast({ title: "Error", description: "Qualification type and start date are required", variant: "destructive" });
      return;
    }
    if (newQualification.name === "Other" && !newQualification.customName) {
      toast({ title: "Error", description: "Please enter a custom qualification name", variant: "destructive" });
      return;
    }
    if (!newQualification.noEndDate && !newQualification.expiryDate) {
      toast({ title: "Error", description: "Please provide an expiry date or select 'No End Date'", variant: "destructive" });
      return;
    }
    const qualificationName = newQualification.name === "Other" 
      ? newQualification.customName 
      : newQualification.name;
    addQualificationMutation.mutate({
      name: qualificationName,
      startDate: new Date(newQualification.startDate),
      expiryDate: newQualification.noEndDate ? null : new Date(newQualification.expiryDate),
    });
  };

  const handleAddFlight = () => {
    if (!newFlight.date || !newFlight.departure || !newFlight.arrival || !newFlight.captain) {
      toast({ title: "Error", description: "All required fields must be filled", variant: "destructive" });
      return;
    }
    
    // Convert lbs to kg if needed (1 lb = 0.453592 kg)
    // Round to nearest integer for database storage
    const cargoWeightInKg = newFlight.cargoWeightUnit === "lbs" 
      ? Math.round(newFlight.cargoWeight * 0.453592)
      : newFlight.cargoWeight;
    
    addFlightMutation.mutate({
      date: new Date(newFlight.date),
      callsign: newFlight.callsign || null,
      departure: newFlight.departure,
      arrival: newFlight.arrival,
      passengersCarried: newFlight.passengersCarried,
      cargoWeight: cargoWeightInKg,
      captain: newFlight.captain,
      nightHours: newFlight.nightHours,
      dayHours: newFlight.dayHours,
      aircraftType: newFlight.aircraftType,
    });
  };

  const handleStartEditStats = () => {
    setEditedStats({
      squadron: (userSquadron as any)?.squadron || "AMG",
      category: (profileData as any)?.user?.category || "D",
    });
    setIsEditingStats(true);
  };

  const handleSaveStats = () => {
    updateSquadronMutation.mutate(editedStats.squadron);
    updateCategoryMutation.mutate(editedStats.category);
  };

  // Calculate flight statistics from flight records
  const flightStats = flightRecords.reduce((acc, flight) => {
    return {
      totalFlightHours: acc.totalFlightHours + (flight.nightHours || 0) + (flight.dayHours || 0),
      totalCargo: acc.totalCargo + (flight.cargoWeight || 0),
      totalPassengers: acc.totalPassengers + (flight.passengersCarried || 0),
      totalNightHours: acc.totalNightHours + (flight.nightHours || 0),
      totalDayHours: acc.totalDayHours + (flight.dayHours || 0),
    };
  }, {
    totalFlightHours: 0,
    totalCargo: 0,
    totalPassengers: 0,
    totalNightHours: 0,
    totalDayHours: 0,
  });

  const isQualificationExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false; // No end date means not expiring
    const daysUntilExpiry = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0; // Changed from 30 to 90 days (3 months)
  };

  const isQualificationExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false; // No end date means not expired
    return new Date(expiryDate) < new Date();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
        <Card className="bg-[#2a2a2a] border-[#333333] p-8">
          <p className="text-gray-300">Please log in to view your profile.</p>
        </Card>
      </div>
    );
  }

  const userInfo = (profileData as any)?.user || user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button
              onClick={() => setLocation('/')}
              className="bg-[#2a2a2a] border border-[#444444] hover:bg-[#333333] text-gray-300"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome {user?.email}</h1>
              <p className="text-gray-400 mt-1">Manage your training and flight records</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Essential Info */}
          <Card className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-white">Essential Information</h2>
                </div>
                {!isEditingStats ? (
                  <Button
                    size="sm"
                    onClick={handleStartEditStats}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="button-edit-info"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleSaveStats}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-save-info"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingStats(false)}
                      className="bg-transparent border-[#444444] text-gray-300 hover:bg-[#2a2a2a]"
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Photo Section */}
              <div className="flex flex-col items-center space-y-4 pb-6 border-b border-[#444444]">
                <div className="relative">
                  {(profileData as any)?.user?.profilePhotoUrl ? (
                    <img 
                      src={(profileData as any).user.profilePhotoUrl} 
                      alt="Profile" 
                      style={{ width: '164px', height: '164px' }}
                      className="rounded-full object-cover border-4 border-[#444444]"
                    />
                  ) : (
                    <div 
                      style={{ width: '164px', height: '164px' }}
                      className="rounded-full bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a] border-4 border-[#444444] flex items-center justify-center"
                    >
                      <User className="w-20 h-20 text-gray-500" />
                    </div>
                  )}
                  <input
                    type="file"
                    id="profile-photo-upload"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-photo-upload"
                    className="absolute bottom-2 right-2 p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full cursor-pointer transition-colors shadow-lg"
                    data-testid="button-upload-photo"
                  >
                    {uploadProfilePhotoMutation.isPending ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </label>
                </div>
                <p className="text-gray-400 text-xs text-center">Click camera icon to upload or take photo</p>
              </div>

              {/* Flight Readiness Toggle */}
              <div className="pb-6 border-b border-[#444444]">
                <Label className="text-gray-400 text-sm block mb-3">Flight Readiness Status</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {readinessData?.isFlightReady ? (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-green-400 font-semibold">FLIGHT READY</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-400 font-semibold">NOT READY</span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (readinessData?.isFlightReady) {
                        setShowReadinessConfirm(true);
                      } else {
                        updateReadinessMutation.mutate({ isFlightReady: true });
                      }
                    }}
                    className={readinessData?.isFlightReady 
                      ? "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20" 
                      : "bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20"
                    }
                    disabled={updateReadinessMutation.isPending}
                    data-testid="button-toggle-readiness"
                  >
                    {updateReadinessMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : readinessData?.isFlightReady ? (
                      "Mark Not Ready"
                    ) : (
                      "Mark Ready"
                    )}
                  </Button>
                </div>
                {!readinessData?.isFlightReady && readinessData?.notReadyReason && (
                  <p className="mt-2 text-sm text-gray-400">
                    Reason: <span className="text-red-400">{readinessData.notReadyReason}</span>
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-400 text-sm">Email</Label>
                  <p className="text-white font-medium">{userInfo.email}</p>
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Squadron</Label>
                  {isEditingStats ? (
                    <Select value={editedStats.squadron} onValueChange={(v) => setEditedStats({ ...editedStats, squadron: v })}>
                      <SelectTrigger className="bg-[#1a1a1a] border-[#444444] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="33SQN">33 Squadron</SelectItem>
                        <SelectItem value="35SQN">35 Squadron</SelectItem>
                        <SelectItem value="36SQN">36 Squadron</SelectItem>
                        <SelectItem value="37SQN">37 Squadron</SelectItem>
                        <SelectItem value="AMG">AMG</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white font-medium">{(userSquadron as any)?.squadron || 'AMG'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Category</Label>
                  {isEditingStats ? (
                    <Select value={editedStats.category} onValueChange={(v) => setEditedStats({ ...editedStats, category: v })}>
                      <SelectTrigger className="bg-[#1a1a1a] border-[#444444] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A Category</SelectItem>
                        <SelectItem value="B">B Category</SelectItem>
                        <SelectItem value="C">C Category</SelectItem>
                        <SelectItem value="D">D Category</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white font-medium">{userInfo.category || 'D'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Total Missions Flown</Label>
                  <p className="text-white font-medium">{flightRecords.length}</p>
                  <p className="text-gray-500 text-xs mt-1">Auto-calculated from flight records</p>
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Total Cargo Weight (kg)</Label>
                  <p className="text-white font-medium">{flightStats.totalCargo.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs mt-1">Auto-calculated from flight records</p>
                </div>

                {/* Divider */}
                <div className="border-t border-[#444444] my-4"></div>

                {/* Flight Statistics Header */}
                <div className="flex items-center space-x-2 mb-3">
                  <Plane className="w-4 h-4 text-orange-500" />
                  <h3 className="text-lg font-semibold text-white">Flight Statistics</h3>
                </div>

                {/* Flight Statistics */}
                <div>
                  <Label className="text-gray-400 text-sm">Total Flight Hours</Label>
                  <p className="text-white font-medium text-lg">{flightStats.totalFlightHours.toFixed(1)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 text-sm">Night Hours</Label>
                    <p className="text-white font-medium">{flightStats.totalNightHours.toFixed(1)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Day Hours</Label>
                    <p className="text-white font-medium">{flightStats.totalDayHours.toFixed(1)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Total Cargo Carried (kg)</Label>
                  <p className="text-white font-medium">{flightStats.totalCargo.toLocaleString()}</p>
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Total Passengers Carried</Label>
                  <p className="text-white font-medium">{flightStats.totalPassengers.toLocaleString()}</p>
                </div>

                <div className="border-t border-[#444444] my-4"></div>

                <div>
                  <Label className="text-gray-400 text-sm">Role</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userInfo.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400' :
                      userInfo.role === 'instructor' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {userInfo.role === 'superadmin' ? 'Super Admin' : 
                       userInfo.role === 'instructor' ? 'Instructor' : 'Loadmaster'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="qualifications" className="w-full">
              <TabsList className="bg-[#2a2a2a] border border-[#444444] w-full grid grid-cols-3">
                <TabsTrigger 
                  value="qualifications" 
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
                  data-testid="tab-qualifications"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Qualifications
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
                  data-testid="tab-activity"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Activity History
                </TabsTrigger>
                <TabsTrigger 
                  value="flights" 
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
                  data-testid="tab-flights"
                >
                  <Plane className="w-4 h-4 mr-2" />
                  Flight Records
                </TabsTrigger>
              </TabsList>

              {/* Qualifications Tab */}
              <TabsContent value="qualifications" className="mt-4">
                <Card className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white">Training Currencies</h2>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/user/qualifications'] })}
                          className="bg-[#2a2a2a] hover:bg-[#333333] text-white border border-[#444444]"
                          size="sm"
                          data-testid="button-refresh-qualifications"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setShowAddQualification(true)}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          data-testid="button-add-qualification"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Qualification
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {qualificationsLoading ? (
                        <p className="text-gray-400">Loading qualifications...</p>
                      ) : qualifications.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No qualifications added yet</p>
                      ) : (
                        [...qualifications]
                          .sort((a: any, b: any) => {
                            // Sort by priority: expiring soon > expired > current > no expiry
                            const aExpiringSoon = isQualificationExpiringSoon(a.expiryDate);
                            const bExpiringSoon = isQualificationExpiringSoon(b.expiryDate);
                            const aExpired = isQualificationExpired(a.expiryDate);
                            const bExpired = isQualificationExpired(b.expiryDate);
                            
                            if (aExpiringSoon && !bExpiringSoon) return -1;
                            if (!aExpiringSoon && bExpiringSoon) return 1;
                            if (aExpired && !bExpired) return -1;
                            if (!aExpired && bExpired) return 1;
                            
                            // If same status, sort by expiry date (nulls last)
                            if (!a.expiryDate) return 1;
                            if (!b.expiryDate) return -1;
                            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                          })
                          .map((qual: any) => (
                          <div
                            key={qual.id}
                            className={`bg-[#1a1a1a] border ${
                              isQualificationExpired(qual.expiryDate) ? 'border-red-500/50' :
                              isQualificationExpiringSoon(qual.expiryDate) ? 'border-yellow-500/50' :
                              'border-[#444444]'
                            } rounded-lg p-4`}
                            data-testid={`qualification-${qual.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-white font-medium">{qual.name}</h3>
                                <p className="text-gray-400 text-sm mt-1">
                                  Started: {new Date(qual.startDate).toLocaleDateString()} • 
                                  {qual.expiryDate ? `Expires: ${new Date(qual.expiryDate).toLocaleDateString()}` : 'No Expiry'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {qual.expiryDate ? (
                                  <>
                                    {isQualificationExpired(qual.expiryDate) ? (
                                      <div className="flex items-center space-x-1 text-red-400 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Expired</span>
                                      </div>
                                    ) : isQualificationExpiringSoon(qual.expiryDate) ? (
                                      <div className="flex items-center space-x-1 text-yellow-400 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Expiring Soon</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1 text-green-400 text-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Current</span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center space-x-1 text-blue-400 text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>No Expiry</span>
                                  </div>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingQualificationId(qual.id);
                                    setEditingQualification({
                                      name: qual.name,
                                      startDate: new Date(qual.startDate).toISOString().split('T')[0],
                                      expiryDate: qual.expiryDate ? new Date(qual.expiryDate).toISOString().split('T')[0] : "",
                                      noEndDate: !qual.expiryDate,
                                    });
                                  }}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  data-testid={`button-edit-qualification-${qual.id}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteQualificationMutation.mutate(qual.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  data-testid={`button-delete-qualification-${qual.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Activity History Tab */}
              <TabsContent value="activity" className="mt-4">
                <Card className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white">Platform Activity</h2>
                      <Button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/user/activity-history'] })}
                        className="bg-[#2a2a2a] hover:bg-[#333333] text-white border border-[#444444]"
                        size="sm"
                        data-testid="button-refresh-activity"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {activityLoading ? (
                        <p className="text-gray-400">Loading activity history...</p>
                      ) : activityHistory.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No activity recorded yet</p>
                      ) : (
                        activityHistory.map((activity: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-[#1a1a1a] border border-[#444444] rounded-lg p-4"
                            data-testid={`activity-${idx}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-white font-medium">{activity.title}</h3>
                                <p className="text-gray-400 text-sm mt-1">
                                  {activity.type} • {new Date(activity.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                activity.passed === true ? 'bg-green-500/20 text-green-400' :
                                activity.passed === false ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {activity.passed === true ? 'Passed' : 
                                 activity.passed === false ? 'Failed' : 'Pending'}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Flight Records Tab */}
              <TabsContent value="flights" className="mt-4">
                <Card className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white">Flight Records</h2>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/user/flight-records'] })}
                          className="bg-[#2a2a2a] hover:bg-[#333333] text-white border border-[#444444]"
                          size="sm"
                          data-testid="button-refresh-flights"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setShowAddFlight(true)}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          data-testid="button-add-flight"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Flight
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {flightRecordsLoading ? (
                        <p className="text-gray-400">Loading flight records...</p>
                      ) : flightRecords.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No flight records added yet</p>
                      ) : (
                        flightRecords.map((flight: any) => (
                          <div
                            key={flight.id}
                            className="bg-[#1a1a1a] border border-[#444444] rounded-lg p-4"
                            data-testid={`flight-${flight.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-gray-400 text-sm">Route</p>
                                  <p className="text-white font-medium">{flight.departure} → {flight.arrival}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">Date</p>
                                  <p className="text-white font-medium">{new Date(flight.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">Captain</p>
                                  <p className="text-white font-medium">{flight.captain}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">Cargo / Passengers</p>
                                  <p className="text-white font-medium">{flight.cargoWeight}kg / {flight.passengersCarried} pax</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingFlightId(flight.id);
                                    setEditingFlight({
                                      date: new Date(flight.date).toISOString().split('T')[0],
                                      callsign: flight.callsign || "",
                                      departure: flight.departure,
                                      arrival: flight.arrival,
                                      captain: flight.captain,
                                      passengersCarried: flight.passengersCarried,
                                      cargoWeight: flight.cargoWeight,
                                      cargoWeightUnit: "kg",
                                      nightHours: flight.nightHours || 0,
                                      dayHours: flight.dayHours || 0,
                                    });
                                  }}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  data-testid={`button-edit-flight-${flight.id}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteFlightMutation.mutate(flight.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  data-testid={`button-delete-flight-${flight.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add Qualification Dialog */}
      <Dialog open={showAddQualification} onOpenChange={setShowAddQualification}>
        <DialogContent className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Qualification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Qualification Type</Label>
              <Select 
                value={newQualification.name} 
                onValueChange={(value) => setNewQualification({ ...newQualification, name: value })}
              >
                <SelectTrigger className="bg-[#1a1a1a] border-[#444444] text-white" data-testid="select-qualification-type">
                  <SelectValue placeholder="Select qualification type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-[#333333]">
                  <SelectItem value="Basic Loadmaster" className="text-white hover:bg-[#333333]">Basic Loadmaster</SelectItem>
                  <SelectItem value="KC30A Type Rating" className="text-white hover:bg-[#333333]">KC30A Type Rating</SelectItem>
                  <SelectItem value="C-17A Type Rating" className="text-white hover:bg-[#333333]">C-17A Type Rating</SelectItem>
                  <SelectItem value="C-130J Type Rating" className="text-white hover:bg-[#333333]">C-130J Type Rating</SelectItem>
                  <SelectItem value="Night Ops Currency" className="text-white hover:bg-[#333333]">Night Ops Currency</SelectItem>
                  <SelectItem value="DG Handling" className="text-white hover:bg-[#333333]">DG Handling (Dangerous Goods)</SelectItem>
                  <SelectItem value="AAR Qualified" className="text-white hover:bg-[#333333]">AAR Qualified (Air-to-Air Refueling)</SelectItem>
                  <SelectItem value="Aeromedical" className="text-white hover:bg-[#333333]">Aeromedical Evacuation</SelectItem>
                  <SelectItem value="Combat Readiness" className="text-white hover:bg-[#333333]">Combat Readiness</SelectItem>
                  <SelectItem value="Annual Proficiency Check" className="text-white hover:bg-[#333333]">Annual Proficiency Check</SelectItem>
                  <SelectItem value="Other" className="text-white hover:bg-[#333333]">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newQualification.name === "Other" && (
              <div>
                <Label className="text-gray-300">Custom Qualification Name</Label>
                <Input
                  value={newQualification.customName || ""}
                  onChange={(e) => setNewQualification({ ...newQualification, customName: e.target.value })}
                  placeholder="Enter custom qualification name"
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-custom-qualification-name"
                />
              </div>
            )}
            <div>
              <Label className="text-gray-300">Start Date</Label>
              <Input
                type="date"
                value={newQualification.startDate}
                onChange={(e) => setNewQualification({ ...newQualification, startDate: e.target.value })}
                className="bg-[#1a1a1a] border-[#444444] text-white"
                data-testid="input-qualification-start"
              />
            </div>
            <div>
              <Label className="text-gray-300">Expiry Date</Label>
              <Input
                type="date"
                value={newQualification.expiryDate}
                onChange={(e) => setNewQualification({ ...newQualification, expiryDate: e.target.value })}
                className="bg-[#1a1a1a] border-[#444444] text-white"
                data-testid="input-qualification-expiry"
                disabled={newQualification.noEndDate}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-end-date"
                checked={newQualification.noEndDate}
                onCheckedChange={(checked) => setNewQualification({ ...newQualification, noEndDate: checked as boolean, expiryDate: checked ? "" : newQualification.expiryDate })}
                className="border-[#444444] data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                data-testid="checkbox-no-end-date"
              />
              <label
                htmlFor="no-end-date"
                className="text-sm text-gray-300 cursor-pointer select-none"
              >
                No End Date
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddQualification(false)}
                className="bg-transparent border-[#444444] text-gray-300 hover:bg-[#2a2a2a]"
                data-testid="button-cancel-qualification"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddQualification}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={addQualificationMutation.isPending}
                data-testid="button-submit-qualification"
              >
                {addQualificationMutation.isPending ? 'Adding...' : 'Add Qualification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Flight Dialog */}
      <Dialog open={showAddFlight} onOpenChange={setShowAddFlight}>
        <DialogContent className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Flight Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Date</Label>
                <Input
                  type="date"
                  value={newFlight.date}
                  onChange={(e) => setNewFlight({ ...newFlight, date: e.target.value })}
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-flight-date"
                />
              </div>
              <div>
                <Label className="text-gray-300">Flight Callsign</Label>
                <Input
                  value={newFlight.callsign}
                  onChange={(e) => setNewFlight({ ...newFlight, callsign: e.target.value })}
                  placeholder="e.g., ASY123"
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-flight-callsign"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Departure</Label>
                <Input
                  value={newFlight.departure}
                  onChange={(e) => setNewFlight({ ...newFlight, departure: e.target.value })}
                  placeholder="e.g., RAAF Base Richmond"
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-flight-departure"
                />
              </div>
              <div>
                <Label className="text-gray-300">Arrival</Label>
                <Input
                  value={newFlight.arrival}
                  onChange={(e) => setNewFlight({ ...newFlight, arrival: e.target.value })}
                  placeholder="e.g., RAAF Base Amberley"
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-flight-arrival"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Captain</Label>
                <Input
                  value={newFlight.captain}
                  onChange={(e) => setNewFlight({ ...newFlight, captain: e.target.value })}
                  placeholder="Captain's name"
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-flight-captain"
                />
              </div>
              <div>
                <Label className="text-gray-300">Aircraft Type</Label>
                <Select 
                  value={newFlight.aircraftType} 
                  onValueChange={(value) => setNewFlight({ ...newFlight, aircraftType: value })}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-[#444444] text-white" data-testid="select-aircraft-type">
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-[#333333]">
                    <SelectItem value="KC30A" className="text-white hover:bg-[#333333]">KC30A</SelectItem>
                    <SelectItem value="C-17A" className="text-white hover:bg-[#333333]">C-17A</SelectItem>
                    <SelectItem value="C-130J" className="text-white hover:bg-[#333333]">C-130J</SelectItem>
                    <SelectItem value="C-27J" className="text-white hover:bg-[#333333]">C-27J</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Passengers</Label>
                <Input
                  type="number"
                  value={newFlight.passengersCarried}
                  onChange={(e) => setNewFlight({ ...newFlight, passengersCarried: parseInt(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-flight-passengers"
                />
              </div>
              <div>
                <Label className="text-gray-300">Cargo Weight</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newFlight.cargoWeight}
                    onChange={(e) => setNewFlight({ ...newFlight, cargoWeight: parseInt(e.target.value) || 0 })}
                    className="bg-[#1a1a1a] border-[#444444] text-white flex-1"
                    data-testid="input-flight-cargo"
                  />
                  <Select 
                    value={newFlight.cargoWeightUnit} 
                    onValueChange={(value) => setNewFlight({ ...newFlight, cargoWeightUnit: value })}
                  >
                    <SelectTrigger 
                      className="bg-[#1a1a1a] border-[#444444] text-white w-24"
                      data-testid="select-cargo-unit"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Night Hours</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newFlight.nightHours}
                  onChange={(e) => setNewFlight({ ...newFlight, nightHours: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-flight-night-hours"
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label className="text-gray-300">Day Hours</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newFlight.dayHours}
                  onChange={(e) => setNewFlight({ ...newFlight, dayHours: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-flight-day-hours"
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddFlight(false)}
                className="bg-transparent border-[#444444] text-gray-300 hover:bg-[#2a2a2a]"
                data-testid="button-cancel-flight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFlight}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={addFlightMutation.isPending}
                data-testid="button-submit-flight"
              >
                {addFlightMutation.isPending ? 'Adding...' : 'Add Flight'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Qualification Dialog */}
      <Dialog open={editingQualificationId !== null} onOpenChange={() => {
        setEditingQualificationId(null);
        setEditingQualification(null);
      }}>
        <DialogContent className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Qualification</DialogTitle>
          </DialogHeader>
          {editingQualification && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Qualification Name</Label>
                <Input
                  value={editingQualification.name}
                  onChange={(e) => setEditingQualification({ ...editingQualification, name: e.target.value })}
                  placeholder="e.g., C-17 Loadmaster Qual"
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-edit-qual-name"
                />
              </div>
              <div>
                <Label className="text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={editingQualification.startDate}
                  onChange={(e) => setEditingQualification({ ...editingQualification, startDate: e.target.value })}
                  className="bg-[#1a1a1a] border-[#444444] text-white"
                  data-testid="input-edit-qual-start-date"
                />
              </div>
              {!editingQualification.noEndDate && (
                <div>
                  <Label className="text-gray-300">Expiry Date</Label>
                  <Input
                    type="date"
                    value={editingQualification.expiryDate}
                    onChange={(e) => setEditingQualification({ ...editingQualification, expiryDate: e.target.value })}
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-qual-expiry-date"
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-no-end-date"
                  checked={editingQualification.noEndDate}
                  onCheckedChange={(checked) => setEditingQualification({ ...editingQualification, noEndDate: checked as boolean, expiryDate: checked ? "" : editingQualification.expiryDate })}
                  className="border-[#444444] data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  data-testid="checkbox-edit-no-end-date"
                />
                <label
                  htmlFor="edit-no-end-date"
                  className="text-sm text-gray-300 cursor-pointer select-none"
                >
                  No End Date
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingQualificationId(null);
                    setEditingQualification(null);
                  }}
                  className="bg-transparent border-[#444444] text-gray-300 hover:bg-[#2a2a2a]"
                  data-testid="button-cancel-edit-qualification"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingQualificationId && editingQualification.startDate) {
                      const dataToUpdate = {
                        name: editingQualification.name,
                        startDate: new Date(editingQualification.startDate),
                        expiryDate: editingQualification.noEndDate ? null : (editingQualification.expiryDate ? new Date(editingQualification.expiryDate) : null),
                      };
                      updateQualificationMutation.mutate({ id: editingQualificationId, data: dataToUpdate });
                    }
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={updateQualificationMutation.isPending}
                  data-testid="button-submit-edit-qualification"
                >
                  {updateQualificationMutation.isPending ? 'Updating...' : 'Update Qualification'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Flight Dialog */}
      <Dialog open={editingFlightId !== null} onOpenChange={() => {
        setEditingFlightId(null);
        setEditingFlight(null);
      }}>
        <DialogContent className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Flight Record</DialogTitle>
          </DialogHeader>
          {editingFlight && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Date</Label>
                  <Input
                    type="date"
                    value={editingFlight.date}
                    onChange={(e) => setEditingFlight({ ...editingFlight, date: e.target.value })}
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-flight-date"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Flight Callsign</Label>
                  <Input
                    value={editingFlight.callsign}
                    onChange={(e) => setEditingFlight({ ...editingFlight, callsign: e.target.value })}
                    placeholder="e.g., ASY123"
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-flight-callsign"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Departure</Label>
                  <Input
                    value={editingFlight.departure}
                    onChange={(e) => setEditingFlight({ ...editingFlight, departure: e.target.value })}
                    placeholder="e.g., RAAF Base Richmond"
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-flight-departure"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Arrival</Label>
                  <Input
                    value={editingFlight.arrival}
                    onChange={(e) => setEditingFlight({ ...editingFlight, arrival: e.target.value })}
                    placeholder="e.g., RAAF Base Amberley"
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-flight-arrival"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Captain</Label>
                  <Input
                    value={editingFlight.captain}
                    onChange={(e) => setEditingFlight({ ...editingFlight, captain: e.target.value })}
                    placeholder="Captain's name"
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-flight-captain"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Aircraft Type</Label>
                  <Select 
                    value={editingFlight.aircraftType || "KC30A"} 
                    onValueChange={(value) => setEditingFlight({ ...editingFlight, aircraftType: value })}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-[#444444] text-white" data-testid="select-edit-aircraft-type">
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-[#333333]">
                      <SelectItem value="KC30A" className="text-white hover:bg-[#333333]">KC30A</SelectItem>
                      <SelectItem value="C-17A" className="text-white hover:bg-[#333333]">C-17A</SelectItem>
                      <SelectItem value="C-130J" className="text-white hover:bg-[#333333]">C-130J</SelectItem>
                      <SelectItem value="C-27J" className="text-white hover:bg-[#333333]">C-27J</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Passengers</Label>
                  <Input
                    type="number"
                    value={editingFlight.passengersCarried}
                    onChange={(e) => setEditingFlight({ ...editingFlight, passengersCarried: parseInt(e.target.value) || 0 })}
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-flight-passengers"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Cargo Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editingFlight.cargoWeight}
                      onChange={(e) => setEditingFlight({ ...editingFlight, cargoWeight: parseInt(e.target.value) || 0 })}
                      className="bg-[#1a1a1a] border-[#444444] text-white flex-1"
                      data-testid="input-edit-flight-cargo"
                    />
                    <Select 
                      value={editingFlight.cargoWeightUnit} 
                      onValueChange={(value) => setEditingFlight({ ...editingFlight, cargoWeightUnit: value })}
                    >
                      <SelectTrigger 
                        className="bg-[#1a1a1a] border-[#444444] text-white w-24"
                        data-testid="select-edit-cargo-unit"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Night Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingFlight.nightHours}
                    onChange={(e) => setEditingFlight({ ...editingFlight, nightHours: parseFloat(e.target.value) || 0 })}
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-flight-night-hours"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Day Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingFlight.dayHours}
                    onChange={(e) => setEditingFlight({ ...editingFlight, dayHours: parseFloat(e.target.value) || 0 })}
                    className="bg-[#1a1a1a] border-[#444444] text-white"
                    data-testid="input-edit-flight-day-hours"
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingFlightId(null);
                    setEditingFlight(null);
                  }}
                  className="bg-transparent border-[#444444] text-gray-300 hover:bg-[#2a2a2a]"
                  data-testid="button-cancel-edit-flight"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingFlightId && editingFlight.date) {
                      let cargoWeightInKg = editingFlight.cargoWeight;
                      if (editingFlight.cargoWeightUnit === "lbs") {
                        cargoWeightInKg = Math.round(editingFlight.cargoWeight * 0.453592);
                      }
                      const dataToUpdate = {
                        date: new Date(editingFlight.date),
                        callsign: editingFlight.callsign,
                        departure: editingFlight.departure,
                        arrival: editingFlight.arrival,
                        captain: editingFlight.captain,
                        passengersCarried: editingFlight.passengersCarried,
                        cargoWeight: cargoWeightInKg,
                        nightHours: editingFlight.nightHours,
                        dayHours: editingFlight.dayHours,
                        aircraftType: editingFlight.aircraftType || "KC30A",
                      };
                      updateFlightMutation.mutate({ id: editingFlightId, data: dataToUpdate });
                    }
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={updateFlightMutation.isPending}
                  data-testid="button-submit-edit-flight"
                >
                  {updateFlightMutation.isPending ? 'Updating...' : 'Update Flight'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Readiness Confirmation Dialog */}
      <Dialog open={showReadinessConfirm} onOpenChange={setShowReadinessConfirm}>
        <DialogContent className="bg-[#2a2a2a] border-[#333333] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span>Mark as Not Flight Ready?</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-300">
              You are about to change your status to "Not Flight Ready". Please select a reason:
            </p>
            <Select value={selectedNotReadyReason} onValueChange={setSelectedNotReadyReason}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#444444] text-white" data-testid="select-not-ready-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-[#333333]">
                <SelectItem value="Medical" className="text-white hover:bg-[#333333]">Medical</SelectItem>
                <SelectItem value="Leave/Personal" className="text-white hover:bg-[#333333]">Leave/Personal</SelectItem>
                <SelectItem value="Currency Lapsed" className="text-white hover:bg-[#333333]">Currency Lapsed</SelectItem>
                <SelectItem value="Training Required" className="text-white hover:bg-[#333333]">Training Required</SelectItem>
                <SelectItem value="Administrative" className="text-white hover:bg-[#333333]">Administrative</SelectItem>
                <SelectItem value="Other" className="text-white hover:bg-[#333333]">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReadinessConfirm(false);
                  setSelectedNotReadyReason("");
                }}
                className="bg-transparent border-[#444444] text-gray-300 hover:bg-[#333333]"
                data-testid="button-cancel-readiness"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedNotReadyReason) {
                    updateReadinessMutation.mutate({
                      isFlightReady: false,
                      notReadyReason: selectedNotReadyReason
                    });
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={!selectedNotReadyReason || updateReadinessMutation.isPending}
                data-testid="button-confirm-not-ready"
              >
                {updateReadinessMutation.isPending ? 'Updating...' : 'Confirm Not Ready'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
