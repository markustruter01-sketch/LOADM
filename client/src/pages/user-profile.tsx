import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, Shield, Mail, Key, Settings, Award, TrendingUp, Clock, Target, BookOpen, Users, AlertTriangle, CheckCircle, XCircle, Hourglass, Flame, Zap } from "lucide-react";
import { useIsolatedAuth } from "../auth-isolated/auth-context";
import { useQuery } from "@tanstack/react-query";

export default function UserProfile() {
  const { user, logout } = useIsolatedAuth();

  // Fetch user profile data including submissions and progress
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading profile data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-600 text-white';
      case 'instructor':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-green-600 text-white';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Administrator';
      case 'instructor':
        return 'Instructor';
      case 'loadmaster':
        return 'Loadmaster';
      default:
        return 'User';
    }
  };

  // Extract data from profileData or use defaults
  const userInfo = profileData?.user || user;
  const stats = profileData?.stats || { 
    totalSubmissions: 0, 
    passedSubmissions: 0, 
    failedSubmissions: 0, 
    pendingGrading: 0, 
    overallPassRate: 0, 
    currentStreak: 0, 
    longestStreak: 0, 
    weeksSinceLastActivity: 0 
  };
  const submissions = profileData?.submissions || [];
  const submissionsByType = profileData?.submissionsByType || { scenarios: [], quizzes: [], assessments: [] };
  const trainingModules = profileData?.trainingModules || [];
  const gamification = profileData?.gamification || { 
    weeklyGoal: 1, 
    streakData: { current: 0, longest: 0, weeksSinceLastActivity: 0, streakAtRisk: false },
    thisWeekActivity: 0,
    achievements: {}
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account information and track your progress</p>
        </div>
      </div>

      <Separator />

      {/* Weekly Goal & Streak Status */}
      {gamification.streakData.streakAtRisk && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Streak at Risk!</p>
                <p className="text-sm text-orange-600">
                  Complete at least one activity this week to maintain your {stats.currentStreak}-week streak.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.overallPassRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${gamification.streakData.streakAtRisk ? 'border-orange-200' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly Streak</p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold">{stats.longestStreak}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold">{gamification.thisWeekActivity}</p>
                  <span className="text-sm text-muted-foreground">/{gamification.weeklyGoal}</span>
                </div>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Account Info & Training Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email:</span>
                  </div>
                  <span className="text-sm">{userInfo.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Role:</span>
                  </div>
                  <Badge className={getRoleBadgeColor(userInfo.role || user.role)}>
                    {getRoleDisplayName(userInfo.role || user.role)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">User ID:</span>
                  </div>
                  <span className="text-sm font-mono">{userInfo.id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Squadron:</span>
                  </div>
                  <span className="text-sm">{userInfo.squadron || 'AMG'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Service:</span>
                  </div>
                  <span className="text-sm">{userInfo.serviceBranch || 'Air Force'}</span>
                </div>

                {userInfo.licenseExpiry && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">License Expires:</span>
                    </div>
                    <span className="text-sm">
                      {new Date(userInfo.licenseExpiry).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Training Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Training Progress</span>
              </CardTitle>
              <CardDescription>Your progress across different aircraft types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trainingModules.map((module) => (
                <div key={module.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{module.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {module.aircraftType}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{module.progress}%</span>
                      {module.completed && (
                        <Award className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  <Progress value={module.progress} className="h-2" />
                  {module.completionDate && (
                    <p className="text-xs text-muted-foreground">
                      Completed: {new Date(module.completionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Detailed Activity History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Activity History</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{stats.passedSubmissions} Passed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>{stats.failedSubmissions} Failed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Hourglass className="w-4 h-4 text-yellow-600" />
                    <span>{stats.pendingGrading} Pending</span>
                  </div>
                </div>
              </CardTitle>
              <CardDescription>Your complete submission history across all activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenarios ({submissionsByType.scenarios.length})</TabsTrigger>
                  <TabsTrigger value="quizzes">Quizzes ({submissionsByType.quizzes.length})</TabsTrigger>
                  <TabsTrigger value="assessments">Assessments ({submissionsByType.assessments.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4 mt-4">
                  {submissions.slice(0, 10).map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          submission.passed === true ? 'bg-green-500' : 
                          submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{submission.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {submission.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submissionDate).toLocaleDateString()} at {new Date(submission.submissionDate).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.score > 0 && (
                          <span className="text-sm font-medium">{submission.score}%</span>
                        )}
                        <Badge variant={
                          submission.passed === true ? 'default' : 
                          submission.passed === false ? 'destructive' : 'secondary'
                        }>
                          {submission.passed === true ? 'Pass' : 
                           submission.passed === false ? 'Fail' : 'Pending Review'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {submissions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No submissions yet. Start training to see your progress here!
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="scenarios" className="space-y-4 mt-4">
                  {submissionsByType.scenarios.slice(0, 10).map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          submission.passed === true ? 'bg-green-500' : 
                          submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{submission.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submissionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.score > 0 && (
                          <span className="text-sm font-medium">{submission.score}%</span>
                        )}
                        <Badge variant={
                          submission.passed === true ? 'default' : 
                          submission.passed === false ? 'destructive' : 'secondary'
                        }>
                          {submission.passed === true ? 'Pass' : 
                           submission.passed === false ? 'Fail' : 'Pending Review'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {submissionsByType.scenarios.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No scenario submissions yet. Try the load planning scenarios!
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="quizzes" className="space-y-4 mt-4">
                  {submissionsByType.quizzes.slice(0, 10).map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          submission.passed === true ? 'bg-green-500' : 
                          submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{submission.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submissionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.score > 0 && (
                          <span className="text-sm font-medium">{submission.score}%</span>
                        )}
                        <Badge variant={
                          submission.passed === true ? 'default' : 
                          submission.passed === false ? 'destructive' : 'secondary'
                        }>
                          {submission.passed === true ? 'Pass' : 
                           submission.passed === false ? 'Fail' : 'Pending Review'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {submissionsByType.quizzes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No quiz submissions yet. Complete your weekly quiz to maintain your streak!
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="assessments" className="space-y-4 mt-4">
                  {submissionsByType.assessments.slice(0, 10).map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          submission.passed === true ? 'bg-green-500' : 
                          submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{submission.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submissionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.score > 0 && (
                          <span className="text-sm font-medium">{submission.score}%</span>
                        )}
                        <Badge variant={
                          submission.passed === true ? 'default' : 
                          submission.passed === false ? 'destructive' : 'secondary'
                        }>
                          {submission.passed === true ? 'Pass' : 
                           submission.passed === false ? 'Fail' : 'Pending Review'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {submissionsByType.assessments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No assessment submissions yet. Try the document-based assessments!
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Role Info */}
        <div className="space-y-6">
          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Account Actions</span>
              </CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // Future: Add change password functionality
                  alert('Password change functionality coming soon!');
                }}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Are you sure you want to log out?')) {
                    logout();
                  }
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </CardContent>
          </Card>

          {/* Role-specific Information */}
          {(userInfo.role || user.role) === 'superadmin' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Super Administrator Access</CardTitle>
                <CardDescription>You have full administrative privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    As a Super Administrator, you have access to all system features including:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-700 mt-2 space-y-1">
                    <li>License Management</li>
                    <li>User Permission Management</li>
                    <li>System Administration</li>
                    <li>Full Application Access</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {(userInfo.role || user.role) === 'instructor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Instructor Access</CardTitle>
                <CardDescription>You have instructor-level privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    As an Instructor, you have access to:
                  </p>
                  <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                    <li>Student Progress Monitoring</li>
                    <li>Scenario Management</li>
                    <li>Quiz Creation and Management</li>
                    <li>Teaching Resources</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements & Gamification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Achievements</span>
              </CardTitle>
              <CardDescription>Your training milestones and progress rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Weekly Goal Progress */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Weekly Goal</span>
                  </div>
                  <span className="text-xs text-blue-600">
                    {gamification.thisWeekActivity}/{gamification.weeklyGoal}
                  </span>
                </div>
                <Progress 
                  value={(gamification.thisWeekActivity / gamification.weeklyGoal) * 100} 
                  className="h-2" 
                />
                <p className="text-xs text-blue-600 mt-1">
                  {gamification.thisWeekActivity >= gamification.weeklyGoal 
                    ? "Goal completed this week! 🎉" 
                    : `${gamification.weeklyGoal - gamification.thisWeekActivity} more activity needed this week`}
                </p>
              </div>

              {/* Earned Achievements */}
              {gamification.achievements.firstSubmission && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 border border-green-200">
                  <Award className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">First Steps</p>
                    <p className="text-xs text-green-600">Completed your first submission</p>
                  </div>
                </div>
              )}

              {gamification.achievements.quickLearner && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Quick Learner</p>
                    <p className="text-xs text-yellow-600">Completed 10+ submissions</p>
                  </div>
                </div>
              )}

              {gamification.achievements.perfectionist && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-purple-50 border border-purple-200">
                  <Award className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Perfectionist</p>
                    <p className="text-xs text-purple-600">95%+ pass rate with 5+ submissions</p>
                  </div>
                </div>
              )}

              {gamification.achievements.weeklyWarrior && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-orange-50 border border-orange-200">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Weekly Warrior</p>
                    <p className="text-xs text-orange-600">4+ week streak maintained</p>
                  </div>
                </div>
              )}

              {gamification.achievements.monthlyMaster && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-red-50 border border-red-200">
                  <Flame className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Monthly Master</p>
                    <p className="text-xs text-red-600">12+ week streak achieved!</p>
                  </div>
                </div>
              )}

              {gamification.achievements.consistent && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-indigo-800">Consistency Champion</p>
                    <p className="text-xs text-indigo-600">8+ week longest streak</p>
                  </div>
                </div>
              )}

              {gamification.achievements.diverseLearner && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-teal-50 border border-teal-200">
                  <Award className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-teal-800">Multi-Aircraft Expert</p>
                    <p className="text-xs text-teal-600">Completed 3+ aircraft types</p>
                  </div>
                </div>
              )}

              {!Object.values(gamification.achievements).some(Boolean) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete activities to unlock achievements! Start with a quiz or scenario to earn your first badge.
                </p>
              )}

              {/* Streak Information */}
              {stats.currentStreak > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Current Streak</span>
                    </div>
                    <span className="text-sm font-bold">{stats.currentStreak} weeks</span>
                  </div>
                  {gamification.streakData.streakAtRisk && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Complete an activity this week to keep your streak alive!
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}