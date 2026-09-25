// app/unauthorized/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/home');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#1a1c1e] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-0 shadow-md bg-white dark:bg-gray-800">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-[#01A982]/10 p-4 rounded-full mb-4">
            <Shield className="w-10 h-10 text-[#01A982]" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
            Access Denied
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          <p className="text-center text-gray-600 dark:text-gray-300">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="bg-[#f8fafc] dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This resource requires specific permissions that are not assigned to your account.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleGoBack}
              className="bg-[#01A982] hover:bg-[#018A6B] text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>

          </div>
          
          {/* <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Error ID: 403-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
            </p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
