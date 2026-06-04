export function NeonBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-20 top-20 h-64 w-64 animate-float rounded-full bg-tempo-violet/20 blur-3xl" />
      <div
        className="absolute right-10 top-40 h-72 w-72 animate-float rounded-full bg-tempo-blue/20 blur-3xl"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-10 left-1/3 h-56 w-56 animate-float rounded-full bg-tempo-orange/15 blur-3xl"
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
}