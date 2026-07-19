import React from "react";
import { 
  User, 
  Briefcase, 
  Building, 
  Home, 
  UserCheck, 
  Cpu, 
  Coins, 
  Scale,
  ShieldCheck
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const getPartyIcon = (role) => {
  const r = (role || "").toLowerCase();
  if (r.includes("employee") || r.includes("freelancer") || r.includes("workman") || r.includes("staff")) return Briefcase;
  if (r.includes("employer") || r.includes("company") || r.includes("corporation") || r.includes("firm")) return Building;
  if (r.includes("tenant") || r.includes("renter")) return Home;
  if (r.includes("landlord") || r.includes("owner") || r.includes("properties")) return Coins;
  if (r.includes("client") || r.includes("contractor")) return UserCheck;
  if (r.includes("founder") || r.includes("startup") || r.includes("discloser")) return Cpu;
  if (r.includes("investor") || r.includes("partner") || r.includes("recipient")) return Scale;
  return User;
};

export const getPartyColor = (role) => {
  const r = (role || "").toLowerCase();
  if (r.includes("employee") || r.includes("freelancer")) return "text-blue-400";
  if (r.includes("employer") || r.includes("company")) return "text-indigo-400";
  if (r.includes("tenant")) return "text-amber-400";
  if (r.includes("landlord")) return "text-orange-400";
  if (r.includes("client") || r.includes("contractor")) return "text-emerald-400";
  if (r.includes("founder") || r.includes("startup") || r.includes("discloser")) return "text-purple-400";
  if (r.includes("investor") || r.includes("partner") || r.includes("recipient")) return "text-pink-400";
  return "text-slate-400";
};

export default function PartySelector({ parties = [], activeParty, onChange, disabled }) {
  if (!parties || parties.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <ShieldCheck className="w-4 h-4 text-indigo-400 animate-pulse" />
        Detecting Parties...
      </div>
    );
  }

  const currentRole = activeParty?.partyRole || "";
  const currentName = activeParty?.partyName || "";
  const ActiveIcon = getPartyIcon(currentRole);

  const getPartyLabel = (party) => {
    return `${party.partyName} (${party.partyRole})`;
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Opinions For:
      </span>
      <Select
        value={currentName}
        onValueChange={(name) => {
          const selected = parties.find(p => p.partyName === name);
          if (selected) onChange(selected);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-[240px] bg-background border-border text-foreground h-9 rounded-md focus:ring-indigo-500 text-left">
          <div className="flex items-center gap-2 truncate">
            <ActiveIcon className={`w-4 h-4 shrink-0 ${getPartyColor(currentRole)}`} />
            <span className="truncate text-xs font-medium">
              {currentName ? `${currentName} (${currentRole})` : "Select Party"}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border text-popover-foreground">
          {parties.map((party) => {
            const IconComponent = getPartyIcon(party.partyRole);
            return (
              <SelectItem
                key={party.partyName}
                value={party.partyName}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className={`w-4 h-4 shrink-0 ${getPartyColor(party.partyRole)}`} />
                  <span className="text-xs font-medium">{getPartyLabel(party)}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
