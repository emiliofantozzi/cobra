"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { CustomerCompany } from "@/lib/domain";

type ContactFiltersProps = {
  companies: CustomerCompany[];
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  onSearch: (search: string) => void;
  initialSearch?: string;
};

export function ContactFilters({
  companies,
  onFilterChange,
  onSearch,
  initialSearch = "",
}: ContactFiltersProps) {
  const [search, setSearch] = useState(initialSearch);
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [optOutFilter, setOptOutFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(search);
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [search, onSearch]);

  const handleCompanyChange = (value: string) => {
    setCompanyFilter(value);
    onFilterChange({ company: value === "all" ? undefined : value });
  };

  const handleChannelChange = (value: string) => {
    setChannelFilter(value);
    if (value === "whatsapp") {
      onFilterChange({ hasWhatsapp: "true" });
    } else if (value === "email") {
      onFilterChange({ hasEmail: "true" });
    } else {
      onFilterChange({ hasWhatsapp: undefined, hasEmail: undefined });
    }
  };

  const handleOptOutChange = (value: string) => {
    setOptOutFilter(value);
    if (value === "email") {
      onFilterChange({ optedOutEmail: "true" });
    } else if (value === "whatsapp") {
      onFilterChange({ optedOutWhatsapp: "true" });
    } else if (value === "any") {
      // Show contacts with any opt-out
      onFilterChange({ optedOutEmail: "true" }); // Simplified - would need OR logic
    } else {
      onFilterChange({ optedOutEmail: undefined, optedOutWhatsapp: undefined });
    }
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    onFilterChange({ role: value === "all" ? undefined : value });
  };

  const activeFiltersCount =
    (companyFilter !== "all" ? 1 : 0) +
    (channelFilter !== "all" ? 1 : 0) +
    (optOutFilter !== "all" ? 1 : 0) +
    (roleFilter !== "all" ? 1 : 0) +
    (search ? 1 : 0);

  const clearAllFilters = () => {
    setSearch("");
    setCompanyFilter("all");
    setChannelFilter("all");
    setOptOutFilter("all");
    setRoleFilter("all");
    onFilterChange({
      company: undefined,
      hasWhatsapp: undefined,
      hasEmail: undefined,
      optedOutEmail: undefined,
      optedOutWhatsapp: undefined,
      role: undefined,
      search: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nombre, email, teléfono..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={companyFilter} onValueChange={handleCompanyChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={handleChannelChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="whatsapp">Con WhatsApp</SelectItem>
            <SelectItem value="email">Con Email</SelectItem>
          </SelectContent>
        </Select>
        <Select value={optOutFilter} onValueChange={handleOptOutChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Opt-out" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="email">Opt-out Email</SelectItem>
            <SelectItem value="whatsapp">Opt-out WhatsApp</SelectItem>
            <SelectItem value="any">Cualquier Opt-out</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="BILLING_AP">Billing/AP</SelectItem>
            <SelectItem value="OPERATIONS">Operaciones</SelectItem>
            <SelectItem value="DECISION_MAKER">Decisor</SelectItem>
            <SelectItem value="OTHER">Otro</SelectItem>
          </SelectContent>
        </Select>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""}
            <button onClick={clearAllFilters} className="ml-1">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      {/* Quick filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant={channelFilter === "whatsapp" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleChannelChange(channelFilter === "whatsapp" ? "all" : "whatsapp")}
        >
          Con WhatsApp
        </Badge>
        <Badge
          variant={channelFilter === "email" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleChannelChange(channelFilter === "email" ? "all" : "email")}
        >
          Con Email
        </Badge>
        <Badge
          variant={optOutFilter !== "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleOptOutChange(optOutFilter === "all" ? "any" : "all")}
        >
          Opt-out activo
        </Badge>
        <Badge
          variant="outline"
          className="cursor-pointer"
          onClick={() => onFilterChange({ isPrimary: "true" })}
        >
          Contactos primarios
        </Badge>
        <Badge
          variant="outline"
          className="cursor-pointer"
          onClick={() => onFilterChange({ isBillingContact: "true" })}
        >
          Billing
        </Badge>
      </div>
    </div>
  );
}

