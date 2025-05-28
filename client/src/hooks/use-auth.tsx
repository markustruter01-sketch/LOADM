import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

// Create a default auth context with null values
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  loginMutation: {} as UseMutationResult<SelectUser, Error, LoginData>,
  logoutMutation: {} as UseMutationResult<void, Error, void>,
  registerMutation: {} as UseMutationResult<SelectUser, Error, InsertUser>
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    select: (data) => data || null, // Ensure we always return null and not undefined
    staleTime: 5 * 60 * 1000, // Keep auth data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Disable automatic refetch that causes auth resets
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: false, // Don't retry failed auth requests
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest({
        method: "POST",
        url: "/api/login",
        data: credentials
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Don't redirect on login - let the modal handle navigation
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest({
        method: "POST",
        url: "/api/register",
        data: credentials
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Registration success will be handled with animation in auth-page
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest({
        method: "POST",
        url: "/api/logout"
      });
    },
    onSuccess: () => {
      // Clear all user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Invalidate and reset the query cache
      queryClient.resetQueries();
      
      toast({
        title: "Logout Successful",
        description: "You have been logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create helper functions for login and logout
  const login = async (username: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      loginMutation.mutate({ username, password }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  };

  const logout = async () => {
    return new Promise<void>((resolve, reject) => {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          // Clear user data and redirect to homepage
          queryClient.setQueryData(["/api/user"], null);
          queryClient.removeQueries();
          window.location.href = '/';
          resolve();
        },
        onError: (error) => reject(error)
      });
    });
  };

  // Make sure user is always a SelectUser or null, never undefined
  const safeUser = user === undefined ? null : user;
  
  return (
    <AuthContext.Provider
      value={{
        user: safeUser,
        isLoading,
        error,
        login,
        logout,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
