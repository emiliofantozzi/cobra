"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Organization = {
  id: string;
  name: string;
  isActive: boolean;
};

type OrganizationSwitcherProps = {
  organizations: Organization[];
  activeOrganizationId: string;
};

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function switchOrganization(organizationId: string) {
    if (organizationId === activeOrganizationId) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      
      const response = await fetch("/api/organizations/switch", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.refresh();
      }
    });
  }

  const activeOrg = organizations.find((org) => org.isActive);

  return (
    <Select
      value={activeOrganizationId}
      onValueChange={switchOrganization}
      disabled={isPending}
    >
      <SelectTrigger className="w-[200px]">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Seleccionar organización" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

