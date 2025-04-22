create policy "let anon insert to categories"
on "public"."categories"
to anon
with check (
  true
);