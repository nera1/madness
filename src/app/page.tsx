import Editor from "@/components/Editor";
import VerticalToolbar from "@/components/vertical-toolbar/vertical-toolbar";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans dark:bg-black">
      <main className="flex min-h-screen w-full items-center justify-center pt-24 pb-32 px-12 bg-white dark:bg-black">
        <VerticalToolbar />
        <Editor />
      </main>
    </div>
  );
}
