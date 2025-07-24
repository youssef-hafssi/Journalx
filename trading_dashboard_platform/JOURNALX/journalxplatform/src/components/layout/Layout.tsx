
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 dark:from-[#1a1a1a] dark:via-[#1a1a1a] dark:to-[#1a1a1a]">
      <Navbar />
      <main className="flex-1 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.05),transparent)] dark:bg-[radial-gradient(circle_500px_at_50%_200px,rgba(255,255,255,0.03),transparent)]" />
        <div className="relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
