import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Phone, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { CollectionCase, CommunicationAttempt } from "@/lib/domain";

type CollectionTimelineProps = {
  caseItem: CollectionCase;
  communications: CommunicationAttempt[];
};

export function CollectionTimeline({
  caseItem,
  communications,
}: CollectionTimelineProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "EMAIL":
        return Mail;
      case "WHATSAPP":
        return MessageSquare;
      case "PHONE":
        return Phone;
      default:
        return MessageSquare;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
      case "DELIVERED":
        return CheckCircle2;
      case "FAILED":
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SENT":
      case "DELIVERED":
        return "default";
      case "FAILED":
        return "destructive";
      case "PENDING":
        return "secondary";
      default:
        return "outline";
    }
  };

  const sortedCommunications = [...communications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline de comunicaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedCommunications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay comunicaciones registradas para este caso.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedCommunications.map((comm, index) => {
              const ChannelIcon = getChannelIcon(comm.channel);
              const StatusIcon = getStatusIcon(comm.status);
              return (
                <div key={comm.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <ChannelIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {comm.direction === "OUTBOUND" ? "Enviado" : "Recibido"} por{" "}
                            {comm.channel}
                          </p>
                          <Badge variant={getStatusBadgeVariant(comm.status)}>
                            {comm.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <StatusIcon className="h-4 w-4" />
                          {new Date(comm.createdAt).toLocaleString("es-ES")}
                        </div>
                      </div>
                      {comm.subject && (
                        <p className="text-sm font-medium">{comm.subject}</p>
                      )}
                      {comm.body && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {comm.body}
                        </p>
                      )}
                      {comm.sentAt && (
                        <p className="text-xs text-muted-foreground">
                          Enviado: {new Date(comm.sentAt).toLocaleString("es-ES")}
                        </p>
                      )}
                      {comm.deliveredAt && (
                        <p className="text-xs text-muted-foreground">
                          Entregado:{" "}
                          {new Date(comm.deliveredAt).toLocaleString("es-ES")}
                        </p>
                      )}
                      {comm.error && (
                        <p className="text-xs text-destructive">{comm.error}</p>
                      )}
                    </div>
                  </div>
                  {index < sortedCommunications.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {caseItem.nextActionAt && (
          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-primary">
                  Próxima acción programada
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(caseItem.nextActionAt).toLocaleString("es-ES")}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

