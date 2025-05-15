import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Document, FormField as DocumentFormField, insertDocumentSubmissionSchema } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";

export default function DocumentFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const documentId = parseInt(id);

  const { data: document, isLoading } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !isNaN(documentId),
  });

  // Special handling for Cargo Manifest: redirect to dedicated page
  useEffect(() => {
    if (document && (document.title === "Cargo Manifest" || document.title === "Passenger/Crew and Cargo Manifest")) {
      // Redirect to the cargo manifest page with anchor
      setLocation("/cargo-manifest#cargo-manifest-form");
    }
  }, [document, setLocation]);

  const fields = document?.fields as DocumentFormField[] | undefined;

  const formSchema = z.object(
    fields?.reduce((acc, field) => {
      if (field.type === "checkbox") {
        acc[field.id] = field.required 
          ? z.boolean().refine(val => val === true, { message: `${field.label} is required` })
          : z.boolean().optional();
      } else if (field.type === "number") {
        acc[field.id] = field.required 
          ? z.number().min(0, `${field.label} is required`)
          : z.number().optional();
      } else {
        acc[field.id] = field.required 
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
      }
      return acc;
    }, {} as Record<string, any>) || {}
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: fields?.reduce((acc, field) => {
      if (field.type === "checkbox") {
        acc[field.id] = false;
      } else if (field.type === "number") {
        acc[field.id] = 0;
      } else {
        acc[field.id] = "";
      }
      return acc;
    }, {} as Record<string, any>) || {},
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const submissionData = {
        documentId,
        formData: data,
      };
      const res = await apiRequest("POST", "/api/document-submissions", submissionData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Form submitted successfully",
        description: "Your document has been saved.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Form submission failed",
        description: error.message || "Failed to submit the form",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to submit the form",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    submitMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-destructive mb-4">Document not found</h2>
            <Button variant="outline" onClick={() => setLocation("/")} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{document.title} - LOADMdocs</title>
        <meta name="description" content={document.description} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => setLocation("/")} className="text-primary hover:text-primary/80 mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h2 className="text-2xl font-bold text-foreground">{document.title}</h2>
          </div>

          <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {fields?.map((field) => {
                  // Handle each field type with proper FormControl usage
                  if (field.type === "text") {
                    return (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={field.placeholder}
                                {...formField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }
                  
                  if (field.type === "number") {
                    return (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={field.placeholder}
                                {...formField}
                                onChange={(e) => formField.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }
                  
                  if (field.type === "date") {
                    return (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...formField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }
                  
                  if (field.type === "textarea") {
                    return (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={field.placeholder}
                                rows={3}
                                {...formField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }
                  
                  if (field.type === "select" && field.options) {
                    return (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={formField.onChange}
                                defaultValue={formField.value ? formField.value.toString() : undefined}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }
                  
                  if (field.type === "checkbox") {
                    return (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                            <FormControl>
                              <Checkbox
                                checked={formField.value}
                                onCheckedChange={formField.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{field.label}</FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }
                  
                  // Default fallback for unrecognized field types
                  return (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={field.id}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>{field.label}</FormLabel>
                          <FormControl>
                            <Input {...formField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Submit Form
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
