import { useState, useEffect } from "react";
import { useAuth, extendedInsertUserSchema } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Heart, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof extendedInsertUserSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();

  // If user is already logged in, redirect to home page
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(extendedInsertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  async function onLoginSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[650px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center">
            <Flame className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">DateTheory</h1>
          <p className="text-sm text-muted-foreground">
            Where Math & Hearts Meet
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">
                Welcome to DateTheory
              </CardTitle>
              <CardDescription className="text-center">
                Sign in or create an account to start swiping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
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
                        className="w-full" 
                        disabled={isLoading || loginMutation.isPending}
                      >
                        {(isLoading || loginMutation.isPending) ? 
                          <div className="flex items-center gap-2">
                            <span>Logging in</span>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div> : 
                          "Sign In"
                        }
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4 text-center text-sm">
                    <span className="text-muted-foreground">Don't have an account?</span>{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("register")}
                    >
                      Register
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Create a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
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
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading || registerMutation.isPending}
                      >
                        {(isLoading || registerMutation.isPending) ? 
                          <div className="flex items-center gap-2">
                            <span>Creating account</span>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div> : 
                          "Create Account"
                        }
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4 text-center text-sm">
                    <span className="text-muted-foreground">Already have an account?</span>{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("login")}
                    >
                      Login
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="hidden md:flex md:flex-col md:items-center md:justify-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Smart Dating with Game Theory</h2>
              <ul className="space-y-2 text-center">
                <li className="flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  <span className="text-sm">Daily credits to spend wisely</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  <span className="text-sm">Score rises with likes, falls with passes</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  <span className="text-sm">Popular profiles shown less frequently</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  <span className="text-sm">More balanced matching outcomes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
