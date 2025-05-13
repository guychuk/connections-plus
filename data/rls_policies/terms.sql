alter policy "allow service_role to do everything"
on "public"."terms"
to service_role
using (
  true
)
with check (
  true
);
