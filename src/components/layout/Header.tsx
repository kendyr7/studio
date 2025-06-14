import { LogoIcon } from '@/components/icons/LogoIcon';

export function Header() {
  return (
    <header className="py-6 mb-8 border-b border-border">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-8 w-auto" />
        </div>
        {/* Placeholder for future elements like dark mode toggle or user profile */}
      </div>
    </header>
  );
}
