import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, PhoneDirectory } from "@shared/schema";
import { Loader2, Phone, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  description: string;
}

interface DirectoryEntry {
  id: number;
  airbaseCode: string;
  airbaseName: string;
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

interface CreateDirectoryEntry {
  airbaseCode: string;
  airbaseName: string;
  contacts: Contact[];
}

function PhoneDirectorySection() {
  const queryClient = useQueryClient();
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEntry, setNewEntry] = useState({
    airbaseCode: "",
    airbaseName: "",
    contacts: [] as Contact[]
  });

  const { data: directories = [], isLoading } = useQuery<DirectoryEntry[]>({
    queryKey: ["/api/phone-directory"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newEntry) => apiRequest("/api/phone-directory", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setIsAddingNew(false);
      setNewEntry({ airbaseCode: "", airbaseName: "", contacts: [] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; entry: Omit<DirectoryEntry, 'id' | 'createdAt' | 'updatedAt'> }) =>
      apiRequest(`/api/phone-directory/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data.entry),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/phone-directory/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
    },
  });

  const addContact = (entryData: typeof newEntry | DirectoryEntry, setterFn: any) => {
    if (entryData.contacts.length >= 5) return;
    
    const newContact: Contact = {
      id: Date.now().toString(),
      name: "",
      phoneNumber: "",
      description: ""
    };
    
    setterFn((prev: any) => ({
      ...prev,
      contacts: [...prev.contacts, newContact]
    }));
  };

  const updateContact = (entryData: typeof newEntry | DirectoryEntry, contactId: string, field: keyof Contact, value: string, setterFn: any) => {
    setterFn((prev: any) => ({
      ...prev,
      contacts: prev.contacts.map((contact: Contact) =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const removeContact = (entryData: typeof newEntry | DirectoryEntry, contactId: string, setterFn: any) => {
    setterFn((prev: any) => ({
      ...prev,
      contacts: prev.contacts.filter((contact: Contact) => contact.id !== contactId)
    }));
  };

  const ContactForm = ({ contacts, onChange, title }: { contacts: Contact[], onChange: (contacts: Contact[]) => void, title: string }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">{title}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (contacts.length < 5) {
              const newContact: Contact = {
                id: Date.now().toString(),
                name: "",
                phoneNumber: "",
                description: ""
              };
              onChange([...contacts, newContact]);
            }
          }}
          disabled={contacts.length >= 5}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Contact ({contacts.length}/5)
        </Button>
      </div>
      
      <div className="space-y-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor={`name-${contact.id}`}>Contact Name</Label>
              <Input
                id={`name-${contact.id}`}
                placeholder="e.g., Ground Handling"
                value={contact.name}
                onChange={(e) => {
                  const updated = contacts.map(c =>
                    c.id === contact.id ? { ...c, name: e.target.value } : c
                  );
                  onChange(updated);
                }}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor={`phone-${contact.id}`}>Phone Number</Label>
              <Input
                id={`phone-${contact.id}`}
                placeholder="e.g., +61 7 3000 1234"
                value={contact.phoneNumber}
                onChange={(e) => {
                  const updated = contacts.map(c =>
                    c.id === contact.id ? { ...c, phoneNumber: e.target.value } : c
                  );
                  onChange(updated);
                }}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor={`desc-${contact.id}`}>Description</Label>
              <Input
                id={`desc-${contact.id}`}
                placeholder="e.g., ATC Tower"
                value={contact.description}
                onChange={(e) => {
                  const updated = contacts.map(c =>
                    c.id === contact.id ? { ...c, description: e.target.value } : c
                  );
                  onChange(updated);
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const updated = contacts.filter(c => c.id !== contact.id);
                onChange(updated);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Phone Directory</h2>
          <p className="text-muted-foreground">Airbase contact information organized by location codes</p>
        </div>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Airbase
        </Button>
      </div>

      {/* Add New Entry Dialog */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Airbase Directory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="airbaseCode">Airbase Code</Label>
                <Input
                  id="airbaseCode"
                  placeholder="e.g., BNE"
                  value={newEntry.airbaseCode}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, airbaseCode: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <Label htmlFor="airbaseName">Airbase Name</Label>
                <Input
                  id="airbaseName"
                  placeholder="e.g., Brisbane"
                  value={newEntry.airbaseName}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, airbaseName: e.target.value }))}
                />
              </div>
            </div>
            
            <ContactForm
              contacts={newEntry.contacts}
              onChange={(contacts) => setNewEntry(prev => ({ ...prev, contacts }))}
              title="Support Contacts"
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newEntry)}
                disabled={createMutation.isPending || !newEntry.airbaseCode || !newEntry.airbaseName}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Directory
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      {editingEntry && (
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {editingEntry.airbaseCode} Directory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editAirbaseCode">Airbase Code</Label>
                  <Input
                    id="editAirbaseCode"
                    value={editingEntry.airbaseCode}
                    onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, airbaseCode: e.target.value.toUpperCase() }) : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="editAirbaseName">Airbase Name</Label>
                  <Input
                    id="editAirbaseName"
                    value={editingEntry.airbaseName}
                    onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, airbaseName: e.target.value }) : null)}
                  />
                </div>
              </div>
              
              <ContactForm
                contacts={editingEntry.contacts}
                onChange={(contacts) => setEditingEntry(prev => prev ? ({ ...prev, contacts }) : null)}
                title="Support Contacts"
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingEntry) {
                      updateMutation.mutate({
                        id: editingEntry.id,
                        entry: {
                          airbaseCode: editingEntry.airbaseCode,
                          airbaseName: editingEntry.airbaseName,
                          contacts: editingEntry.contacts
                        }
                      });
                    }
                  }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Directory
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {directories.map((directory) => (
          <Card key={directory.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{directory.airbaseCode}</CardTitle>
                  <p className="text-sm text-muted-foreground">{directory.airbaseName}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEntry(directory)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(directory.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {directory.contacts.length > 0 ? (
                  directory.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <Phone className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.description}</p>
                        <p className="text-sm font-mono">{contact.phoneNumber}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No contacts added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {directories.length === 0 && (
        <div className="text-center py-12">
          <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No airbase directories found</h3>
          <p className="text-muted-foreground mb-4">Create your first airbase directory to get started</p>
          <Button onClick={() => setIsAddingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Airbase
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Documents & Directory - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Browse document templates and manage airbase phone directory for loadmaster operations." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Documents & Directory</h1>
            <p className="text-muted-foreground mt-2">
              Access document templates and airbase contact information
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="directory">Phone Directory</TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {documents?.map((document) => (
                    <DocumentCard key={document.id} document={document} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="directory" className="mt-6">
              <PhoneDirectorySection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}