create policy "let anon select tags"
on "public"."tags"
to anon
using (
  true
);