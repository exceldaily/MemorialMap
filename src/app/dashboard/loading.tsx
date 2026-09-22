import { Spinner } from "@/components/ui/Spinner";

export default function DashboardLoading() {
  return (
    <div className="container-page flex min-h-[50vh] items-center justify-center py-20">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
