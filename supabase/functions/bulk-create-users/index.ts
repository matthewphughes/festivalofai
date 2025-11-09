import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
}

interface BulkCreateRequest {
  users: UserInput[];
  defaultRole?: string;
}

interface UserResult {
  email: string;
  success: boolean;
  error?: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin") || false;
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Parse request body
    const { users, defaultRole = "user" }: BulkCreateRequest = await req.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      throw new Error("Invalid request: users array is required");
    }

    if (users.length > 100) {
      throw new Error("Maximum 100 users per batch");
    }

    console.log(`Processing bulk create for ${users.length} users`);

    const results: UserResult[] = [];

    // Process each user
    for (const userInput of users) {
      try {
        const { firstName, lastName, email } = userInput;

        // Validate required fields
        if (!firstName || !lastName || !email) {
          results.push({
            email: email || "unknown",
            success: false,
            error: "Missing required fields (firstName, lastName, email)",
          });
          continue;
        }

        // Generate a random password (user will reset via forgot password)
        const randomPassword = crypto.randomUUID();
        const fullName = `${firstName} ${lastName}`;

        // Create user with auto-confirm enabled
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password: randomPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: fullName,
          },
        });

        if (createError) {
          // Check for duplicate email
          if (createError.message.includes("already registered")) {
            results.push({
              email,
              success: false,
              error: "Email already registered",
            });
          } else {
            results.push({
              email,
              success: false,
              error: createError.message,
            });
          }
          continue;
        }

        if (!newUser.user) {
          results.push({
            email,
            success: false,
            error: "Failed to create user",
          });
          continue;
        }

        // Assign default role
        const { error: roleError } = await supabaseClient
          .from("user_roles")
          .insert({
            user_id: newUser.user.id,
            role: defaultRole as "admin" | "user" | "speaker" | "attendee",
          });

        if (roleError) {
          console.error(`Failed to assign role to ${email}:`, roleError);
          // Don't fail the whole operation, just log it
        }

        console.log(`Successfully created user: ${email}`);

        results.push({
          email,
          success: true,
          userId: newUser.user.id,
        });

      } catch (error: any) {
        console.error(`Error creating user ${userInput.email}:`, error);
        results.push({
          email: userInput.email,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    // Log audit action
    const successCount = results.filter(r => r.success).length;
    await supabaseClient.from("audit_logs").insert({
      admin_id: user.id,
      action_type: "bulk_create_users",
      target_user_id: null,
      details: {
        total_count: users.length,
        success_count: successCount,
        failed_count: users.length - successCount,
        default_role: defaultRole,
      },
    });

    return new Response(
      JSON.stringify({
        results,
        summary: {
          total: users.length,
          successful: successCount,
          failed: users.length - successCount,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in bulk-create-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" || error.message === "Admin access required" ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
