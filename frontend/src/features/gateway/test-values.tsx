import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TestValues() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick test values</CardTitle>

        <CardDescription>
          These are the defaults. Your saved configuration takes precedence.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        {[
          [
            ["243810000001", "Success"],
            ["243810000002", "Failure"],
            ["243810000003", "Pending"],
          ],
          [
            ["4242 4242 4242 4242", "Success"],
            ["4000 0000 0000 0002", "Declined"],
          ],
        ].map((group, index) => (
          <div key={index} className="grid content-start gap-3">
            {group.map(([value, label]) => (
              <div key={value} className="flex flex-wrap items-center gap-3">
                <code className="text-xs">{value}</code>
                <Badge variant="outline">{label}</Badge>
              </div>
            ))}
          </div>
        ))}

        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link to="/settings" />}
        >
          Configure test values
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}
