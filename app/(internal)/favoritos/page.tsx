import { redirect } from "next/navigation";

/**
 * Bottom nav links to /favoritos as a top-level shortcut, but the actual
 * favorites UI lives inside the profile (`/perfil/favoritos`) so there's
 * a single source of truth for the list. We redirect on the server.
 */
export default function FavoritosShortcutPage() {
  redirect("/perfil/favoritos");
}
