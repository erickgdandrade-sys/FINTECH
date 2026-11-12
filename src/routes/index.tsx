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
} from "@/components/dashboard";

export const Route = createFileRoute("/")({
  component: Overview,
});

function Overview() {
  return (
    <>
      <PageHeader title="Visão Geral" />
      <NiviGreeting />

      <div className="grid gap-5 lg:grid-cols-3">
        <SpendingCard />
        <div className="lg:col-span-2">
          <DistributionCard />
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
