import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <h1 className="text-2xl font-semibold">404</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La página que buscas no existe.
          </p>
          <Link href="/dashboard" className="mt-6">
            <Button>Volver al dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

