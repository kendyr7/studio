
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogIn, UserPlus, Cpu, CheckCircle, DollarSignIcon, ListChecks } from 'lucide-react';
import { LogoIcon } from '@/components/icons/LogoIcon';

const emailAuthSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
type EmailAuthFormData = z.infer<typeof emailAuthSchema>;


export default function AuthPage() {
  const { user, loading, login, signup, authError, setAuthError } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("login");

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<EmailAuthFormData>({
    resolver: zodResolver(emailAuthSchema),
  });
  const { register: registerSignup, handleSubmit: handleSubmitSignup, formState: { errors: signupErrors } } = useForm<EmailAuthFormData>({
    resolver: zodResolver(emailAuthSchema),
  });

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    // Clear previous auth errors when tab changes
    setAuthError(null);
  }, [activeTab, setAuthError]);


  const onLoginSubmit: SubmitHandler<EmailAuthFormData> = async (data) => {
    await login(data.email, data.password);
  };

  const onSignupSubmit: SubmitHandler<EmailAuthFormData> = async (data) => {
    await signup(data.email, data.password);
  };

  if (loading && !user) { 
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl mt-4 font-headline">Loading Authentication...</p>
      </div>
    );
  }
  
  if (user) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 overflow-y-auto">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-center sm:justify-start">
        <LogoIcon className="h-10 w-auto" />
      </header>
      
      <main className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 w-full max-w-5xl mt-20 md:mt-0">
        <div className="md:w-1/2 space-y-6 text-center md:text-left">
          <h1 className="text-4xl lg:text-5xl font-headline text-primary">Welcome to BuildMaster</h1>
          <p className="text-lg lg:text-xl text-muted-foreground">
            Your ultimate companion for planning and tracking expenses for your dream PC builds.
          </p>
          <div className="space-y-4 pt-4">
            <h2 className="text-2xl font-semibold text-accent">Key Features:</h2>
            <ul className="space-y-3 text-left">
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 shrink-0 mt-1" />
                <span><strong className="text-foreground">Multi-List Management:</strong> Create and manage separate lists.</span>
              </li>
              <li className="flex items-start">
                <Cpu className="h-6 w-6 text-primary mr-3 shrink-0 mt-1" />
                <span><strong className="text-foreground">Component Tracking:</strong> Add components, prices, and notes.</span>
              </li>
              <li className="flex items-start">
                <DollarSignIcon className="h-6 w-6 text-accent mr-3 shrink-0 mt-1" />
                <span><strong className="text-foreground">Budget Control:</strong> Set budgets and monitor spending.</span>
              </li>
              <li className="flex items-start">
                <ListChecks className="h-6 w-6 text-yellow-500 mr-3 shrink-0 mt-1" />
                <span><strong className="text-foreground">Payment Logging:</strong> Track individual payments.</span>
              </li>
               <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 shrink-0 mt-1" />
                <span><strong className="text-foreground">Status Overview:</strong> See item payment statuses.</span>
              </li>
            </ul>
          </div>
           <p className="text-md text-muted-foreground pt-4">
            Sign up or log in to start mastering your builds!
          </p>
        </div>

        <div className="md:w-1/2 w-full max-w-md">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" placeholder="you@example.com" {...registerLogin("email")} />
                      {loginErrors.email && <p className="text-destructive text-xs mt-1">{loginErrors.email.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input id="login-password" type="password" placeholder="••••••••" {...registerLogin("password")} />
                      {loginErrors.password && <p className="text-destructive text-xs mt-1">{loginErrors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                      {loading && activeTab === 'login' ? "Logging in..." : <><LogIn className="mr-2 h-4 w-4" /> Login</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Sign Up</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" placeholder="you@example.com" {...registerSignup("email")} />
                      {signupErrors.email && <p className="text-destructive text-xs mt-1">{signupErrors.email.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" placeholder="••••••••" {...registerSignup("password")} />
                      {signupErrors.password && <p className="text-destructive text-xs mt-1">{signupErrors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
                      {loading && activeTab === 'signup' ? "Signing up..." : <><UserPlus className="mr-2 h-4 w-4" /> Sign Up</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
           {authError && (
              <div className="mt-4 bg-destructive/20 border border-destructive text-destructive p-3 rounded-md text-sm flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" /> {authError}
              </div>
            )}
        </div>
      </main>
       <footer className="w-full text-center py-8 mt-12 text-sm text-muted-foreground">
        BuildMaster &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
