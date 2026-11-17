import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { companySchema } from "@/lib/commercial/schemas";

export type Permission = "read" | "write" | "approve" | "configure" | "import";
export async function requirePermission(permission: Permission) {
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error("unauthenticated");
  const selected = (await cookies()).get("cej-company")?.value;
  const { data: members, error: memberError } = await db
    .from("company_memberships")
    .select("company_id,role")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("company_id");
  if (memberError || !members?.length) throw new Error("permission_denied");
  const member = members.find((m) => m.company_id === selected) ?? members[0];
  if (
    (permission === "write" && member.role === "viewer") ||
    (["approve", "import"].includes(permission) &&
      !["owner", "admin"].includes(member.role)) ||
    (permission === "configure" && member.role !== "owner")
  )
    throw new Error("permission_denied");
  const { data: company, error: companyError } = await db
    .from("companies")
    .select("*")
    .eq("id", member.company_id)
    .single();
  if (companyError) throw new Error("permission_denied");
  return {
    db,
    userId: user.id,
    company: companySchema.parse(company),
    role: String(member.role),
    members,
  };
}
