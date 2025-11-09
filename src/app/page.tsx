import Editor from "@/components/Editor";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans dark:bg-black">
      <main className="flex min-h-screen w-full items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <Editor />
      </main>
    </div>
  );
}
