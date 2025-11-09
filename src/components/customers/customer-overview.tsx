import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CustomerCompany } from "@/lib/domain";

type CustomerOverviewProps = {
  customer: CustomerCompany;
};

export function CustomerOverview({ customer }: CustomerOverviewProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{customer.name}</CardTitle>
          <Badge variant={getStatusBadgeVariant(customer.status)}>
            {customer.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {customer.legalName && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Razón social
            </p>
            <p className="text-sm">{customer.legalName}</p>
          </div>
        )}
        {customer.taxId && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
            <p className="font-mono text-sm">{customer.taxId}</p>
          </div>
        )}
        {customer.industry && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Industria
            </p>
            <p className="text-sm">{customer.industry}</p>
          </div>
        )}
        {customer.website && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Website</p>
            <a
              href={customer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {customer.website}
            </a>
          </div>
        )}
        {customer.notes && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Notas</p>
            <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

