import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import UsersList from "@/components/UsersList";

export default function PermissionsDashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Button 
          variant="outline" 
          className="mb-6 border-gray-600 text-gray-200 hover:bg-gray-800" 
          onClick={() => setLocation('/superadmin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Permission Management</h1>
            <p className="text-gray-400 mt-2">Manage user roles and access permissions</p>
          </div>
        </div>

        {/* Users List Component */}
        <UsersList />

        {/* Permission Matrix */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Permission Matrix</h2>
          <p className="text-gray-400 mb-6">Overview of what each role can access</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="pb-3 text-gray-300 font-medium">Feature</th>
                  <th className="pb-3 text-orange-400 font-medium text-center">Readonly</th>
                  <th className="pb-3 text-green-400 font-medium text-center">Loadmaster</th>
                  <th className="pb-3 text-blue-400 font-medium text-center">Instructor</th>
                  <th className="pb-3 text-purple-400 font-medium text-center">Super Admin</th>
                </tr>
              </thead>
              <tbody className="space-y-3">
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Load Planning</td>
                  <td className="py-3 text-center text-orange-400">View Only</td>
                  <td className="py-3 text-center text-green-500">✓</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Training Modules</td>
                  <td className="py-3 text-center text-orange-400">View Only</td>
                  <td className="py-3 text-center text-green-500">✓</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Scenario Submissions</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-green-500">✓</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Quiz Submissions</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-green-500">✓</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Documents Access</td>
                  <td className="py-3 text-center text-orange-400">View Only</td>
                  <td className="py-3 text-center text-green-500">✓</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Instructor Portal</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Student Progress Review</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Create Scenarios</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Edit Content</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">Analytics Dashboard</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-blue-500">✓</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 text-gray-300">License Management</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-300">User Permission Management</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-gray-500">✗</td>
                  <td className="py-3 text-center text-purple-500">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}