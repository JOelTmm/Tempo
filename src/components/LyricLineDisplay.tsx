interface Props {
  line: string;
  revealAnswer?: string;
}

/** Affiche la ligne avec le trou (___) bien visible. */
export function LyricLineDisplay({ line, revealAnswer }: Props) {
  const parts = line.split("___");
  if (parts.length < 2) {
    return <p className="text-center text-2xl font-display italic text-white">{line}</p>;
  }
  return (
    <p className="text-center text-2xl font-display italic leading-relaxed text-white">
      {parts[0]}
      <span
        className={`mx-1 inline-block min-w-[5rem] border-b-4 px-2 font-bold not-italic ${
          revealAnswer
            ? "border-emerald-500 text-emerald-400"
            : "border-tempo-orange text-tempo-orange animate-pulse"
        }`}
      >
        {revealAnswer || " ? "}
      </span>
      {parts.slice(1).join("___")}
    </p>
  );
}