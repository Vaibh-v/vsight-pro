import type { NextApiRequest, NextApiResponse } from "next";
import { listRules, saveRule, deleteRule, type AlertRule } from "@/lib/alerts/rules";
import { resolveUserRole, canEdit } from "@/lib/auth/roles";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const role = resolveUserRole();
  if (req.method === "GET") {
    return res.status(200).json({ items: listRules() });
  }
  if (!canEdit(role)) return res.status(403).json({ error: "forbidden" });

  if (req.method === "POST") {
    const body = req.body as AlertRule;
    if (!body?.id) return res.status(400).json({ error: "missing id" });
    saveRule(body);
    return res.status(200).json({ ok: true });
  }
  if (req.method === "DELETE") {
    const id = String((req.query.id ?? "")).trim();
    if (!id) return res.status(400).json({ error: "missing id" });
    deleteRule(id);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}
