import { Link } from "@tanstack/react-router";
import { PageHeader } from "./app-shell";
import { Nivi } from "./brand";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card rise flex flex-col items-center px-6 py-16 text-center">
        <span className="nivo-gradient grid size-24 place-items-center rounded-[28px] shadow-[var(--shadow-pop)]">
          <Nivi className="size-20" />
        </span>
        <h2 className="mt-6 text-[20px] font-bold tracking-[-0.02em]">O Nivi está preparando esta tela</h2>
        <p className="mt-2 max-w-md text-[14px] text-ink-2">{description}</p>
        <Link
          to="/"
          className="mt-6 rounded-xl bg-lime px-5 py-2.5 text-[14px] font-bold text-ink hover:brightness-95"
        >
          Voltar para a Visão Geral
        </Link>
      </div>
    </>
  );
}
