import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="container-page flex min-h-[50vh] items-center justify-center py-16" aria-busy="true">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
