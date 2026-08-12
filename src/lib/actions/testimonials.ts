"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface TResult {
  ok: boolean;
  error?: string;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/testemunhos");
}

export async function createTestimonial(input: {
  name: string;
  rating: number;
  body: string;
  role?: string;
}): Promise<TResult> {
  const name = input.name?.trim();
  const body = input.body?.trim();
  const rating = Math.min(5, Math.max(1, Number(input.rating) || 5));
  if (!name || !body) return { ok: false, error: "Nome e texto obrigatórios." };

  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").insert({
    name,
    body,
    rating,
    role: input.role?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function setTestimonialPublished(
  id: string,
  published: boolean,
): Promise<TResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("testimonials")
    .update({ published })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteTestimonial(id: string): Promise<TResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
