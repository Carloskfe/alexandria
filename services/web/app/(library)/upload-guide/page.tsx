import Link from 'next/link';

export const metadata = {
  title: 'Guía de publicación — Noetia',
  description: 'Todo lo que necesitas para publicar tu libro o audiolibro en Noetia con sincronización texto-audio.',
};

function Section({ id, title, icon, children }: { id?: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
        <span className="text-xl">{icon}</span>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function Spec({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0 items-start">
      <span className="text-sm text-gray-500 w-44 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800 leading-relaxed">
      <span className="font-semibold">Consejo: </span>{children}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800 leading-relaxed">
      <span className="font-semibold">Importante: </span>{children}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-100 leading-loose overflow-x-auto">
      {children}
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function UploadGuidePage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-8">
          <Link href="/author" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Portal de autores
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Guía de publicación</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Esta guía cubre todo lo que necesitas para publicar tu libro en Noetia —
            desde los formatos de archivo hasta la sincronización texto-audio.
            Preparar bien tus archivos desde el principio evita retrasos en la revisión.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Quick checklist */}
        <section className="bg-blue-600 rounded-2xl p-6 text-white">
          <h2 className="font-bold text-base mb-4">Lista de verificación rápida</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              '✓  Texto en .txt, codificación UTF-8',
              '✓  Portada JPG/PNG, mín. 800×1200 px',
              '✓  Audio MP3 o M4A, sin música de fondo',
              '✓  Archivo SRT/VTT para sincronización (opcional)',
              '✓  Sin numeración de páginas en el texto',
              '✓  Sin eco ni ruido en el audio',
            ].map((item) => (
              <div key={item} className="text-blue-100">{item}</div>
            ))}
          </div>
        </section>

        {/* Process */}
        <Section title="¿Cómo funciona el proceso?" icon="🗺️">
          <div className="space-y-4">
            <Step n="1" title="Prepara tus archivos" desc="Texto, portada, audio y opcionalmente un archivo de sincronización SRT o VTT." />
            <Step n="2" title="Sube tu libro" desc="Completa el formulario en el portal de autores. Si tienes audio, añade también el archivo de sincronización para activar el modo Escucha Activa." />
            <Step n="3" title="Revisión editorial" desc="Nuestro equipo revisa el contenido para garantizar calidad. El proceso tarda entre 3 y 5 días hábiles." />
            <Step n="4" title="Publicación" desc="Recibirás un email de confirmación y tu libro quedará disponible para lectores de toda Latinoamérica." />
          </div>
          <div className="mt-5 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
            ¿Olvidaste subir el archivo de sincronización? Puedes añadirlo en cualquier momento
            desde la sección <strong>Mis libros</strong> en el portal de autores, incluso después de la publicación.
          </div>
        </Section>

        {/* Texto */}
        <Section title="Texto del libro" icon="📄">
          <div className="mb-5">
            <Spec label="Formato recomendado" value=".txt (texto plano)" highlight />
            <Spec label="Formatos alternativos" value=".epub, .pdf" />
            <Spec label="Codificación" value="UTF-8 (obligatorio)" />
            <Spec label="Tamaño máximo" value="10 MB" />
          </div>

          <div className="mb-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Cómo estructurar el texto</p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Separa los párrafos con <strong>una línea en blanco</strong>.</li>
              <li>Los capítulos deben ir en su propia línea, en <strong>MAYÚSCULAS</strong> o precedidos de la palabra <strong>CAPÍTULO</strong>.</li>
              <li>Elimina numeración de páginas, encabezados, pies de página y tablas de contenido.</li>
              <li>Si el libro tiene notas al pie, ponlas al final del capítulo entre corchetes: <code className="bg-gray-100 px-1 rounded text-xs">[Nota: texto]</code>.</li>
            </ul>
          </div>

          <CodeBlock>
            <div className="text-gray-400 mb-2"># Estructura correcta</div>
            <div>CAPÍTULO I — El comienzo</div>
            <div>&nbsp;</div>
            <div>Era una noche oscura y tormentosa. El viento</div>
            <div>azotaba las ventanas del viejo caserón.</div>
            <div>&nbsp;</div>
            <div>Don Rodrigo no podía dormir. Se levantó y</div>
            <div>caminó hasta la ventana para contemplar la tormenta.</div>
          </CodeBlock>

          <div className="mt-4">
            <Tip>Si tu manuscrito está en Word (.docx), guárdalo como "Texto sin formato" (.txt) y asegúrate de seleccionar codificación UTF-8 en el cuadro de diálogo de guardado.</Tip>
          </div>
        </Section>

        {/* Portada */}
        <Section title="Imagen de portada" icon="🖼️">
          <div className="mb-5">
            <Spec label="Formatos" value="JPG o PNG" highlight />
            <Spec label="Dimensiones mínimas" value="800 × 1200 px (proporción 2:3)" />
            <Spec label="Dimensiones recomendadas" value="1600 × 2400 px" />
            <Spec label="Tamaño máximo" value="5 MB" />
            <Spec label="Fondo" value="Sin transparencia (sin canal alpha)" />
          </div>
          <Tip>
            La portada se muestra como miniatura de <strong>120 × 180 px</strong> en los listados de la app.
            Asegúrate de que el título y el nombre del autor sean legibles a ese tamaño.
            Evita texto muy pequeño y fondos con poco contraste.
          </Tip>
          <div className="mt-4">
            <Warning>
              No uses imágenes con copyright sin licencia. Noetia verificará que tengas los derechos
              sobre la portada durante la revisión editorial.
            </Warning>
          </div>
        </Section>

        {/* Audio */}
        <Section title="Audio de la narración" icon="🎙️">
          <div className="mb-5">
            <Spec label="Formato recomendado" value="MP3 (recomendado)" highlight />
            <Spec label="Formatos alternativos" value="M4A / AAC" />
            <Spec label="Bitrate mínimo" value="128 kbps" />
            <Spec label="Bitrate recomendado" value="192 kbps" />
            <Spec label="Frecuencia de muestreo" value="44.100 Hz o 48.000 Hz" />
            <Spec label="Canales" value="Mono o estéreo" />
            <Spec label="Tamaño máximo" value="500 MB por archivo" />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Recomendaciones de grabación</p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Graba en un espacio sin eco: un armario con ropa o una habitación con alfombra funcionan bien.</li>
              <li>Deja <strong>0,5 segundos de silencio</strong> al inicio y al final del archivo.</li>
              <li><strong>Sin música de fondo</strong> — interfiere con el sistema de sincronización frase por frase.</li>
              <li>Si el libro supera <strong>2 horas</strong>, puedes dividirlo en archivos por capítulo y subirlos uno a uno.</li>
              <li>Normaliza el volumen a <strong>−14 LUFS</strong> para garantizar calidad de escucha uniforme.</li>
            </ul>
          </div>

          <div className="mt-4">
            <Tip>
              Audacity (gratuito) puede normalizar el volumen y exportar a MP3 192 kbps.
              Usa <em>Tracks → Mix → Mix and Render</em> y luego <em>Effect → Loudness Normalization → −14 LUFS</em>.
            </Tip>
          </div>
        </Section>

        {/* Sincronización */}
        <Section id="sync" title="Sincronización texto-audio (SRT/VTT)" icon="🔗">
          <div className="flex gap-2 items-start mb-5">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">Recomendado</span>
            <p className="text-sm text-gray-600">
              Este archivo activa el <strong>Modo Escucha Activa</strong>: cada frase del libro
              se resalta automáticamente mientras el audio la narra. Es la funcionalidad
              diferenciadora de Noetia y mejora significativamente la retención del lector.
            </p>
          </div>

          <div className="mb-5">
            <Spec label="Formatos" value="SRT (.srt) o WebVTT (.vtt)" highlight />
            <Spec label="Codificación" value="UTF-8" />
            <Spec label="Tamaño máximo" value="2 MB" />
            <Spec label="Regla de oro" value="Cada entrada = una frase del libro" />
          </div>

          {/* Workflow */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Cómo crear el archivo de sincronización</p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">A</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Opción recomendada: Subtitle Edit (Windows, gratis)</p>
                  <ol className="text-sm text-gray-600 mt-1 space-y-1 list-decimal list-inside">
                    <li>Abre Subtitle Edit y carga tu archivo de audio (<em>Video → Open Video</em>).</li>
                    <li>Escucha el audio y para cada frase: pulsa <kbd className="bg-gray-100 px-1 rounded text-xs">F9</kbd> al inicio y <kbd className="bg-gray-100 px-1 rounded text-xs">F10</kbd> al final.</li>
                    <li>Escribe el texto de la frase en el campo de texto.</li>
                    <li>Repite para cada frase del libro.</li>
                    <li>Exporta: <em>File → Save As</em> → elige formato SRT.</li>
                  </ol>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">B</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Opción rápida: Descript (transcripción automática)</p>
                  <ol className="text-sm text-gray-600 mt-1 space-y-1 list-decimal list-inside">
                    <li>Sube tu audio a Descript y déjalo transcribir automáticamente.</li>
                    <li>Corrige el texto para que coincida exactamente con el libro.</li>
                    <li>Exporta: <em>File → Export → SRT Captions</em>.</li>
                  </ol>
                  <p className="text-xs text-gray-400 mt-1">La transcripción automática no es perfecta — revisa siempre el resultado antes de exportar.</p>
                </div>
              </div>
            </div>
          </div>

          {/* SRT example */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Ejemplo de formato SRT</p>
            <CodeBlock>
              <div className="text-gray-400 mb-1"># bloque = número + tiempos + texto + línea en blanco</div>
              <div>&nbsp;</div>
              <div>1</div>
              <div>00:00:01,000 --&gt; 00:00:03,500</div>
              <div>Era una noche oscura y tormentosa.</div>
              <div>&nbsp;</div>
              <div>2</div>
              <div>00:00:03,700 --&gt; 00:00:06,200</div>
              <div>El viento azotaba las ventanas del caserón.</div>
              <div>&nbsp;</div>
              <div>3</div>
              <div>00:00:06,500 --&gt; 00:00:09,100</div>
              <div>Don Rodrigo no podía dormir.</div>
            </CodeBlock>
            <p className="text-xs text-gray-400 mt-1.5">El formato WebVTT es igual pero usa punto (.) en los milisegundos y empieza con la línea <code className="bg-gray-100 px-1 rounded">WEBVTT</code>.</p>
          </div>

          <Warning>
            Los tiempos del SRT deben coincidir con el archivo de audio que subas. Si grabas de nuevo,
            necesitarás actualizar el SRT también.
          </Warning>
        </Section>

        {/* FAQ */}
        <Section title="Preguntas frecuentes" icon="❓">
          <div className="space-y-5">
            {[
              {
                q: '¿Puedo subir el libro primero y el SRT después?',
                a: 'Sí. Desde la sección "Mis libros" en el portal hay un botón "Subir sincronización SRT/VTT" para cada libro. Puedes añadirla en cualquier momento, incluso después de que el libro esté publicado.',
              },
              {
                q: '¿Qué pasa si mi texto tiene errores tipográficos en el SRT?',
                a: 'Noetia usa el texto del archivo .txt como fuente de verdad para la lectura. El SRT solo controla los tiempos de sincronización — un pequeño error de tipeo en el SRT no afecta el texto visible.',
              },
              {
                q: '¿En cuánto tiempo revisan mi libro?',
                a: 'El proceso de revisión tarda entre 3 y 5 días hábiles. Recibirás un email cuando tu libro esté publicado o si necesitamos que corrijas algo.',
              },
              {
                q: '¿Puedo actualizar el contenido después de publicar?',
                a: 'Puedes actualizar el archivo de sincronización en cualquier momento. Para cambios en el texto o el audio, contáctanos a autores@noetia.app — lo revisamos caso a caso.',
              },
              {
                q: '¿El audio es obligatorio?',
                a: 'No. Puedes publicar solo con texto y portada. El audio y la sincronización son opcionales pero mejoran significativamente la experiencia del lector.',
              },
              {
                q: '¿Qué formatos de audio NO están permitidos?',
                a: 'No aceptamos WAV, FLAC ni OGG. Convierte a MP3 192 kbps antes de subir. Audacity o cualquier editor de audio puede hacerlo gratis.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-gray-900 mb-1">{q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-7 text-center text-white">
          <h2 className="text-lg font-bold mb-2">¿Listo para publicar?</h2>
          <p className="text-blue-100 text-sm mb-5 leading-relaxed">
            Nuestro equipo está disponible para ayudarte en cada paso del proceso.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/author"
              className="bg-white text-blue-600 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition text-sm"
            >
              Ir al portal de autores
            </Link>
            <a
              href="mailto:autores@noetia.app"
              className="bg-white/10 border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/20 transition text-sm"
            >
              Contactar al equipo
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
