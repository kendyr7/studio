
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogIn, UserPlus, Cpu, CheckCircle, DollarSignIcon, ListChecks, Phone } from 'lucide-react';
import { LogoIcon } from '@/components/icons/LogoIcon';
import type { ConfirmationResult } from 'firebase/auth';

const GoogleGIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" className="mr-2">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l0.001-0.001l6.19,5.238C39.994,36.61,44,31.021,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);


const emailAuthSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
type EmailAuthFormData = z.infer<typeof emailAuthSchema>;

const phoneAuthSchema = z.object({
    phoneNumber: z.string().min(10, {message: "Phone number seems too short."}).regex(/^\+[1-9]\d{1,14}$/, {message: "Enter phone number in E.164 format (e.g., +12223334444)"}),
});
type PhoneAuthFormData = z.infer<typeof phoneAuthSchema>;

const codeVerificationSchema = z.object({
    verificationCode: z.string().length(6, {message: "Verification code must be 6 digits."}),
});
type CodeVerificationFormData = z.infer<typeof codeVerificationSchema>;


export default function AuthPage() {
  const { user, loading, login, signup, signInWithGoogle, sendPhoneVerificationCode, confirmPhoneVerificationCode, authError, setAuthError } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("login");
  const [phoneStep, setPhoneStep] = useState<'input' | 'code'>('input');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);


  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<EmailAuthFormData>({
    resolver: zodResolver(emailAuthSchema),
  });
  const { register: registerSignup, handleSubmit: handleSubmitSignup, formState: { errors: signupErrors } } = useForm<EmailAuthFormData>({
    resolver: zodResolver(emailAuthSchema),
  });
  const { register: registerPhone, handleSubmit: handleSubmitPhone, formState: { errors: phoneErrors } } = useForm<PhoneAuthFormData>({
    resolver: zodResolver(phoneAuthSchema),
  });
  const { register: registerCode, handleSubmit: handleSubmitCode, formState: { errors: codeErrors }, reset: resetCodeForm } = useForm<CodeVerificationFormData>({
    resolver: zodResolver(codeVerificationSchema),
  });


  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    setAuthError(null);
  }, [activeTab, setAuthError, phoneStep]);


  const onLoginSubmit: SubmitHandler<EmailAuthFormData> = async (data) => {
    await login(data.email, data.password);
  };

  const onSignupSubmit: SubmitHandler<EmailAuthFormData> = async (data) => {
    await signup(data.email, data.password);
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const onSendVerificationCode: SubmitHandler<PhoneAuthFormData> = async (data) => {
    if (!recaptchaContainerRef.current) {
        setAuthError("reCAPTCHA container not found. Please refresh.");
        return;
    }
    // Ensure the container is visible or reCAPTCHA might fail initialization
    recaptchaContainerRef.current.style.display = 'block'; // Or handle visibility appropriately

    const result = await sendPhoneVerificationCode(data.phoneNumber, "recaptcha-container-id");
    if (result) {
      setConfirmationResult(result);
      setPhoneStep('code');
      setAuthError(null);
    }
     // Hide reCAPTCHA container after use if it was invisible
    if (recaptchaContainerRef.current && getComputedStyle(recaptchaContainerRef.current).height === "0px") { // Heuristic for invisible
       // recaptchaContainerRef.current.style.display = 'none'; // Or keep if badge is expected
    }
  };

  const onVerifyCode: SubmitHandler<CodeVerificationFormData> = async (data) => {
    if (confirmationResult) {
      await confirmPhoneVerificationCode(confirmationResult, data.verificationCode);
      if (!authError) { // Check if confirmPhoneVerificationCode set an error
        setPhoneStep('input'); // Reset on success
        resetCodeForm();
      }
    } else {
      setAuthError("No confirmation context found. Please try sending the code again.");
      setPhoneStep('input');
    }
  };


  if (loading && !user) { // Show loading only if not yet authenticated
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
          <Card className="mb-6">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Quick Sign-in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : <><GoogleGIcon /> Sign in with Google</>}
                </Button>
                
                {/* Phone Auth Section */}
                {phoneStep === 'input' && (
                    <form onSubmit={handleSubmitPhone(onSendVerificationCode)} className="space-y-3">
                        <div className="relative">
                             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="phone-number" type="tel" placeholder="e.g. +14155552671" {...registerPhone("phoneNumber")} className="pl-10" />
                        </div>
                        {phoneErrors.phoneNumber && <p className="text-destructive text-xs mt-1">{phoneErrors.phoneNumber.message}</p>}
                        <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Send Verification Code"}
                        </Button>
                    </form>
                )}
                {phoneStep === 'code' && (
                    <form onSubmit={handleSubmitCode(onVerifyCode)} className="space-y-3">
                        <Input id="verification-code" type="text" placeholder="6-digit code" {...registerCode("verificationCode")} maxLength={6} />
                        {codeErrors.verificationCode && <p className="text-destructive text-xs mt-1">{codeErrors.verificationCode.message}</p>}
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => { setPhoneStep('input'); setAuthError(null); resetCodeForm(); }} disabled={loading}>
                                Back
                            </Button>
                            <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                                {loading ? "Verifying..." : "Verify Code & Sign In"}
                            </Button>
                        </div>
                    </form>
                )}
                <div ref={recaptchaContainerRef} id="recaptcha-container-id"></div>
            </CardContent>
          </Card>
          
          <p className="text-center text-muted-foreground my-4 text-sm">Or use Email/Password</p>

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

