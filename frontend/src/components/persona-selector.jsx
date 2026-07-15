import React from "react";
import { 
  User, 
  Briefcase, 
  Building, 
  Home, 
  UserCheck, 
  Cpu, 
  Coins, 
  ShieldAlert,
  Scale
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PERSONAS = [
  { id: "Employee", label: "Employee", icon: Briefcase, color: "text-blue-400" },
  { id: "Employer", label: "Employer", icon: Building, color: "text-indigo-400" },
  { id: "Freelancer", label: "Freelancer", icon: User, color: "text-teal-400" },
  { id: "Client", label: "Client", icon: UserCheck, color: "text-emerald-400" },
  { id: "Tenant", label: "Tenant", icon: Home, color: "text-amber-400" },
  { id: "Landlord", label: "Landlord", icon: Coins, color: "text-orange-400" },
  { id: "StartupFounder", label: "Startup Founder", icon: Cpu, color: "text-purple-400" },
  { id: "Investor", label: "Investor", icon: Scale, color: "text-pink-400" },
];

export default function PersonaSelector({ currentPersona, onChange, disabled }) {
  const getPersonaIcon = (personaId) => {
    const persona = PERSONAS.find(p => p.id === personaId);
    if (!persona) return Briefcase;
    return persona.icon;
  };

  const getPersonaColor = (personaId) => {
    const persona = PERSONAS.find(p => p.id === personaId);
    return persona ? persona.color : "text-gray-400";
  };

  const ActiveIcon = getPersonaIcon(currentPersona);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Reviewing As:
      </span>
      <Select
        value={currentPersona}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[200px] bg-background border-border text-foreground h-9 rounded-md focus:ring-indigo-500">
          <div className="flex items-center gap-2">
            <ActiveIcon className={`w-4 h-4 ${getPersonaColor(currentPersona)}`} />
            <SelectValue placeholder="Select Persona" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border text-popover-foreground">
          {PERSONAS.map((persona) => {
            const IconComponent = persona.icon;
            return (
              <SelectItem
                key={persona.id}
                value={persona.id}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className={`w-4 h-4 ${persona.color}`} />
                  <span>{persona.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
