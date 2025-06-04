import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Phone, Mail, MapPin, Users, Loader2 } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  rank: string;
  position: string;
  phone: string;
  email: string;
  department: string;
}

interface Airbase {
  id: number;
  airbaseCode: string;
  airbaseName: string;
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

export default function PhoneDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAirbase, setSelectedAirbase] = useState<string | null>(null);

  // Fetch phone directory data
  const { data: airbases = [], isLoading, error } = useQuery<Airbase[]>({
    queryKey: ['/api/phone-directory'],
    refetchOnWindowFocus: false,
  });

  // Filter contacts based on search and selected airbase
  const filteredContacts = airbases
    .filter(airbase => !selectedAirbase || airbase.airbaseCode === selectedAirbase)
    .flatMap(airbase => 
      airbase.contacts
        .filter(contact =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          airbase.airbaseName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(contact => ({ ...contact, airbaseName: airbase.airbaseName, airbaseCode: airbase.airbaseCode }))
    );

  const uniqueAirbases = Array.from(new Set(airbases.map(ab => ab.airbaseCode)))
    .map(code => airbases.find(ab => ab.airbaseCode === code))
    .filter((airbase): airbase is Airbase => airbase !== undefined);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading phone directory: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, rank, position, department, or airbase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Airbase Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedAirbase === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedAirbase(null)}
            >
              All Airbases
            </Button>
            {uniqueAirbases.map((airbase) => (
              <Button
                key={airbase.airbaseCode}
                variant={selectedAirbase === airbase.airbaseCode ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAirbase(airbase.airbaseCode)}
              >
                {airbase.airbaseCode} - {airbase.airbaseName}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Directory Listing */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading directory...</span>
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchTerm || selectedAirbase ? 'No contacts found' : 'No directory data available'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedAirbase 
                  ? 'Try adjusting your search terms or filters'
                  : 'Phone directory data will appear here when loaded'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Directory Contacts ({filteredContacts.length})
            </h2>
            <div className="text-sm text-gray-500">
              Total: {airbases.reduce((sum, ab) => sum + ab.contacts.length, 0)} contacts across {airbases.length} airbases
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact, index) => (
              <Card key={`${contact.airbaseCode}-${contact.id}-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{contact.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {contact.rank}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {contact.airbaseCode}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-gray-900">
                        {contact.position}
                      </div>
                      <div className="text-gray-600">
                        {contact.department}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{contact.airbaseName}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}