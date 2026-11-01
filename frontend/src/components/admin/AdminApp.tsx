"use client";

import AdminShell from "./AdminShell";
import LeadsManager from "./LeadsManager";
import ResourceManager from "./ResourceManager";
import UsersManager from "./UsersManager";
import { RESOURCES } from "./resources";
import Empty from "../Empty";
import Dashboard from "./Dashboard";

/** Client-side admin app: /admin/<section>. AdminShell lets only admins in; the API enforces it too. */
export default function AdminApp({ section }: { section?: string }) {
  return (
    <AdminShell>
      {(me) => {
        if (!section) return <Dashboard me={me} />;
        if (section === "leads") return <LeadsManager />;
        if (section === "users") return <UsersManager />;
        if (RESOURCES[section]) return <ResourceManager key={section} resource={section} />;
        return <Empty>Không tìm thấy mục này.</Empty>;
      }}
    </AdminShell>
  );
}
