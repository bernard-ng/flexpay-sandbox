import { Outlet, useRouterState } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function DashboardLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const title =
    pathname === "/gateway"
      ? "Gateway simulator"
      : pathname === "/settings"
        ? "Test configuration"
        : "Transactions";

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />

            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  Workspace
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <Badge variant="outline">
            <FlaskConical />
            Sandbox
          </Badge>
        </header>

        <main className="mx-auto grid w-full max-w-[1440px] flex-1 content-start gap-7 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        <footer className="flex flex-wrap justify-between gap-2 border-t px-6 py-4 text-xs text-muted-foreground">
          <span>FlexPay local sandbox</span>

          <span>Simulated payments for integration testing</span>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
