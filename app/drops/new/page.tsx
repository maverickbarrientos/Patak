import { DropForm } from "@/components/drop-form";

export default function NewDropPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Add a drop</h1>
      <DropForm />
    </main>
  );
}
