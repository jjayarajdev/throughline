"use client";

import React, { useEffect } from "react";
import loaderAnimation from "@/assets/loader.json";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const SubmitFormLoader = () => {
  useEffect(() => {
    // Disable background scrolling
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      // Restore when unmounted
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center 
      bg-white/20 dark:bg-black/70"
    >
      <div className="w-48 h-48">
        <Lottie animationData={loaderAnimation} loop />
      </div>
    </div>
  );
};

export default SubmitFormLoader;
