import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { fullName, email, password, role } = await req.json();

    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return Response.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    const { data: admin, error: dbError } = await supabase
      .from("admins")
      .insert({
        user_id: authUser.user.id,
        full_name: fullName,
        email,
        role,
        status: "Active",
      })
      .select()
      .single();

    if (dbError) {
      return Response.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      admin,
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}