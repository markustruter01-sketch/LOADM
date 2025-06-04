import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, Download, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from 'jspdf';

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
}

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDirectories, setExpandedDirectories] = useState<Set<number>>(new Set());
  const [isPhoneFormOpen, setIsPhoneFormOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    airbaseCode: "",
    airbaseName: "",
    contacts: [{ id: "", name: "", phoneNumber: "", description: "" }]
  });

  // Fetch PDF documents and phone directory
  const { data: pdfDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/pdf-documents"],
  });

  const { data: phoneDirectories = [], isLoading: directoriesLoading } = useQuery({
    queryKey: ["/api/phone-directory"],
  });

  const queryClient = useQueryClient();

  console.log("PDF Documents data:", pdfDocuments);
  console.log("PDF Documents length:", pdfDocuments.length);

  // Simple PDF handler - opens PDF directly in new tab
  const handleOpenPDF = (documentId: number) => {
    console.log("Opening PDF document ID:", documentId);
    window.open(`/pdf-stream/${documentId}`, '_blank');
  };

  // Phone directory handlers
  const toggleDirectoryExpansion = (id: number) => {
    const newExpanded = new Set(expandedDirectories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDirectories(newExpanded);
  };

  const addContactToNewEntry = () => {
    setNewEntry(prev => ({
      ...prev,
      contacts: [...prev.contacts, { id: "", name: "", phoneNumber: "", description: "" }]
    }));
  };

  const updateContactInNewEntry = (index: number, field: string, value: string) => {
    setNewEntry(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const removeContactFromNewEntry = (index: number) => {
    setNewEntry(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const saveNewEntry = async () => {
    try {
      const entryToSave = {
        ...newEntry,
        contacts: newEntry.contacts.filter(contact => 
          contact.name.trim() && contact.phoneNumber.trim()
        ).map(contact => ({
          ...contact,
          id: Math.random().toString(36).substr(2, 9)
        }))
      };

      await apiRequest('/api/phone-directory', {
        method: 'POST',
        body: JSON.stringify(entryToSave),
      });

      queryClient.invalidateQueries({ queryKey: ['/api/phone-directory'] });
      setIsPhoneFormOpen(false);
      setNewEntry({
        airbaseCode: "",
        airbaseName: "",
        contacts: [{ id: "", name: "", phoneNumber: "", description: "" }]
      });
    } catch (error) {
      console.error('Error saving phone directory entry:', error);
    }
  };

  const filteredDirectories = phoneDirectories.filter((directory: DirectoryEntry) =>
    directory.airbaseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    directory.airbaseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    directory.contacts.some((contact: Contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phoneNumber.includes(searchTerm)
    )
  );

  const generatePDF = async () => {
    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text('Phone Directory Report', 20, 20);
    
    let yPosition = 40;
    
    filteredDirectories.forEach((directory: DirectoryEntry) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.text(`${directory.airbaseCode} - ${directory.airbaseName}`, 20, yPosition);
      yPosition += 10;
      
      directory.contacts.forEach((contact: Contact) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(10);
        pdf.text(`${contact.name}: ${contact.phoneNumber}`, 25, yPosition);
        if (contact.description) {
          yPosition += 5;
          pdf.text(`Description: ${contact.description}`, 30, yPosition);
        }
        yPosition += 8;
      });
      
      yPosition += 5;
    });
    
    pdf.save('phone-directory.pdf');
  };

  if (documentsLoading || directoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>Documents & Directory | LOADMaster</title>
        <meta name="description" content="Access important documents and contact directory for military operations" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Documents & Directory</h1>
          <p className="text-gray-600">Access critical documents and contact information</p>
        </div>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="directory">Phone Directory</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pdfDocuments.map((doc: any) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {doc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleOpenPDF(doc.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(`/pdf-stream/${doc.id}?download=true`, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="directory" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <Input
                  placeholder="Search directory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={generatePDF} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
              <Button 
                onClick={() => setIsPhoneFormOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredDirectories.map((directory: DirectoryEntry) => (
                <Card key={directory.id} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleDirectoryExpansion(directory.id)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {directory.airbaseCode}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {directory.airbaseName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {directory.contacts.length} contact{directory.contacts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {expandedDirectories.has(directory.id) ? 
                        <ChevronDown className="w-5 h-5" /> : 
                        <ChevronRight className="w-5 h-5" />
                      }
                    </CardTitle>
                  </CardHeader>

                  {expandedDirectories.has(directory.id) && (
                    <CardContent className="pt-0 bg-gray-50">
                      <div className="grid gap-3">
                        {directory.contacts.map((contact: Contact) => (
                          <div key={contact.id} className="bg-white p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{contact.name}</h4>
                                  <p className="text-sm text-blue-600 font-mono">{contact.phoneNumber}</p>
                                  {contact.description && (
                                    <p className="text-sm text-gray-500">{contact.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Phone className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Add New Entry Form */}
            {isPhoneFormOpen && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Add New Directory Entry</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsPhoneFormOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="airbaseCode">Airbase Code</Label>
                      <Input
                        id="airbaseCode"
                        value={newEntry.airbaseCode}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, airbaseCode: e.target.value }))}
                        placeholder="e.g., BNE"
                      />
                    </div>
                    <div>
                      <Label htmlFor="airbaseName">Airbase Name</Label>
                      <Input
                        id="airbaseName"
                        value={newEntry.airbaseName}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, airbaseName: e.target.value }))}
                        placeholder="e.g., Brisbane Airbase"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Contacts</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addContactToNewEntry}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Contact
                      </Button>
                    </div>
                    
                    {newEntry.contacts.map((contact, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                        <Input
                          className="col-span-3"
                          placeholder="Name"
                          value={contact.name}
                          onChange={(e) => updateContactInNewEntry(index, 'name', e.target.value)}
                        />
                        <Input
                          className="col-span-3"
                          placeholder="Phone"
                          value={contact.phoneNumber}
                          onChange={(e) => updateContactInNewEntry(index, 'phoneNumber', e.target.value)}
                        />
                        <Input
                          className="col-span-5"
                          placeholder="Description"
                          value={contact.description}
                          onChange={(e) => updateContactInNewEntry(index, 'description', e.target.value)}
                        />
                        {newEntry.contacts.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="col-span-1"
                            onClick={() => removeContactFromNewEntry(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={saveNewEntry} className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Entry
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPhoneFormOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}