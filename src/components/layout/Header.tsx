
"use client";

import Link from 'next/link';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Palette, LogOut, UserCircle, Loader2 } from "lucide-react";
import { useTheme, type Theme } from "@/app/providers";
import { useAuth } from "@/app/providers"; // Import useAuth
import { useRouter } from 'next/navigation';

const themeOptions: { value: Theme, label: string, Icon: React.ElementType }[] = [
  { value: "dark", label: "BuildMaster Dark", Icon: Moon },
  { value: "theme-obsidian-dark", label: "Obsidian Dark", Icon: Moon },
  { value: "theme-arctic-light", label: "Arctic Light", Icon: Sun },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading, logout } = useAuth(); // Get auth state and functions
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // The AuthProvider will redirect to /auth
  };

  const handleLoginRedirect = () => {
    router.push('/auth');
  };

  return (
    <header className="py-6 mb-8 border-b border-border">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" aria-label="Go to Homepage">
          <div className="flex items-center gap-3 cursor-pointer">
            <LogoIcon className="h-8 w-auto" />
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle theme">
                <Palette className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {themeOptions.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setTheme(option.value)} className="cursor-pointer">
                  <option.Icon className="mr-2 h-4 w-4" />
                  <span>{option.label}</span>
                  {theme === option.value && <Sun className="ml-auto h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {authLoading ? (
            <Button variant="ghost" size="icon" disabled>
              <Loader2 className="h-5 w-5 animate-spin" />
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User account">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={handleLoginRedirect}>
              Login / Sign Up
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
