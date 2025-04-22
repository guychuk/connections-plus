create policy "let anon select terms"
on "public"."terms"
to anon
using (
  true
);