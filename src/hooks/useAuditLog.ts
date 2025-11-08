import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuditLog = () => {
  const logAction = async (
    actionType: string,
    targetUserId: string | null,
    details?: Record<string, any>
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from("audit_logs").insert({
        admin_id: session.user.id,
        action_type: actionType,
        target_user_id: targetUserId,
        details: details || null,
      });
    } catch (error) {
      console.error("Failed to log audit action:", error);
      // Don't show error to user - audit logging should be silent
    }
  };

  return { logAction };
};
