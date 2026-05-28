interface ReferenceTagProps {
  session: number;
  topic: string;
  pdfFile: string;
  pdfPage: number;
}

export default function ReferenceTag({
  session,
  topic,
  pdfFile,
  pdfPage,
}: ReferenceTagProps) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
        Session {session}
      </span>
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">{topic}</span>
      <span className="text-slate-400">·</span>
      <span className="text-slate-400">
        [{pdfFile}, p.{pdfPage}]
      </span>
    </div>
  );
}
