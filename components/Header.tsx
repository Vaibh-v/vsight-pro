import AuthButtons from "./AuthButtons";

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">VSight — Local SEO Cockpit</h1>
      <AuthButtons />
    </header>
  );
}
