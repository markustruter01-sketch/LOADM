import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Loader2, FileText, Phone, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, Download, Share, Mail } from "lucide-react";
import { useLocation } from "wouter";
import EnhancedDocumentCard from "@/components/EnhancedDocumentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // State for inline PDF viewer functionality
  const [activePdf, setActivePdf] = useState<{ id: string; title: string } | null>(null);
  
  // Phone Directory state
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [expandedAirfields, setExpandedAirfields] = useState<Set<number>>(new Set());
  const [newEntry, setNewEntry] = useState({
    airbaseCode: "",
    airbaseName: "",
    contacts: [] as Contact[]
  });
  
  // Documents state - fetch PDF documents instead
  const { data: pdfDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/pdf-documents"],
  });

  // Transform PDF documents to match document card interface
  const documents = (pdfDocuments as any[]).map((pdf: any) => ({
    id: pdf.id.toString(),
    title: pdf.title,
    description: pdf.description || 'PDF Document Template',
    type: pdf.type || 'form',
    lastUpdated: new Date(pdf.updatedAt || pdf.createdAt),
    category: pdf.category || 'operational'
  }));

  // Phone Directory data
  const { data: directories = [], isLoading: directoryLoading } = useQuery<DirectoryEntry[]>({
    queryKey: ["/api/phone-directory"],
    select: (data: any[]) => {
      return data.map(entry => ({
        ...entry,
        contacts: typeof entry.contacts === 'string' ? JSON.parse(entry.contacts) : entry.contacts
      }));
    }
  });

  // Handle opening PDF documents inline
  const handleOpenForm = (documentId: string, documentTitle: string) => {
    const pdfDoc = (pdfDocuments as any[]).find(pdf => pdf.id.toString() === documentId);
    if (pdfDoc) {
      setActivePdf(pdfDoc);
      // Scroll to the PDF section
      setTimeout(() => {
        const pdfSection = document.getElementById('inline-pdf-section');
        if (pdfSection) {
          pdfSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Handle closing PDF viewer
  const handleClosePdf = () => {
    setActivePdf(null);
  };

  // Phone Directory mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/phone-directory", {
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
    mutationFn: (data: { id: number; entry: any }) =>
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
    mutationFn: (id: number) =>
      apiRequest(`/api/phone-directory/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
    },
  });

  // Phone Directory utility functions
  const toggleAirfieldExpansion = (id: number) => {
    const newExpanded = new Set(expandedAirfields);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAirfields(newExpanded);
  };

  const addContact = (entryData: any, setData: any) => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: "",
      phoneNumber: "",
      description: ""
    };
    setData({
      ...entryData,
      contacts: [...entryData.contacts, newContact]
    });
  };

  const removeContact = (entryData: any, setData: any, contactId: string) => {
    setData({
      ...entryData,
      contacts: entryData.contacts.filter((contact: Contact) => contact.id !== contactId)
    });
  };

  const updateContact = (entryData: any, setData: any, contactId: string, field: string, value: string) => {
    setData({
      ...entryData,
      contacts: entryData.contacts.map((contact: Contact) =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    });
  };

  // PDF generation for phone directory

  const generatePhoneDirectoryPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPosition = 20;
      
      // Header
      pdf.setFontSize(16);
      pdf.text('RAAF Phone Directory', 105, yPosition, { align: 'center' });
      yPosition += 15;
      
      directories.forEach((entry) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Airbase header
        pdf.setFontSize(14);
        pdf.text(`${entry.airbaseCode} - ${entry.airbaseName}`, 20, yPosition);
        yPosition += 10;
        
        // Contacts
        entry.contacts.forEach((contact) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(10);
          pdf.text(`${contact.name}`, 25, yPosition);
          pdf.text(`${contact.phoneNumber}`, 80, yPosition);
          pdf.text(`${contact.description}`, 130, yPosition);
          yPosition += 7;
        });
        
        yPosition += 5;
      });
      
      pdf.save(`Phone_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating phone directory PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Documents - LOADMworkflow</title>
        <meta name="description" content="Document management for military cargo load planning" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">
              Manage and access military cargo load planning documents
            </p>
          </div>
          <Button variant="outline" onClick={handleBackClick}>
            Back to Home
          </Button>
        </div>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="directory">Phone Directory</TabsTrigger>
          </TabsList>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <div className="space-y-6">
              {/* Enhanced Document Cards */}
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading documents...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((doc) => (
                    <EnhancedDocumentCard
                      key={doc.id}
                      document={doc}
                      onOpenForm={handleOpenForm}
                    />
                  ))}
                </div>
              )}

              {/* Inline PDF Display */}
              {activePdf && (
                <div id="inline-pdf-section" className="mt-8 p-6 bg-card rounded-lg border shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">{activePdf.title}</h3>
                    <Button variant="ghost" size="sm" onClick={handleClosePdf}>
                      ✕
                    </Button>
                  </div>
                  
                  {/* PDF Document Viewer */}
                  <div className="min-h-[600px] bg-white rounded-lg border">
                    {activePdf?.pdfData && activePdf.pdfData !== 'sample_pdf_data_placeholder' ? (
                      <iframe
                        src={`data:application/pdf;base64,${activePdf.pdfData}`}
                        className="w-full h-[600px] rounded-lg"
                        title={`PDF: ${activePdf.title}`}
                        style={{ border: 'none' }}
                      />
                    ) : (
                      <div className="p-8 flex items-center justify-center h-full">
                        <div className="text-center">
                          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-gray-700 mb-4">Loading PDF Document</h2>
                          <p className="text-lg text-muted-foreground mb-6">
                            Preparing document: {activePdf?.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            PDF Data Available: {activePdf?.pdfData ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Phone Directory Tab */}
          <TabsContent value="directory" className="mt-6">
            <div className="space-y-6">
              {/* Phone Directory Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">RAAF Phone Directory</h2>
                  <p className="text-muted-foreground">Manage contact information for airbases and personnel</p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={generatePhoneDirectoryPDF} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button onClick={() => setIsAddingNew(true)} className="bg-primary text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Airbase
                  </Button>
                </div>
              </div>

              {/* Add New Entry Form */}
              {isAddingNew && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Add New Airbase</span>
                      <Button variant="ghost" size="sm" onClick={() => setIsAddingNew(false)}>
                        <X className="h-4 w-4" />
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
                          onChange={(e) => setNewEntry({ ...newEntry, airbaseCode: e.target.value })}
                          placeholder="e.g., RAAF BASE TINDAL"
                        />
                      </div>
                      <div>
                        <Label htmlFor="airbaseName">Airbase Name</Label>
                        <Input
                          id="airbaseName"
                          value={newEntry.airbaseName}
                          onChange={(e) => setNewEntry({ ...newEntry, airbaseName: e.target.value })}
                          placeholder="e.g., Tindal"
                        />
                      </div>
                    </div>

                    {/* Contacts */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Contacts</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addContact(newEntry, setNewEntry)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Contact
                        </Button>
                      </div>
                      
                      {newEntry.contacts.map((contact) => (
                        <div key={contact.id} className="grid grid-cols-4 gap-2 mb-2 p-2 border rounded">
                          <Input
                            placeholder="Name"
                            value={contact.name}
                            onChange={(e) => updateContact(newEntry, setNewEntry, contact.id, 'name', e.target.value)}
                          />
                          <Input
                            placeholder="Phone"
                            value={contact.phoneNumber}
                            onChange={(e) => updateContact(newEntry, setNewEntry, contact.id, 'phoneNumber', e.target.value)}
                          />
                          <Input
                            placeholder="Description"
                            value={contact.description}
                            onChange={(e) => updateContact(newEntry, setNewEntry, contact.id, 'description', e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContact(newEntry, setNewEntry, contact.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddingNew(false)}>Cancel</Button>
                      <Button 
                        onClick={() => createMutation.mutate(newEntry)}
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Airbase
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Directory Entries - Two Column Layout */}
              {directoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading directory...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {directories.map((entry) => (
                    <Card key={entry.id} className="border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center space-x-2 cursor-pointer flex-1"
                            onClick={() => toggleAirfieldExpansion(entry.id)}
                          >
                            {expandedAirfields.has(entry.id) ? 
                              <ChevronDown className="w-4 h-4 flex-shrink-0" /> : 
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            }
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base font-semibold truncate">{entry.airbaseCode}</CardTitle>
                              <p className="text-xs text-muted-foreground truncate">{entry.airbaseName}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingEntry(entry)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(entry.id)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedAirfields.has(entry.id) && (
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 border-b pb-1">
                              <span>Name</span>
                              <span>Phone</span>
                              <span>Description</span>
                            </div>
                            {entry.contacts.map((contact) => (
                              <div key={contact.id} className="grid grid-cols-3 gap-2 text-xs py-1">
                                <span className="truncate">{contact.name}</span>
                                <span className="font-mono truncate">{contact.phoneNumber}</span>
                                <span className="text-gray-600 truncate">{contact.description}</span>
                              </div>
                            ))}
                            {entry.contacts.length === 0 && (
                              <p className="text-xs text-gray-500 italic">No contacts added yet</p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                  
                  {directories.length === 0 && (
                    <div className="text-center py-8">
                      <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Directory Entries</h3>
                      <p className="text-gray-500 mb-4">Start by adding your first airbase to the directory</p>
                      <Button onClick={() => setIsAddingNew(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Airbase
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}