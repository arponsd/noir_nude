import { redirect } from "next/navigation";

export const metadata = { title: "Admin" };

// The admin root simply forwards to the dashboard — keeps /admin a valid entry
// without duplicating the dashboard render.
export default function AdminHomePage(): never {
  redirect("/admin/dashboard");
}
