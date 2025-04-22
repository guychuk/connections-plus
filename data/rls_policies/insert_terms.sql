create policy "let anon insert to terms"
on "public"."terms"
to anon
with check (
  true
);