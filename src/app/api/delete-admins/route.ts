// src/app/api/delete-admins/route.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, user_id } = await req.json();

    // DELETE ADMIN RECORD FIRST
    const { error: dbError } = await supabase
      .from("admins")
      .delete()
      .eq("id", id);

    if (dbError) {
      return Response.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    // DELETE AUTH USER SECOND
    const { error: authError } =
      await supabase.auth.admin.deleteUser(user_id);

    if (authError) {
      return Response.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}