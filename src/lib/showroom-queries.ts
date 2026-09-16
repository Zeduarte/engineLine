import "server-only";
import { supabasePublic } from "@/lib/supabase/public";
import { parseShowroom } from "./showroom";
export async function getShowroomContent() {
  const { data, error } = await supabasePublic
    .from("site_content")
    .select("content")
    .eq("key", "showroom")
    .maybeSingle();
  if (error) console.error("getShowroomContent:", error.message);
  return parseShowroom(data?.content);
}
