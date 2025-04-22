create policy "let anon insert to tags"
on "public"."tags"
to anon
with check (
  true
);