import { HomeContent } from "@/components/home-content";
import { getNotesByCategory, getAllNotes } from "@/lib/notes";

export default function Home() {
  const sections = getNotesByCategory();
  const total = getAllNotes().length;
  return <HomeContent sections={sections} total={total} />;
}
