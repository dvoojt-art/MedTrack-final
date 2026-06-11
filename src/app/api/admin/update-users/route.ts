import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { user_id, email } = await req.json();

    const { error } = await supabase.auth.admin.updateUserById(user_id, {
      email,
    });

    if (error) {
      return Response.json(
        { error: error.message },
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