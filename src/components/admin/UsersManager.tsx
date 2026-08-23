"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createUser, deleteUser, updateUserAccess } from "@/lib/actions/users";
import type { UserRole } from "@/lib/supabase/database.types";
import {
  assignableRoles,
  canManage,
  effectiveSections,
  ROLE_LABEL,
  SECTIONS,
  ALWAYS,
  type Role,
  type Section,
} from "@/lib/permissions";

export interface UserItem {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  allowed_sections: string[] | null;
  created_at: string;
}

const SECTION_LABEL: Record<Section, string> = SECTIONS.reduce(
  (acc, s) => ({ ...acc, [s.key]: s.label }),
  {} as Record<Section, string>,
);

export function UsersManager({
  users,
  currentUser,
  managerSections,
  canManageAuth,
}: {
  users: UserItem[];
  currentUser: { id: string; role: UserRole };
  managerSections: Section[];
  canManageAuth: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [showNew, setShowNew] = useState(false);

  const roles = assignableRoles(currentUser.role);
  const canCreate = canManageAuth && roles.length > 0;

  // Novo utilizador
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(roles[0] ?? "vendedor");

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUser({ full_name: name, email, password, role });
      if (res.ok) {
        toast.success("Utilizador criado.");
        setName("");
        setEmail("");
        setPassword("");
        setRole(roles[0] ?? "vendedor");
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
        {canCreate && (
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
          configure a variável <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor.
          Sem ela, ainda pode alterar papéis e permissões dos existentes.
        </div>
      )}

      {showNew && canCreate && (
        <form onSubmit={submitNew} className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
            Novo utilizador
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="field-label">Nome</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <span className="field-label">Email</span>
              <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <span className="field-label">Password (mín. 8)</span>
              <input type="text" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <span className="field-label">Papel</span>
              <select
                className="field"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-paper/40">
            Os separadores começam nos valores por defeito do papel; ajuste-os
            depois de criar, na lista abaixo.
          </p>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "A criar…" : "Criar utilizador"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {users.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            isSelf={u.id === currentUser.id}
            editable={
              u.id !== currentUser.id && canManage(currentUser.role, u.role)
            }
            assignable={roles}
            managerSections={managerSections}
            canDelete={canManageAuth}
            pending={pending}
            onSave={(r, secs) =>
              startTransition(async () => {
                const res = await updateUserAccess(u.id, r, secs);
                if (res.ok) toast.success("Permissões atualizadas.");
                else toast.error(res.error ?? "Erro.");
              })
            }
            onDelete={() => {
              if (!confirm(`Apagar ${u.full_name || u.email}? Irreversível.`)) return;
              startTransition(async () => {
                const res = await deleteUser(u.id);
                if (res.ok) toast.success("Utilizador apagado.");
                else toast.error(res.error ?? "Erro.");
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  editable,
  assignable,
  managerSections,
  canDelete,
  pending,
  onSave,
  onDelete,
}: {
  user: UserItem;
  isSelf: boolean;
  editable: boolean;
  assignable: Role[];
  managerSections: Section[];
  canDelete: boolean;
  pending: boolean;
  onSave: (role: UserRole, sections: string[]) => void;
  onDelete: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [open, setOpen] = useState(false);
  const [secs, setSecs] = useState<Set<string>>(
    () => new Set(effectiveSections(user.role, user.allowed_sections)),
  );

  function toggle(key: Section) {
    if (key === ALWAYS) return; // dashboard sempre ativo
    setSecs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-paper">
            {user.full_name || user.email}
            {isSelf && <span className="ml-2 text-xs text-accent">(você)</span>}
          </p>
          <p className="truncate text-xs text-paper/50">{user.email}</p>
        </div>

        <div className="flex items-center gap-2">
          {editable ? (
            <>
              <select
                value={role}
                disabled={pending}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="rounded-lg border border-white/10 bg-ink px-2 py-1.5 text-xs text-paper"
              >
                {assignable.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-paper/70 hover:border-accent hover:text-accent"
              >
                Separadores
              </button>
              {canDelete && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={onDelete}
                  className="rounded-lg px-2 py-1.5 text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-300"
                  title="Apagar"
                >
                  🗑
                </button>
              )}
            </>
          ) : (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-paper/70">
              {ROLE_LABEL[user.role as Role] ?? user.role}
            </span>
          )}
        </div>
      </div>

      {editable && open && (
        <div className="mt-4 border-t border-white/10 pt-4">
          {role === "admin" ? (
            <p className="text-xs text-paper/50">
              Um administrador tem acesso a todos os separadores.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-paper/50">
                Escolha os separadores a que este utilizador tem acesso.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {managerSections.map((s) => {
                  const locked = s === ALWAYS;
                  return (
                    <label
                      key={s}
                      className={`flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm ${
                        locked ? "opacity-60" : "cursor-pointer hover:border-white/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-[color:var(--accent)]"
                        checked={locked || secs.has(s)}
                        disabled={locked}
                        onChange={() => toggle(s)}
                      />
                      {SECTION_LABEL[s]}
                    </label>
                  );
                })}
              </div>
            </>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() => onSave(role, [...secs])}
            className="btn-primary mt-4 h-auto px-5 py-2 text-sm"
          >
            {pending ? "A guardar…" : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
