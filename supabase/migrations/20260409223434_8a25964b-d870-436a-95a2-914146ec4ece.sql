CREATE POLICY "Admins can update sponsor requests"
ON public.sponsor_requests
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

CREATE POLICY "Admins can delete sponsor requests"
ON public.sponsor_requests
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));