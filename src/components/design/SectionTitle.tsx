interface Props {
  title: string;
  subtitle: string;
}

export default function SectionTitle({
  title,
  subtitle,
}: Props) {
  return (
    <div className="mb-20 text-center">
      <h2 className="text-5xl font-bold text-white">
        {title}
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}