import { redirect } from "next/navigation";

/**
 * /minha-viagem → trips are managed from the profile page.
 * The creator wizard lives at /minha-viagem/criar.
 */
export default function MinhaViagemPage() {
  redirect("/perfil");
}
