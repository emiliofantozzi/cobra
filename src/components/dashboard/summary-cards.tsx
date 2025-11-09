import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Building2, FileText, AlertCircle } from "lucide-react";

type SummaryCardsProps = {
  totalCustomers?: number;
  totalInvoices?: number;
  activeCases?: number;
  overdueInvoices?: number;
};

export function SummaryCards({
  totalCustomers = 0,
  totalInvoices = 0,
  activeCases = 0,
  overdueInvoices = 0,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Clientes",
      value: totalCustomers,
      icon: Building2,
      color: "text-chart-1",
    },
    {
      title: "Facturas",
      value: totalInvoices,
      icon: FileText,
      color: "text-chart-2",
    },
    {
      title: "Casos activos",
      value: activeCases,
      icon: Receipt,
      color: "text-chart-3",
    },
    {
      title: "Vencidas",
      value: overdueInvoices,
      icon: AlertCircle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

