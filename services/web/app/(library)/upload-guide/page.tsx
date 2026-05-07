import Link from 'next/link';

export const metadata = {
  title: 'Guía para autores — Noetia',
  description: 'Todo lo que necesitas saber para publicar tu libro en Noetia con sincronización texto-audio.',
};

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: 'green' | 'blue' | 'orange' }) {
  const cls = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
  }[color];
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{text}</span>;
}

export default function UploadGuidePage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-8">
          <Link href="/author" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Portal de autores
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Guía de publicación</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Todo lo que necesitas para publicar tu libro en Noetia. Sigue estas especificaciones y
            tu contenido quedará perfectamente sincronizado para los lectores.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Proceso */}
        <Section title="Proceso de publicación" icon="🗺">
          <ol className="space-y-3">
            {[
              { n: '1', label: 'Sube tu libro', desc: 'Texto, portada y audio desde el portal de autores.' },
              { n: '2', label: 'Sube el archivo de sincronización', desc: 'Opcional. Un archivo SRT o VTT para activar el resaltado frase por frase.' },
              { n: '3', label: 'Revisión editorial', desc: 'Nuestro equipo revisa el contenido en 3–5 días hábiles.' },
              { n: '4', label: 'Publicación', desc: 'Recibirás un email de confirmación cuando tu libro esté disponible.' },
            ].map(({ n, label, desc }) => (
              <li key={n} className="flex gap-4">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Texto */}
        <Section title="Texto del libro" icon="📄">
          <div className="mb-4">
            <Spec label="Formato" value=".txt (texto plano)" />
            <Spec label="Codificación" value="UTF-8 (obligatorio)" />
            <Spec label="Tamaño máximo" value="10 MB" />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <p className="font-semibold text-gray-700">Estructura del texto</p>
            <ul className="text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Separa los párrafos con <strong>una línea en blanco</strong>.</li>
              <li>Los títulos de capítulos deben ir <strong>solos en su línea</strong>, en MAYÚSCULAS o precedidos de &ldquo;CAPÍTULO&rdquo;.</li>
              <li>No incluyas numeración de páginas, encabezados ni pies de página.</li>
              <li>Elimina tablas de contenido y notas al pie si las hay.</li>
            </ul>
          </div>
          <div className="mt-4 bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-100 leading-relaxed">
            <p className="text-gray-400 mb-2"># Ejemplo de estructura correcta</p>
            <p>CAPÍTULO I</p>
            <br />
            <p>Era una noche oscura y tormentosa. El viento</p>
            <p>azotaba las ventanas del viejo caserón.</p>
            <br />
            <p>Don Rodrigo no podía dormir. Se levantó y</p>
            <p>caminó hasta la ventana.</p>
          </div>
        </Section>

        {/* Portada */}
        <Section title="Imagen de portada" icon="🖼️">
          <div className="mb-4">
            <Spec label="Formatos" value="JPG o PNG" />
            <Spec label="Dimensiones mínimas" value="800 × 1200 px (proporción 2:3)" />
            <Spec label="Dimensiones recomendadas" value="1600 × 2400 px" />
            <Spec label="Tamaño máximo" value="5 MB" />
            <Spec label="Fondo" value="Sin transparencia (alpha)" />
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            <strong>Consejo:</strong> Asegúrate de que el título y el nombre del autor sean legibles
            cuando la imagen se muestre a 120 × 180 px (tamaño de miniatura en la app).
          </div>
        </Section>

        {/* Audio */}
        <Section title="Audio de la narración" icon="🎙️">
          <div className="mb-4">
            <Spec label="Formatos" value="MP3 (recomendado) o M4A/AAC" />
            <Spec label="Bitrate mínimo" value="128 kbps" />
            <Spec label="Bitrate recomendado" value="192 kbps" />
            <Spec label="Frecuencia de muestreo" value="44.100 Hz o 48.000 Hz" />
            <Spec label="Canales" value="Mono o estéreo" />
            <Spec label="Tamaño máximo" value="500 MB por archivo" />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <p className="font-semibold text-gray-700">Recomendaciones</p>
            <ul className="text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Graba en un espacio sin eco ni ruido de fondo.</li>
              <li>Si el libro tiene más de 2 horas, puedes dividirlo en archivos por capítulo.</li>
              <li>No incluyas música de fondo — interfiere con el resaltado sincronizado.</li>
              <li>Deja 0,5 segundos de silencio al inicio y al final del archivo.</li>
            </ul>
          </div>
        </Section>

        {/* Sincronización */}
        <Section title="Sincronización texto-audio" icon="🔗">
          <div className="flex items-center gap-2 mb-4">
            <Badge text="Opcional" color="orange" />
            <p className="text-sm text-gray-500">
              Sin este archivo el libro funciona en modo lectura. Con él se activa el
              <strong> resaltado frase por frase</strong> en Modo Escucha Activa.
            </p>
          </div>

          <div className="mb-4">
            <Spec label="Formatos" value="SRT (.srt) o WebVTT (.vtt)" />
            <Spec label="Codificación" value="UTF-8" />
            <Spec label="Tamaño máximo" value="2 MB" />
            <Spec label="Regla principal" value="Cada cue = una frase del libro" />
          </div>

          {/* SRT example */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Formato SRT</p>
            <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-100 leading-relaxed">
              <p className="text-gray-400 mb-1"># Cada bloque tiene: número, tiempos, texto</p>
              <br />
              <p>1</p>
              <p>00:00:01,000 --&gt; 00:00:03,500</p>
              <p>Era una noche oscura y tormentosa.</p>
              <br />
              <p>2</p>
              <p>00:00:03,700 --&gt; 00:00:06,200</p>
              <p>El viento azotaba las ventanas del caserón.</p>
              <br />
              <p>3</p>
              <p>00:00:06,500 --&gt; 00:00:09,100</p>
              <p>Don Rodrigo no podía dormir.</p>
            </div>
          </div>

          {/* VTT example */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Formato WebVTT</p>
            <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-100 leading-relaxed">
              <p className="text-blue-400">WEBVTT</p>
              <br />
              <p>00:00:01.000 --&gt; 00:00:03.500</p>
              <p>Era una noche oscura y tormentosa.</p>
              <br />
              <p>00:00:03.700 --&gt; 00:00:06.200</p>
              <p>El viento azotaba las ventanas del caserón.</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Nota: VTT usa punto (.) en vez de coma (,) para los milisegundos.</p>
          </div>

          {/* Tools */}
          <div className="bg-green-50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-green-800 mb-2">Herramientas gratuitas para crear archivos SRT</p>
            <ul className="text-green-700 space-y-1.5 list-disc list-inside">
              <li><strong>Subtitle Edit</strong> — Windows, código abierto. Escucha el audio y marca los tiempos manualmente.</li>
              <li><strong>Aegisub</strong> — Windows / macOS / Linux. Para sincronización fotograma a fotograma.</li>
              <li><strong>Descript</strong> — Transcripción automática con tiempos. Exporta a SRT.</li>
              <li><strong>oTranscribe</strong> — En el navegador, gratis. Para transcripción manual con atajos de teclado.</li>
            </ul>
          </div>
        </Section>

        {/* CTA */}
        <div className="bg-blue-600 rounded-2xl p-6 text-center text-white">
          <h2 className="text-lg font-bold mb-2">¿Listo para publicar?</h2>
          <p className="text-blue-100 text-sm mb-5">
            Sube tu libro desde el portal de autores. Nuestro equipo estará disponible para ayudarte.
          </p>
          <Link
            href="/author"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition text-sm"
          >
            Ir al portal de autores
          </Link>
        </div>

      </div>
    </main>
  );
}
