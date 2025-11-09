import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CollectionCase } from "@/lib/domain";

type CollectionCaseOverviewProps = {
  caseItem: CollectionCase;
};

export function CollectionCaseOverview({
  caseItem,
}: CollectionCaseOverviewProps) {
  const getStageBadgeVariant = (stage: string) => {
    switch (stage) {
      case "INITIAL":
        return "secondary";
      case "REMINDER_1":
      case "REMINDER_2":
        return "default";
      case "ESCALATED":
        return "destructive";
      case "PROMISE_TO_PAY":
        return "outline";
      case "RESOLVED":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PAUSED":
        return "secondary";
      case "CLOSED":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Caso de cobranza #{caseItem.id.slice(0, 8)}</CardTitle>
          <div className="flex gap-2">
            <Badge variant={getStageBadgeVariant(caseItem.stage)}>
              {caseItem.stage}
            </Badge>
            <Badge variant={getStatusBadgeVariant(caseItem.status)}>
              {caseItem.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Última comunicación
            </p>
            <p className="text-sm">
              {caseItem.lastCommunicationAt
                ? new Date(caseItem.lastCommunicationAt).toLocaleString("es-ES")
                : "Nunca"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Próxima acción
            </p>
            <p className="text-sm">
              {caseItem.nextActionAt
                ? new Date(caseItem.nextActionAt).toLocaleString("es-ES")
                : "Sin programar"}
            </p>
          </div>
          {caseItem.escalationAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Escalado el
              </p>
              <p className="text-sm">
                {new Date(caseItem.escalationAt).toLocaleString("es-ES")}
              </p>
            </div>
          )}
          {caseItem.closedAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Cerrado el
              </p>
              <p className="text-sm">
                {new Date(caseItem.closedAt).toLocaleString("es-ES")}
              </p>
            </div>
          )}
        </div>
        {caseItem.summary && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Resumen</p>
            <p className="text-sm whitespace-pre-wrap">{caseItem.summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

