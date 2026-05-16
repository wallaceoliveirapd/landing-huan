import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-4">
        <span className="font-display font-bold text-[88px] leading-none text-[var(--color-neutral-800)]">
          404
        </span>
        <h1 className="font-display font-medium text-[22px] text-[var(--color-neutral-800)]">
          Essa página fugiu pra praia
        </h1>
        <p className="text-[14px] text-[var(--color-neutral-600)] leading-relaxed">
          O endereço que você procurou não existe (ou já não existe mais).
          Vamos voltar pro começo.
        </p>
        <Link
          href="/"
          className="mt-2 h-11 px-5 inline-flex items-center rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium"
        >
          Voltar pra home
        </Link>
      </div>
    </div>
  );
}
