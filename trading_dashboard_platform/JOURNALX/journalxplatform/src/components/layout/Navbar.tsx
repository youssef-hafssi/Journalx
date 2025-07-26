
import { Link, useLocation } from "react-router-dom";
import { BookOpenCheck, Menu, TrendingUp, BarChart3, Calendar, Target, Wrench, FileText, Globe, Newspaper, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/lib/admin";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useParams } from "react-router-dom";
import * as React from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/trades", label: "Trades", icon: TrendingUp },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/statistical-edge", label: "Statistical Edge", icon: Target },
  { href: "/edge-builder", label: "Edge Builder", icon: Wrench },
  { href: "/journal", label: "Journal", icon: FileText },
  { href: "/news-data", label: "News Data", icon: Newspaper },
  { href: "/forex-tradable-assets", label: "Forex Assets", icon: Globe },
];

export function Navbar() {
  console.log('🔍 Navbar component rendering...');
  const { pathname } = useLocation();
  const [open, setOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const { userId } = useParams<{ userId: string }>();

  console.log('🔍 Navbar state:', {
    pathname,
    userId,
    isImpersonating,
    impersonatedUser: impersonatedUser?.email,
    user: user?.email
  });
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Check admin status
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('Navbar: Checking admin status for user:', user?.email);
        const adminStatus = await AdminService.isAdmin();
        console.log('Navbar: Admin status result:', adminStatus);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Navbar: Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Generate navigation links based on impersonation status
  const getNavLinks = () => {
    if (isImpersonating && userId) {
      // When impersonating, use impersonation routes
      return navLinks.map(link => ({
        ...link,
        href: `/admin/impersonate/${userId}${link.href}`
      }));
    }
    // Regular user navigation
    return navLinks;
  };

  const currentNavLinks = getNavLinks();

  // Debug logging
  React.useEffect(() => {
    console.log('Navbar Debug:', {
      isImpersonating,
      userId,
      impersonatedUser,
      currentNavLinks: currentNavLinks.map(link => ({ href: link.href, label: link.label })),
      pathname
    });
  }, [isImpersonating, userId, impersonatedUser, currentNavLinks, pathname]);

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to={isImpersonating && userId ? `/admin/impersonate/${userId}/dashboard` : "/dashboard"}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <BookOpenCheck className="h-5 w-5 text-black dark:text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Journal<span className="text-red-600">X</span>
              </span>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                Pro
              </Badge>
            </div>
          </Link>
          
          <nav className="hidden sm:flex items-center gap-1">
            {currentNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-muted/50",
                    isActive
                      ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getUserInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(isAdmin || user?.email === 'dahafssi@gmail.com') && (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="sm:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-muted/50">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="flex flex-col gap-6 py-4">
                <Link
                  to={isImpersonating && userId ? `/admin/impersonate/${userId}/dashboard` : "/dashboard"}
                  className="flex items-center gap-3 font-bold text-lg"
                  onClick={() => setOpen(false)}
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <BookOpenCheck className="h-5 w-5 text-black dark:text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Journal<span className="text-red-600">X</span>
                  </span>
                  <Badge variant="secondary" className="text-xs">Pro</Badge>
                </Link>
                
                <nav className="flex flex-col gap-2">
                  {currentNavLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                        {isActive && (
                          <div className="ml-auto h-2 w-2 rounded-full bg-black dark:bg-white" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
                
                {/* Mobile User Info & Logout */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user ? getUserInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleLogout} 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 mt-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
