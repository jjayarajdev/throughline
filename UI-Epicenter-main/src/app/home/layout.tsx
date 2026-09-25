"use client";
import AppHeader from "@/components/layout/AppHeader";
import { useSidebar } from "@/components/context/SidebarContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isExpanded, isMobileOpen,isHovered } = useSidebar();
 
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : (isExpanded|| isHovered)
    ? "lg:ml-[220px]"
    : "lg:ml-[65px]";
    const router = useRouter()
    useEffect(() => {
    const hpStorage = sessionStorage.getItem('hp-storage');
  
    if (!hpStorage) {
    router.replace('/')
    }
  }, []);
  return (
    <>
      <div className="min-h-screen xl:flex" suppressHydrationWarning>
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        {/* Main Content Area */}
        <div className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}>
          <AppHeader/>
       
          {/* Page Content */}
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 mx-auto max-w-full">
            {children}
          </div>
        </div>
   
      </div>
    </>
  );
}






// export  function RootLayouts({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   const { isExpanded, isMobileOpen } = useSidebar();

//   const mainContentMargin = isMobileOpen
//     ? "ml-0"
//     : isExpanded
//       ? "lg:ml-[270px]"
//       : "lg:ml-[90px]";

//   return (
//     <>
//       <div className="min-h-screen xl:flex">
//         {/* Sidebar and Backdrop */}
//         <AppSidebar /> 
//          <Backdrop />
//         {/* Main Content Area */}
//         <div
//           className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
//         >
//           {/* Header */}
//           <AppHeader />
//           {/* Page Content */}
//           <div className="p-4 mx-auto max-w-(--breakpoint-2xl) ">{children}</div>
//         </div>
//       </div>
//     </>
//   );
// }
