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
import { ArrowLeft, User, Award, Plane, Calendar, Plus, Trash2, Edit2, Save, X, AlertCircle, CheckCircle2 } from "lucide-react";
import logoImage from "@assets/DDG_Logo_New_1762131149453.png";

export default function UserProfile() {
  const { user } = useIsolatedAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for adding qualifications
  const [showAddQualification, setShowAddQualification] = useState(false);
  const [newQualification, setNewQualification] = useState({
    name: "",
    startDate: "",
    expiryDate: "",
  });

  // State for adding flight records
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [newFlight, setNewFlight] = useState({
    date: "",
    departure: "",
    arrival: "",
    passengersCarried: 0,
    cargoWeight: 0,
    cargoWeightUnit: "kg",
    captain: "",
  });

  // State for editing user stats
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editedStats, setEditedStats] = useState({
    squadron: "",
    category: "",
    totalMissionsFlown: 0,
    totalCargoWeight: 0,
  });

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
      setNewQualification({ name: "", startDate: "", expiryDate: "" });
      toast({ title: "Success", description: "Qualification added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add qualification", variant: "destructive" });
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
      setNewFlight({ date: "", departure: "", arrival: "", passengersCarried: 0, cargoWeight: 0, cargoWeightUnit: "kg", captain: "" });
      toast({ title: "Success", description: "Flight record added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add flight record", variant: "destructive" });
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
      toast({ title: "Success", description: "Category updated successfully" });
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
    if (!newQualification.name || !newQualification.startDate || !newQualification.expiryDate) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    addQualificationMutation.mutate({
      name: newQualification.name,
      startDate: new Date(newQualification.startDate),
      expiryDate: new Date(newQualification.expiryDate),
    });
  };

  const handleAddFlight = () => {
    if (!newFlight.date || !newFlight.departure || !newFlight.arrival || !newFlight.captain) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    
    // Convert lbs to kg if needed (1 lb = 0.453592 kg)
    // Round to 2 decimal places for precision while keeping reasonable storage size
    const cargoWeightInKg = newFlight.cargoWeightUnit === "lbs" 
      ? Math.round(newFlight.cargoWeight * 0.453592 * 100) / 100
      : newFlight.cargoWeight;
    
    addFlightMutation.mutate({
      date: new Date(newFlight.date),
      departure: newFlight.departure,
      arrival: newFlight.arrival,
      passengersCarried: newFlight.passengersCarried,
      cargoWeight: cargoWeightInKg,
      captain: newFlight.captain,
    });
  };

  const handleStartEditStats = () => {
    setEditedStats({
      squadron: (userSquadron as any)?.squadron || "AMG",
      category: (profileData as any)?.user?.category || "D",
      totalMissionsFlown: (profileData as any)?.user?.totalMissionsFlown || 0,
      totalCargoWeight: (profileData as any)?.user?.totalCargoWeight || 0,
    });
    setIsEditingStats(true);
  };

  const handleSaveStats = () => {
    updateSquadronMutation.mutate(editedStats.squadron);
    updateCategoryMutation.mutate(editedStats.category);
    updateStatsMutation.mutate({
      totalMissionsFlown: editedStats.totalMissionsFlown,
      totalCargoWeight: editedStats.totalCargoWeight,
    });
  };

  const isQualificationExpiringSoon = (expiryDate: string) => {
    const daysUntilExpiry = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isQualificationExpired = (expiryDate: string) => {
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
            <div className="flex items-center space-x-4">
              <img src={logoImage} alt="DDG" className="h-12 w-auto" />
              <div>
                <h1 className="text-3xl font-bold text-white">User Profile</h1>
                <p className="text-gray-400 mt-1">Manage your training and flight records</p>
              </div>
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
                  {isEditingStats ? (
                    <Input
                      type="number"
                      value={editedStats.totalMissionsFlown}
                      onChange={(e) => setEditedStats({ ...editedStats, totalMissionsFlown: parseInt(e.target.value) || 0 })}
                      className="bg-[#1a1a1a] border-[#444444] text-white"
                      data-testid="input-total-missions"
                    />
                  ) : (
                    <p className="text-white font-medium">{userInfo.totalMissionsFlown || 0}</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Total Cargo Weight (kg)</Label>
                  {isEditingStats ? (
                    <Input
                      type="number"
                      value={editedStats.totalCargoWeight}
                      onChange={(e) => setEditedStats({ ...editedStats, totalCargoWeight: parseInt(e.target.value) || 0 })}
                      className="bg-[#1a1a1a] border-[#444444] text-white"
                      data-testid="input-total-cargo"
                    />
                  ) : (
                    <p className="text-white font-medium">{userInfo.totalCargoWeight?.toLocaleString() || 0}</p>
                  )}
                </div>

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
                      <Button
                        onClick={() => setShowAddQualification(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        data-testid="button-add-qualification"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Qualification
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {qualificationsLoading ? (
                        <p className="text-gray-400">Loading qualifications...</p>
                      ) : qualifications.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No qualifications added yet</p>
                      ) : (
                        qualifications.map((qual: any) => (
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
                                  Expires: {new Date(qual.expiryDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
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
                    <h2 className="text-xl font-bold text-white">Platform Activity</h2>
                    
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
                      <Button
                        onClick={() => setShowAddFlight(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        data-testid="button-add-flight"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Flight
                      </Button>
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
              <Label className="text-gray-300">Qualification Name</Label>
              <Input
                value={newQualification.name}
                onChange={(e) => setNewQualification({ ...newQualification, name: e.target.value })}
                placeholder="e.g., C-17 Loadmaster Qual"
                className="bg-[#1a1a1a] border-[#444444] text-white"
                data-testid="input-qualification-name"
              />
            </div>
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
              />
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
    </div>
  );
}
