create policy "let anon select categories"
on "public"."categories"
to anon
using (
  true
);