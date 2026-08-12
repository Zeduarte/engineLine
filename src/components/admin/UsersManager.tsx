"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createUser, deleteUser, updateUserRole } from "@/lib/actions/users";
import type { UserRole } from "@/lib/supabase/database.types";

export interface UserItem {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
};

export function UsersManager({
  users,
  currentUserId,
  canManageAuth,
}: {
  users: UserItem[];
  currentUserId: string;
  canManageAuth: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [showNew, setShowNew] = useState(false);

  // Novo utilizador
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("vendedor");

  function changeRole(id: string, r: UserRole) {
    startTransition(async () => {
      const res = await updateUserRole(id, r);
      if (res.ok) toast.success("Permissão atualizada.");
      else toast.error(res.error ?? "Erro.");
    });
  }

  function remove(id: string, label: string) {
    if (!confirm(`Apagar o utilizador ${label}? Esta ação é irreversível.`))
      return;
    startTransition(async () => {
      const res = await deleteUser(id);
      if (res.ok) toast.success("Utilizador apagado.");
      else toast.error(res.error ?? "Erro.");
    });
  }

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUser({
        full_name: name,
        email,
        password,
        role,
      });
      if (res.ok) {
        toast.success("Utilizador criado.");
        setName("");
        setEmail("");
        setPassword("");
        setRole("vendedor");
        setShowNew(false);
      } else {
        toast.error(res.error ?? "Erro ao criar.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-paper/50">
          {users.length} {users.length === 1 ? "utilizador" : "utilizadores"}
        </p>
        {canManageAuth && (
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="btn-primary"
          >
            {showNew ? "Cancelar" : "＋ Novo utilizador"}
          </button>
        )}
      </div>

      {!canManageAuth && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Para <strong>criar</strong> ou <strong>apagar</strong> utilizadores,
          configure a variável <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor
          (Vercel → Environment Variables). Sem ela, ainda pode alterar
          permissões de utilizadores existentes.
        </div>
      )}

      {showNew && canManageAuth && (
        <form onSubmit={submitNew} className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
            Novo utilizador
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="field-label">Nome</span>
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <span className="field-label">Email</span>
              <input
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <span className="field-label">Password (mín. 8)</span>
              <input
                type="text"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <span className="field-label">Permissão</span>
              <select
                className="field"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "A criar…" : "Criar utilizador"}
          </button>
        </form>
      )}

      <div className="card divide-y divide-white/5">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-paper">
                  {u.full_name || u.email}
                  {isSelf && (
                    <span className="ml-2 text-xs text-accent">(você)</span>
                  )}
                </p>
                <p className="truncate text-xs text-paper/50">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  disabled={pending || isSelf}
                  onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                  className="rounded-lg border border-white/10 bg-ink px-2 py-1.5 text-xs text-paper disabled:opacity-50"
                  title={isSelf ? "Não pode alterar o seu próprio role" : ""}
                >
                  <option value="vendedor">{ROLE_LABEL.vendedor}</option>
                  <option value="admin">{ROLE_LABEL.admin}</option>
                </select>
                {canManageAuth && !isSelf && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(u.id, u.full_name || u.email || "")}
                    className="rounded-lg px-2 py-1.5 text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-300"
                    title="Apagar"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
