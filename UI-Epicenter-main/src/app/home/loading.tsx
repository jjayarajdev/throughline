"use client";

import SubmitFormLoader from "@/components/common/SubmitFormLoader";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-white">
     <SubmitFormLoader/>
    </div>
  );
}
