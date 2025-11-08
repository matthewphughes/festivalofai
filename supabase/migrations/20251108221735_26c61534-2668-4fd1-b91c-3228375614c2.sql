-- Add DELETE policy for admins on replay_purchases table
CREATE POLICY "Admins can delete access grants"
ON replay_purchases
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);