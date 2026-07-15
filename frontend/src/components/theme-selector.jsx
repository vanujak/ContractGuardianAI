import React, { useState, useEffect } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ThemeSelector() {
  const [theme, setTheme] = useState("system"); // Always default to system

  useEffect(() => {
    // Media query to check system dark mode preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const applyTheme = (currentTheme) => {
      const root = document.documentElement;
      
      if (currentTheme === "dark") {
        root.classList.add("dark");
        // Update body bg for dark mode explicitly
        document.body.style.backgroundColor = "#080B11";
        document.body.style.color = "#E6E9F0";
      } else if (currentTheme === "light") {
        root.classList.remove("dark");
        // Update body bg for light mode explicitly
        document.body.style.backgroundColor = "#F9FAFB";
        document.body.style.color = "#111827";
      } else {
        // System preference evaluation
        if (mediaQuery.matches) {
          root.classList.add("dark");
          document.body.style.backgroundColor = "#080B11";
          document.body.style.color = "#E6E9F0";
        } else {
          root.classList.remove("dark");
          document.body.style.backgroundColor = "#F9FAFB";
          document.body.style.color = "#111827";
        }
      }
    };

    // Initial theme application (forces system default on load)
    applyTheme("system");

    // Listener for system preference changes (runs only in system mode)
    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    // Add media query listener
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    // Perform manual theme shift when state changes
    applyTheme(theme);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const getThemeIcon = (currentTheme) => {
    switch (currentTheme) {
      case "dark":
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case "light":
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Laptop className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-[140px] bg-background border-border text-foreground h-8 rounded text-xs select-trigger-theme focus:ring-indigo-500">
          <div className="flex items-center gap-2">
            {getThemeIcon(theme)}
            <SelectValue placeholder="Theme" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border text-popover-foreground text-xs">
          <SelectItem value="system" className="cursor-pointer">
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              <span>System Default</span>
            </div>
          </SelectItem>
          <SelectItem value="dark" className="cursor-pointer">
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-indigo-450" />
              <span>Dark Mode</span>
            </div>
          </SelectItem>
          <SelectItem value="light" className="cursor-pointer">
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-550" />
              <span>Light Mode</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
