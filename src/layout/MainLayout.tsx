import type React from "react";
import TopNav from "@/layout/TopNav";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-canvas">
      <TopNav />
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-5 px-4 pt-4 pb-12 sm:px-6 sm:pt-6">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
