
"use client";

import { LogoIcon } from '@/components/icons/LogoIcon';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Palette } from "lucide-react";
import { useTheme, type Theme } from "@/app/providers";

const themeOptions: { value: Theme, label: string, Icon: React.ElementType }[] = [
  { value: "dark", label: "BuildMaster Dark", Icon: Moon },
  { value: "theme-obsidian-dark", label: "Obsidian Dark", Icon: Moon },
  { value: "theme-arctic-light", label: "Arctic Light", Icon: Sun },
];

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="py-6 mb-8 border-b border-border">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-8 w-auto" />
        </div>
        
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
      </div>
    </header>
  );
}
