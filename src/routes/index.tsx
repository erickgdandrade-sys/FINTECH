import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import {
  DistributionCard,
  EmergencyCard,
  GoalsCard,
  InvestmentsCard,
  InvoicesCard,
  NiviGreeting,
  RecurrencesCard,
  ResultCard,
  SpendingCard,
  useFirstName,
} from "@/components/dashboard";
import { MobileHome } from "@/components/mobile-home";
import { useFinance } from "@/lib/finance";

export const Route = createFileRoute("/")({
  component: Overview,
});

function Overview() {
  const name = useFirstName();
  const { summary } = useFinance();
  return (
    <>
      <PageHeader title={`Oi, ${name}`} subtitle={`Visão geral · ${summary.monthLabel}`} />
      <MobileHome />

      <div className="grid gap-5 lg:grid-cols-3">
        <SpendingCard />
        <div className="lg:col-span-2">
          <DistributionCard />
        </div>

        <div className="hidden lg:col-span-3 lg:block">
          <NiviGreeting />
        </div>

        <div className="flex flex-col gap-5">
          <ResultCard />
          <RecurrencesCard />
        </div>
        <div className="flex flex-col gap-5">
          <InvestmentsCard />
          <InvoicesCard />
        </div>
        <div className="flex flex-col gap-5">
          <EmergencyCard />
          <GoalsCard />
        </div>
      </div>
    </>
  );
}
