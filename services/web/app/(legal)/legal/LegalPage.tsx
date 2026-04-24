import { LAST_UPDATED } from '@/lib/legal/cookie-policy';

type Props = {
  titleEs: string;
  titleEn: string;
  contentEs: string;
  contentEn: string;
};

export default function LegalPage({ titleEs, titleEn, contentEs, contentEn }: Props) {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{titleEs} / {titleEn}</h1>
          <p className="text-sm text-gray-400 mt-2">{LAST_UPDATED}</p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            Versión MVP — sujeta a revisión legal · MVP Version — subject to legal review
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <article className="prose prose-sm max-w-none text-gray-700">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-4">🇪🇸 Español</div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{contentEs}</pre>
          </article>
          <article className="prose prose-sm max-w-none text-gray-700 lg:border-l lg:border-gray-100 lg:pl-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-4">🇺🇸 English</div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{contentEn}</pre>
          </article>
        </div>
      </div>
    </main>
  );
}
