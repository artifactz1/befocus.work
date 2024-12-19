import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { DarkModeToggle } from "./_components/DarkModeToggle";
import Timer from "./_components/Timer";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center">
        {/* <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16"> */}
        <Timer />
        <DarkModeToggle />
        {/* </div> */}
      </main>
    </HydrateClient>
  );
}
