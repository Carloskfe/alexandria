import Link from 'next/link';

type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  category: string;
  language: string;
};

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 pb-6">
      {books.map((book) => (
        <Link key={book.id} href={`/reader/${book.id}`} className="group">
          <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition relative bg-gray-200">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <BookCoverPlaceholder title={book.title} author={book.author} />
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{book.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{book.author}</p>
        </Link>
      ))}
    </div>
  );
}

const PLACEHOLDER_COLORS = [
  '#1e3a5f', '#14532d', '#3b1fa8', '#7c2d12',
  '#881337', '#134e4a', '#1e1b4b', '#78350f',
];

function BookCoverPlaceholder({ title, author }: { title: string; author: string }) {
  const bg = PLACEHOLDER_COLORS[title.charCodeAt(0) % PLACEHOLDER_COLORS.length];
  const initial = title.trimStart()[0]?.toUpperCase() ?? '?';
  return (
    <div className="absolute inset-0 flex flex-col p-3" style={{ backgroundColor: bg }}>
      <span className="text-6xl font-bold select-none mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>
        {initial}
      </span>
      <div className="mt-auto">
        <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{title}</p>
        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{author}</p>
      </div>
    </div>
  );
}
