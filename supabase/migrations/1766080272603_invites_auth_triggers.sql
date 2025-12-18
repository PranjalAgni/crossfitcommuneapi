-- =========================
-- 1) Block uninvited signups
-- =========================

create or replace function public.block_uninvited_signups()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1
    from public."MemberInvite" i
    where lower(i."email") = lower(new.email)
      and i."status" = 'PENDING'::public."InviteStatus"
      and (i."expiresAt" is null or i."expiresAt" > now())
  ) then
    raise exception 'Email is not invited';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_block_uninvited_signups on auth.users;

create trigger trg_block_uninvited_signups
before insert on auth.users
for each row
execute function public.block_uninvited_signups();


-- ===========================================
-- 2) After signup: create Profile + accept invite
-- ===========================================

create or replace function public.handle_invited_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invite_role public."InviteRole";
begin
  -- Read the invite role (member/admin) from MemberInvite
  select i."role"
    into invite_role
  from public."MemberInvite" i
  where lower(i."email") = lower(new.email)
    and i."status" = 'PENDING'::public."InviteStatus"
  limit 1;

  -- Default if not found (shouldn't happen because BEFORE trigger blocks)
  if invite_role is null then
    invite_role := 'member'::public."InviteRole";
  end if;

  -- Create profile row (id must match auth.users.id)
  insert into public."Profile" (
    "id",
    "email",
    "role",
    "accountStatus",
    "createdAt",
    "updatedAt"
  )
  values (
    new.id,
    new.email,
    -- Map InviteRole -> Role enum
    case
      when invite_role = 'admin'::public."InviteRole" then 'admin'::public."Role"
      else 'member'::public."Role"
    end,
    'ACTIVE'::public."AccountStatus",
    now(),
    now()
  )
  on conflict ("id") do update
    set "email" = excluded."email",
        "updatedAt" = now();

  -- Mark invite accepted
  update public."MemberInvite"
    set "status" = 'ACCEPTED'::public."InviteStatus",
        "acceptedAt" = now()
  where lower("email") = lower(new.email)
    and "status" = 'PENDING'::public."InviteStatus";

  return new;
end;
$$;

drop trigger if exists trg_handle_invited_user_created on auth.users;

create trigger trg_handle_invited_user_created
after insert on auth.users
for each row
execute function public.handle_invited_user_created();
