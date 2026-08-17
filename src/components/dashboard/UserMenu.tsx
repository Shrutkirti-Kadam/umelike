import Link from "next/link";
import { signOut } from "@/auth";

export function UserMenu({
  name,
  email,
  image,
}: {
  name: string;
  email?: string;
  image?: string;
}) {
  const shortName = name.trim().split(/\s+/)[0] || "Account";

  return (
    <details className="profile-user-menu">
      <summary aria-label={`Open account menu for ${name}`}>
        <Avatar name={name} image={image} />
        <span>{shortName}</span>
        <i aria-hidden="true">⌄</i>
      </summary>

      <div className="profile-user-menu__dropdown">
        <div className="profile-user-menu__identity">
          <Avatar name={name} image={image} />
          <div>
            <strong>{name}</strong>
            {email && <span>{email}</span>}
          </div>
        </div>

        <div className="profile-user-menu__links">
          <Link href="/profile">
            <span>My profile</span>
            <i aria-hidden="true">↗</i>
          </Link>
          <Link href="/onboarding">
            <span>Edit profile</span>
            <i aria-hidden="true">↗</i>
          </Link>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit">
            <span>Sign out</span>
            <i aria-hidden="true">→</i>
          </button>
        </form>
      </div>
    </details>
  );
}

function Avatar({ name, image }: { name: string; image?: string }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" referrerPolicy="no-referrer" />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return <b aria-hidden="true">{initials}</b>;
}
