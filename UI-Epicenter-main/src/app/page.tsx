"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { toast } from "sonner";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLogin } from "@/lib/useAuth";
import { redirectBasedOnRole } from "@/components/layout/UserRoles";
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useLogin();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const storedData = sessionStorage.getItem("hp-storage");
    if (!storedData) return;
    try {
      const parsedData = JSON.parse(storedData);
      const roles = parsedData?.state?.roles || [];

      if (roles.length > 0) {
        redirectBasedOnRole(roles);
      }
    } catch (error) {
      console.error("Failed to parse hp-storage from localStorage:", error);
    }
  }, [redirectBasedOnRole]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const email = values.email;
      const password = values.password;
      mutation.mutate(
        { email, password },
        {
          onSuccess: (data) => {
            redirectBasedOnRole(data.roles);
            toast.success("Login successful!");
          },
        }
      );
    } catch (error) {
      toast.error("Login failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Enhanced branding section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* HPE Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#01a982] via-[#00b388] to-[#007E61] z-10" />
        <div className="absolute inset-0 opacity-20 z-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="geometric"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="50" cy="50" r="2" fill="white" opacity="0.3" />
                <circle cx="0" cy="0" r="2" fill="white" opacity="0.2" />
                <circle cx="100" cy="100" r="2" fill="white" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geometric)" />
          </svg>
        </div>

        {/* Content */}
        <div className="absolute z-30 text-white p-12 flex flex-col justify-center h-full">
          <div className="mb-12">
            <Image
              src={"/images/logo.png"}
              alt="Epicenter Logo"
              height={220}
              width={220}
              className="mb-8 drop-shadow-lg"
            />
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight">
              Welcome to
              <span className="block text-white/90">Epicenter</span>
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Your comprehensive hiring management platform. Streamline your
              recruitment process with intelligent candidate management.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Enhanced login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#01a982]/5 to-transparent rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#007E61]/5 to-transparent rounded-tr-full"></div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#01a982] to-[#00b388] rounded-2xl mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Sign in to your account
            </h2>
            <p className="text-gray-600">
              Welcome back! Please enter your credentials to continue.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            placeholder="name@hpe.com"
                            className="h-12 pl-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#01a982]/20 focus:border-[#01a982] transition-all duration-200 bg-gray-50/50"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="h-12 pl-11 pr-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#01a982]/20 focus:border-[#01a982] transition-all duration-200 bg-gray-50/50"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#01a982] to-[#00b388] hover:from-[#007E61] hover:to-[#01a982] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                      Signing you in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Sign in to Epicenter
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>

                {/* Error Message */}
                {mutation.isError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      {mutation.error?.message ||
                        "Login failed. Please check your credentials and try again."}
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
