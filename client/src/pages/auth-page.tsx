import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import SuccessAnimation from "@/components/SuccessAnimation";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

const registerSchema = insertUserSchema.pick({
  username: true,
  password: true,
}).extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, logoutMutation, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const [showRegisterAnimation, setShowRegisterAnimation] = useState(false);

  // Handle redirects for logged-in users
  useEffect(() => {
    // Check URL for parameters
    const params = new URLSearchParams(window.location.search);
    
    // Redirect logged-in users based on their role
    if (user) {
      if (user.isSuperAdmin) {
        // Redirect superadmin to their dedicated dashboard
        setLocation('/superadmin-dashboard');
      } else {
        // Redirect regular users to home page or previous page
        const returnPath = params.get('returnTo') || '/';
        setLocation(returnPath);
      }
    }
  }, [user, setLocation]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setShowLoginAnimation(true);
        // Animation will redirect after completion
      }
    });
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData, {
      onSuccess: () => {
        setShowRegisterAnimation(true);
        // Animation will redirect after completion
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SuccessAnimation 
        type="login"
        show={showLoginAnimation}
        onComplete={() => {
          setShowLoginAnimation(false);
          setLocation("/");
        }}
      />
      
      <SuccessAnimation 
        type="register"
        show={showRegisterAnimation}
        onComplete={() => {
          setShowRegisterAnimation(false);
          setLocation("/");
        }}
      />
      
      <Helmet>
        <title>Login or Register - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Login or create an account to access LOADMworkflow, the professional documentation tool for loadmasters." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row min-h-[calc(100vh-160px)]">
        <div className="lg:w-1/2 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome to <span className="text-white">LOADM</span><span className="text-primary">workflow</span>
              </h2>
              <p className="text-muted-foreground">
                Sign in to your account or create a new one
              </p>
            </div>

            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="superadmin">Super Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="space-y-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Super Admin Login Tab */}
              <TabsContent value="superadmin" className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-md p-4 mb-4">
                  <p className="text-amber-800 dark:text-amber-200 text-sm flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Super Admin access is restricted to authorized personnel only.
                  </p>
                </div>
                
                <Form {...loginForm}>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const password = "123456";
                    
                    if (loginForm.getValues().username === "superadmin" && 
                        loginForm.getValues().password === password) {
                      loginMutation.mutate({
                        username: "superadmin",
                        password: password
                      });
                    } else {
                      loginForm.setError("username", { 
                        type: "manual", 
                        message: "Invalid Super Admin credentials" 
                      });
                      loginForm.setError("password", { 
                        type: "manual", 
                        message: "Invalid Super Admin credentials" 
                      });
                    }
                  }} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="superadmin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter Super Admin password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        "Super Admin Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10"></div>
          <img
            src="/cargo-loading.png"
            alt="Military cargo loadmaster preparing pallet"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="max-w-lg p-6 text-white">
              <h3 className="text-3xl font-bold mb-4">Streamline Your Workflow</h3>
              <p className="text-lg mb-6">
                <span className="text-white">LOADM</span><span className="text-primary">workflow</span> provides professional documentation tools and training scenarios for loadmasters.
                Access all required documentation in one central location.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Complete documentation online
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Practice with training scenarios
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Save and retrieve your work
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
