"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type User = {
  userLoginID: string;
  userName: string;
  userRole: string;        // Contoh: "ADMIN, SUPPORT"
  accessModules: string[]; // Sentiasa normalized ke array bersih
};

const ROLE_OPTIONS = ["ADMIN", "HR ADMIN", "SUPPORT", "HOD", "CEO", "STAFF"] as const;
const MODULE_CATALOG = ["IT", "HR", "PUR", "FIN", "MAINT", "DISP", "TRAN", "WP"] as const;

// ---------- Helpers (Roles) ----------
const parseRoles = (roleStr: string) =>
  (roleStr || "")
    .split(",")
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean);

const rolesToString = (roles: string[]) =>
  Array.from(new Set(roles.map((r) => r.trim().toUpperCase()).filter(Boolean))).join(", ");

// ---------- Helpers (Modules Normalization KEBAL) ----------
const cleanToken = (s: string) =>
  s
    .replace(/^\s*\[|\]\s*$/g, "")  // buang bracket di hujung
    .replace(/^"+|"+$/g, "")        // buang " di hujung
    .replace(/^'+|'+$/g, "")        // buang ' di hujung
    .trim()
    .toUpperCase();

const isValidModuleCode = (s: string) => /^[A-Z0-9_]{2,12}$/.test(s);

// Transform apa jua input kepada ARRAY modul yang bersih & unik
const normalizeModules = (value: any): string[] => {
  try {
    let tokens: string[] = [];

    if (Array.isArray(value)) {
      // Kes: text[] atau array JS dengan elemen yang mungkin JSON-string
      tokens = value
        .map((v) => {
          const str = String(v).trim();
          // Jika elemen macam '["IT"]', cuba parse
          if ((str.startsWith("[") && str.endsWith("]")) || (str.startsWith('"') && str.endsWith('"'))) {
            try {
              const parsed = JSON.parse(str);
              if (Array.isArray(parsed)) return parsed.join(" ");
              if (typeof parsed === "string") return parsed;
            } catch {
              // fallback ke string asal
            }
          }
          return str;
        })
        .flatMap((x) =>
          // Pecah jika ada CSV yang melekat (jarang, tapi kita robust)
          x.includes(",") ? x.split(",") : [x]
        );
    } else if (typeof value === "string") {
      const str = value.trim();
      // Jika string kelihatan JSON, cuba parse
      if ((str.startsWith("[") && str.endsWith("]")) || (str.startsWith('"') && str.endsWith('"'))) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            tokens = parsed.map(String);
          } else if (typeof parsed === "string") {
            tokens = parsed.split(/[,\s]+/);
          } else {
            tokens = [String(parsed)];
          }
        } catch {
          // fallback CSV/single
          tokens = str.split(/[,\s]+/);
        }
      } else {
        tokens = str.split(/[,\s]+/);
      }
    } else if (value && typeof value === "object") {
      // Kes: objek pelik (jsonb), cuba ambil values
      const arr = Array.isArray(value) ? value : Object.values(value);
      tokens = arr.map(String);
    }

    // Bersihkan + tapis hanya kod sah + unik
    const cleaned = Array.from(
      new Set(
        tokens.map(cleanToken).filter((t) => t && isValidModuleCode(t))
      )
    );

    return cleaned;
  } catch {
    return [];
  }
};

// Build katalog modul untuk UI dari data bersih
const buildModuleCatalog = (users: User[]) => {
  const fromUsers = users.flatMap((u) => normalizeModules(u.accessModules));
  return Array.from(new Set([...MODULE_CATALOG.map(String), ...fromUsers]))
    .map(cleanToken)
    .filter((m) => m && isValidModuleCode(m))
    .sort();
};

// Debounce kecil
function useDebouncedValue<T>(value: T, delay = 250) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

