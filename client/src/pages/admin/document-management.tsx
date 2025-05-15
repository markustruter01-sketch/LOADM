import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Document, FormField as DocumentFormField, insertDocumentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Edit, FilePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define form types
const documentFormSchema = insertDocumentSchema.extend({
  fields: z.array(
    z.object({
      id: z.string().min(1, "Field ID is required"),
      label: z.string().min(1, "Field label is required"),
      type: z.enum(["text", "number", "select", "checkbox", "date", "textarea"]),
      placeholder: z.string().optional(),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional(),
    })
  ),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

// Field types for dropdown selection
const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Text Area" },
];

export default function DocumentManagement() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  // Fetch all documents
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Set up form
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "Form",
      fields: [
        {
          id: "",
          label: "",
          type: "text",
          placeholder: "",
          required: true,
        },
      ],
    },
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      const res = await apiRequest("POST", "/api/documents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document created",
        description: "The document template has been created successfully",
      });
      setIsCreating(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DocumentFormValues }) => {
      const res = await apiRequest("PUT", `/api/documents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document updated",
        description: "The document template has been updated successfully",
      });
      setEditingDocument(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document template has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: DocumentFormValues) => {
    if (editingDocument) {
      updateDocumentMutation.mutate({ id: editingDocument.id, data });
    } else {
      createDocumentMutation.mutate(data);
    }
  };

  // Add a new field to the form
  const addField = () => {
    const fields = form.getValues().fields || [];
    form.setValue("fields", [
      ...fields,
      {
        id: `field_${fields.length + 1}`,
        label: "",
        type: "text",
        placeholder: "",
        required: true,
      },
    ]);
  };

  // Remove a field from the form
  const removeField = (index: number) => {
    const fields = form.getValues().fields;
    if (fields && fields.length > 1) {
      form.setValue(
        "fields",
        fields.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: "Cannot remove field",
        description: "A document must have at least one field",
        variant: "destructive",
      });
    }
  };

  // Handle edit document
  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    
    // Transform the fields from any to DocumentFormField[] and set form values
    const fields = document.fields as DocumentFormField[];
    
    form.reset({
      title: document.title,
      description: document.description,
      type: document.type,
      fields,
    });
  };

  // Handle delete document
  const handleDeleteDocument = (id: number) => {
    setDocumentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete);
    }
  };

  // Handle dialog close and reset form
  const handleDialogClose = () => {
    if (!createDocumentMutation.isPending && !updateDocumentMutation.isPending) {
      form.reset();
      setIsCreating(false);
      setEditingDocument(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Document Management - LOADMdocs</title>
        <meta name="description" content="Manage document templates for LOADMdocs - create, edit, and delete documents." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/admin">
              <a className="text-primary hover:text-primary/80 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Link>
            <h2 className="text-2xl font-bold">Document Management</h2>
          </div>
          <Dialog open={isCreating} onOpenChange={(open) => {
            setIsCreating(open);
            if (!open) handleDialogClose();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Document Template</DialogTitle>
                <DialogDescription>
                  Create a new document template with custom fields.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Document title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Document type" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Provide a brief description"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Form Fields</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addField}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Field
                      </Button>
                    </div>

                    {form.watch("fields")?.map((field, index) => (
                      <Card key={index} className="border border-border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">Field {index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(index)}
                              className="text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`fields.${index}.id`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field ID</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="unique_id" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`fields.${index}.label`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field Label</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Display Label" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`fields.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field Type</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select field type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {fieldTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`fields.${index}.required`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-end space-x-2">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                  </FormControl>
                                  <FormLabel>Required Field</FormLabel>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`fields.${index}.placeholder`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Placeholder (optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Placeholder text" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch(`fields.${index}.type`) === "select" && (
                            <FormField
                              control={form.control}
                              name={`fields.${index}.options`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Options (comma separated)</FormLabel>
                                  <FormControl>
                                    <Input
                                      value={(field.value || []).join(",")}
                                      onChange={(e) => {
                                        const options = e.target.value
                                          .split(",")
                                          .map((option) => option.trim())
                                          .filter(Boolean);
                                        field.onChange(options);
                                      }}
                                      placeholder="Option 1, Option 2, Option 3"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Enter options separated by commas
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 text-white"
                      disabled={createDocumentMutation.isPending}
                    >
                      {createDocumentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Document
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Document Dialog */}
          <Dialog open={editingDocument !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingDocument(null);
              handleDialogClose();
            }
          }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Document Template</DialogTitle>
                <DialogDescription>
                  Update the document template and its fields.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Document title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Document type" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Provide a brief description"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Form Fields</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addField}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Field
                      </Button>
                    </div>

                    {form.watch("fields")?.map((field, index) => (
                      <Card key={index} className="border border-border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">Field {index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(index)}
                              className="text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`fields.${index}.id`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field ID</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="unique_id" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`fields.${index}.label`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field Label</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Display Label" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`fields.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field Type</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select field type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {fieldTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`fields.${index}.required`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-end space-x-2">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                  </FormControl>
                                  <FormLabel>Required Field</FormLabel>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`fields.${index}.placeholder`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Placeholder (optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Placeholder text" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch(`fields.${index}.type`) === "select" && (
                            <FormField
                              control={form.control}
                              name={`fields.${index}.options`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Options (comma separated)</FormLabel>
                                  <FormControl>
                                    <Input
                                      value={(field.value || []).join(",")}
                                      onChange={(e) => {
                                        const options = e.target.value
                                          .split(",")
                                          .map((option) => option.trim())
                                          .filter(Boolean);
                                        field.onChange(options);
                                      }}
                                      placeholder="Option 1, Option 2, Option 3"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Enter options separated by commas
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 text-white"
                      disabled={updateDocumentMutation.isPending}
                    >
                      {updateDocumentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Document
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Documents Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Number of Fields</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents && documents.length > 0 ? (
                  documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{document.title}</TableCell>
                      <TableCell>{document.type}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {document.description}
                      </TableCell>
                      <TableCell>
                        {(document.fields as DocumentFormField[]).length}
                      </TableCell>
                      <TableCell>
                        {new Date(document.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDocument(document)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <FilePlus className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No documents found</p>
                        <Button
                          className="mt-4 bg-primary hover:bg-primary/90 text-white"
                          onClick={() => setIsCreating(true)}
                        >
                          Create Document
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document template and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
