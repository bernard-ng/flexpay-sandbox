"use client";

import * as React from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { infoQuery } from "@/lib/queries";
import { useWorkspace, useWorkspaceActions } from "@/app/workspace-store";

import { Activity, CreditCard, LayoutDashboard, Settings2 } from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "./ui/sidebar";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const page =
    pathname === "/gateway"
      ? "gateway"
      : pathname === "/settings"
        ? "settings"
        : "transactions";

  const filter = useWorkspace((state) => state.status);
  const update = useWorkspaceActions();
  const { data: info } = useQuery(infoQuery);

  const merchant = info?.merchant ?? "Local merchant";

  function onNavigate(page: "transactions" | "gateway" | "settings") {
    void navigate({
      to:
        page === "gateway"
          ? "/gateway"
          : page === "settings"
            ? "/settings"
            : "/",
    });
  }

  function onFilter(status: string) {
    update({ status });
  }

  const items = [
    {
      title: "Transactions",
      icon: <LayoutDashboard />,
      isActive: page === "transactions",
      onSelect: () => onNavigate("transactions"),
      items: [
        ["all", "All payments"],
        ["0", "Succeeded"],
        ["2", "Pending"],
        ["1", "Failed"],
      ].map(([value, title]) => ({
        title,
        isActive: page === "transactions" && filter === value,
        onSelect: () => {
          onNavigate("transactions");
          onFilter(value);
        },
      })),
    },
    {
      title: "Gateway simulator",
      icon: <CreditCard />,
      isActive: page === "gateway",
      onSelect: () => onNavigate("gateway"),
    },
    {
      title: "Test configuration",
      icon: <Settings2 />,
      isActive: page === "settings",
      onSelect: () => onNavigate("settings"),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            { name: "FlexPay", logo: <Activity />, plan: "Local sandbox" },
          ]}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{ name: merchant, description: "Local test merchant" }}
          onConfigure={() => onNavigate("settings")}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