export default function AdminMasterPanel() {
  const router = useRouter();

  const [hasAccess, setHasAccess] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debSearch = useDebouncedValue(searchTerm, 200);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Self lockout guard
  const [currentLoginID, setCurrentLoginID] = useState<string>("");

  // Guard ADMIN
  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const roles = parseRoles(role);
    const myLoginID = localStorage.getItem("userLoginID") || "";
    setCurrentLoginID(myLoginID);

    if (!roles.includes("ADMIN")) {
      router.push("/");
    } else {
      setHasAccess(true);
    }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const { data, error } = await supabase
        .from("Employees")
        .select("userLoginID, userName, userRole, accessModules")
        .order("userName", { ascending: true });

      if (error) throw error;

      const formatted: User[] =
        (data || []).map((u: any) => ({
          userLoginID: u.userLoginID,
          userName: u.userName,
          userRole: rolesToString(parseRoles(u.userRole || "")),     // normalize roles
          accessModules: normalizeModules(u.accessModules),          // normalize modules (KEBAL)
        })) ?? [];

      setUsers(formatted);
    } catch (err: any) {
      setFetchError(err?.message || "Ralat memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    fetchUsers();
  }, [hasAccess, fetchUsers]);

  // ESC untuk tutup modal
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

  // Tapis carian
  const filteredUsers = useMemo(() => {
    const q = debSearch.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.userName || "").toLowerCase().includes(q) ||
        (u.userLoginID || "").toLowerCase().includes(q) ||
        (u.userRole || "").toLowerCase().includes(q)
    );
  }, [users, debSearch]);

  // Toggle module akses
  const toggleModule = (module: string) => {
    if (!selectedUser) return;
    const current = normalizeModules(selectedUser.accessModules);
    const mod = cleanToken(module);
    const idx = current.indexOf(mod);
    if (idx > -1) current.splice(idx, 1);
    else current.push(mod);
    setSelectedUser({ ...selectedUser, accessModules: current });
  };

  // Toggle role (multi-role)
  const toggleRole = (roleKey: string) => {
    if (!selectedUser) return;
    const roles = parseRoles(selectedUser.userRole);
    const r = roleKey.trim().toUpperCase();
    const idx = roles.indexOf(r);
    if (idx > -1) roles.splice(idx, 1);
    else roles.push(r);
    setSelectedUser({ ...selectedUser, userRole: rolesToString(roles) });
  };

  // Simpan perubahan
  const handleUpdateAccess = async () => {
    if (!selectedUser) return;

    const isSelf = selectedUser.userLoginID === currentLoginID;
    const newRoles = Array.from(new Set(parseRoles(selectedUser.userRole)));
    if (isSelf && !newRoles.includes("ADMIN")) {
      setSaveError("Anda tidak boleh membuang role ADMIN dari akaun sendiri (elak lockout).");
      setTimeout(() => setSaveError(null), 2500);
      return;
    }

    setSaving(true);
    setSaveError(null);
    setOkMsg(null);

    try {
      const cleanedModules = Array.from(new Set(normalizeModules(selectedUser.accessModules)));

      const payload = {
        userRole: rolesToString(newRoles),
        accessModules: cleanedModules,
      };

      const { error } = await supabase
        .from("Employees")
        .update(payload)
        .eq("userLoginID", selectedUser.userLoginID);

      if (error) throw error;

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.userLoginID === selectedUser.userLoginID ? { ...u, ...payload } : u
        )
      );

      setOkMsg("Perubahan berjaya disimpan.");
      setTimeout(() => setOkMsg(null), 1500);
      setIsModalOpen(false);
    } catch (err: any) {
      setSaveError(err?.message || "Ralat menyimpan perubahan.");
      setTimeout(() => setSaveError(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  // (Pilihan) Normalize semua rekod sedia ada ( sekali klik )
  const normalizeAllUsersNow = async () => {
    try {
      const { data, error } = await supabase
        .from("Employees")
        .select("userLoginID, accessModules");

      if (error) throw error;
      const updates = (data || []).map((u: any) => {
        const cleaned = Array.from(new Set(normalizeModules(u.accessModules)));
        return { userLoginID: u.userLoginID, accessModules: cleaned };
      });

      // Upsert satu-satu (atau guna loop untuk batch kecil)
      for (const row of updates) {
        await supabase
          .from("Employees")
          .update({ accessModules: row.accessModules })
          .eq("userLoginID", row.userLoginID);
      }

      await fetchUsers();
      alert("Selesai normalize semua rekod accessModules.");
    } catch (e: any) {
      alert("Gagal normalize semua: " + (e?.message || "Unknown error"));
    }
  };

  if (!hasAccess || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-600 font-black animate-pulse uppercase tracking-[0.5em]">
        Initializing_Protocol...
      </div>
    );
  }

  const moduleCatalog = buildModuleCatalog(users);

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 p-4 md:p-10 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
        {/* HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-zinc-900/20 p-6 rounded-[2rem] border border-zinc-900">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">
              Identity<span className="text-zinc-700">Vault</span>
            </h1>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1">
              Management Console / {filteredUsers.length} Records Found
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-96 group">
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest focus:outline-none focus:border-red-600 transition-all uppercase"
              />
            </div>
            {/* (Optional) Normalize semua */}
            <button
              onClick={normalizeAllUsersNow}
              className="px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
              title="Bersihkan accessModules semua pengguna (sekali klik)"
            >
              Normalize All
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="mb-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
            {fetchError}
          </div>
        )}

        {/* TABLE */}
        <div className="flex-1 bg-zinc-900/10 border border-zinc-900 rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 custom-scrollbar p-4">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                  <th className="pb-4 pl-8">Personnel</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4 text-center">Modules</th>
                  <th className="pb-4 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const cleanedModules = normalizeModules(user.accessModules);
                  const modulePreview = cleanedModules.slice(0, 4);
                  const extra = Math.max(0, cleanedModules.length - modulePreview.length);

                  return (
                    <tr key={user.userLoginID} className="group transition-all">
                      <td className="bg-zinc-900/30 py-4 pl-8 rounded-l-2xl border-y border-l border-zinc-900 group-hover:border-zinc-700">
                        <div className="font-bold text-sm">{user.userName}</div>
                        <div className="text-[9px] text-zinc-600 font-black italic">{user.userLoginID}</div>
                      </td>

                      <td className="bg-zinc-900/30 py-4 border-y border-zinc-900 group-hover:border-zinc-700">
                        <div className="flex flex-wrap gap-1">
                          {parseRoles(user.userRole).map((r) => (
                            <span
                              key={r}
                              className="text-[8px] font-black px-3 py-1 bg-zinc-800 text-zinc-300 rounded-md uppercase"
                            >
                              {r}
                            </span>
                          ))}
                          {parseRoles(user.userRole).length === 0 && (
                            <span className="text-[8px] font-black px-3 py-1 bg-zinc-800 text-zinc-500 rounded-md uppercase">
                              NO ROLE
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="bg-zinc-900/30 py-4 border-y border-zinc-900 group-hover:border-zinc-700">
                        <div className="flex justify-center gap-1">
                          {modulePreview.map((mod, idx) => (
                            <span
                              key={`${mod}-${idx}`}
                              className="px-2 h-5 flex items-center justify-center text-[8px] font-black bg-white text-black rounded-sm"
                            >
                              {mod}
                            </span>
                          ))}
                          {extra > 0 && (
                            <span className="px-2 h-5 flex items-center justify-center text-[8px] font-black bg-zinc-800 text-zinc-300 rounded-sm">
                              +{extra}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="bg-zinc-900/30 py-4 pr-8 rounded-r-2xl border-y border-r border-zinc-900 group-hover:border-zinc-700 text-right">
                        <button
                          onClick={() => {
                            // Pastikan selectedUser juga bersih
                            setSelectedUser({
                              ...user,
                              accessModules: normalizeModules(user.accessModules),
                              userRole: rolesToString(parseRoles(user.userRole)),
                            });
                            setIsModalOpen(true);
                          }}
                          className="text-lg hover:text-red-600 transition-colors"
                          title="Edit akses & role"
                        >
                          ⚙️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="py-16 text-center text-zinc-600 text-xs uppercase tracking-widest">
                Tiada rekod padanan carian.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-zinc-800 rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6">
              Access Protocol
            </h3>

            {/* Feedback */}
            {saveError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
                {saveError}
              </div>
            )}
            {okMsg && (
              <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded-xl">
                {okMsg}
              </div>
            )}

            {/* User summary */}
            <div className="mb-6 flex items-center justify-between bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl">
              <div>
                <p className="font-bold">{selectedUser.userName}</p>
                <p className="text-[10px] text-zinc-500 uppercase">{selectedUser.userLoginID}</p>
              </div>
              <div className="text-[10px] text-zinc-500 uppercase">
                {selectedUser.userRole || "NO ROLE"}
              </div>
            </div>

            {/* Roles */}
            <div className="mb-6">
              <label className="text-[9px] font-black text-zinc-600 uppercase block mb-3">
                Authority Level (Multi-Role)
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => {
                  const active = parseRoles(selectedUser.userRole).includes(r);
                  return (
                    <button
                      key={r}
                      onClick={() => toggleRole(r)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${
                        active
                          ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modules */}
            <div className="mb-6">
              <label className="text-[9px] font-black text-zinc-600 uppercase block mb-3">
                Module Access Protocol
              </label>

              <div className="flex flex-wrap gap-2 mb-3">
                {moduleCatalog.map((m) => {
                  const isActive = selectedUser.accessModules?.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleModule(m)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${
                        isActive
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* Add custom module (sanitized) */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const v = prompt("Masukkan kod module baharu (contoh: STORE, QC):");
                    if (!v) return;

                    const code = cleanToken(v);
                    if (!code) return;
                    if (!isValidModuleCode(code)) {
                      alert("Kod modul mesti 2-12 aksara (A-Z, 0-9, atau _).");
                      return;
                    }
                    toggleModule(code);
                  }}
                  className="px-4 py-2 border border-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:border-red-600 hover:text-red-600 transition-all"
                >
                  + Add Custom Module
                </button>
                <button
                  onClick={() =>
                    setSelectedUser({
                      ...selectedUser,
                      accessModules: [],
                    })
                  }
                  className="px-4 py-2 border border-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-zinc-600 transition-all"
                >
                  Reset Modules
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAccess}
                disabled={saving}
                className="flex-1 bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer bar kecil */}
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          ← ACTMAX HUB
        </button>
      </div>
    </div>
  );
}