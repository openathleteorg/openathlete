import Link from 'next/link';

import { articlePrices } from './prices';
import { SOURCES } from './sources';

export function ContentEs() {
  const p = articlePrices('es');
  return (
    <div>
      <p>
        El 22 de julio de 2026, Garmin anunció la compra de TrainingPeaks y de
        TrainHeroic, la app de fuerza del mismo grupo, Peaksware. No se
        publicaron las condiciones. Desde entonces la misma pregunta aparece en
        los foros de entrenadores y en nuestro correo: ¿me cambio, y a cuál?
      </p>
      <p>
        La respuesta corta es que hoy nada te obliga a cambiar. La larga viene a
        continuación, con las alternativas que vale la pena probar y cómo
        llevarte tu historial. Nosotros desarrollamos una de ellas, OpenAthlete,
        así que lee esa parte con el escepticismo que merece. Al resto hemos
        intentado describirlo como lo harían sus propios usuarios.
      </p>

      <h2>Qué ha cambiado de verdad</h2>
      <p>
        El dueño. De momento, nada más. El{' '}
        <a href={SOURCES.garminPress}>comunicado de Garmin</a> dice que unas 120
        personas de TrainingPeaks y TrainHeroic pasan a Garmin y que las
        plataformas siguen en Louisville, Colorado. No dice nada de cuentas,
        precios ni dispositivos compatibles. No se ha anunciado ningún cambio de
        precio en Premium ni en Coach Edition, y las cuentas de entrenador
        funcionan como en junio. Algunos medios, como{' '}
        <a href={SOURCES.cyclelytic}>CycleLytic</a>, publicaron que Garmin
        aseguró que la compatibilidad con otras marcas no cambiaría. No hemos
        encontrado ese compromiso por escrito de Garmin, pero tampoco nada que
        apunte en sentido contrario. Tus atletas con COROS, Suunto, Polar o
        Wahoo siguen sincronizando.
      </p>
      <p>
        Entonces, ¿por qué preguntan los entrenadores? Sobre todo por quién
        marca ahora la hoja de ruta. TrainingPeaks valía por ser la capa neutral
        entre todas las marcas de relojes y todos los entrenadores. Ahora un
        fabricante de relojes decide en qué trabajan sus ingenieros. Puede que
        Garmin lo mantenga neutral, porque eso es lo que ha comprado. Aun así,
        cuando compró Firstbeat en 2020 dijo que las licencias a terceros
        seguirían, y <a href={SOURCES.the5krunner}>the5krunner</a>, citando a DC
        Rainmaker, señala que desde entonces no han aparecido acuerdos nuevos.
        Eso no demuestra nada sobre TrainingPeaks. Sí explica por qué los
        entrenadores con atletas de varias marcas están atentos.
      </p>
      <p>
        Además hay un precedente. Today&apos;s Plan pertenecía a Specialized,
        tenía una base fiel de entrenadores de ciclismo y{' '}
        <a href={SOURCES.todaysPlan}>cerró en marzo de 2024</a>. Entrenadores
        con años de historial allí tuvieron unos meses para sacarlo todo. Nadie
        espera lo mismo de TrainingPeaks, que es mucho más grande, pero quien lo
        vivió ahora tiene siempre un plan de salida. Y el precio ya era tema
        antes de julio: Premium anual pasó de 124,99 US$ a 134,99 US$ en abril
        de 2025.
      </p>

      <h2>¿Deberías cambiarte?</h2>
      <p>
        Para mucha gente la respuesta honesta es no, o todavía no. Repasa estos
        puntos antes de dedicar un fin de semana a migrar.
      </p>

      <h3>Los relojes de tus atletas</h3>
      <p>
        Si todos tus atletas llevan Garmin, la compra te resulta neutral, quizá
        hasta favorable. Si un tercio de tu grupo usa COROS, Suunto o Polar,
        eres tú quien tiene algo que vigilar. Haz hoy la lista: qué marca usa
        cada atleta y si los entrenamientos planificados llegan a su reloj. Eso
        es lo primero que perderías si una integración empeorara algún día.
      </p>

      <h3>Lo que pagas</h3>
      <p>
        Precios de tarifa a {p.checkedOn}: TrainingPeaks Premium cuesta 19,95
        US$ al mes o {p.tpPremiumYear} al año. Coach Edition empieza en 21,99
        US$ al mes con un atleta Premium incluido, y luego entre 9 y 4,50 US$ al
        mes por cada atleta Premium adicional según el tamaño del grupo, más 99
        US$ de alta que un código promocional elimina (
        <a href={SOURCES.tpCoachPricing}>precios para entrenadores</a>). Los
        entrenamientos solo se sincronizan con el reloj de los atletas Premium,
        así que un entrenador que paga Premium a 10 atletas gasta unos{' '}
        {p.tpCoach10} al año sin impuestos. Si prefieres quedarte ese dinero, es
        motivo para mirar alternativas, sea quien sea el dueño.
      </p>

      <h3>De qué dependes</h3>
      <p>
        Algunas cosas no tienen un equivalente real. Si vendes planes en el
        marketplace de TrainingPeaks, ese público no se va contigo. Si tus
        atletas ruedan en invierno con TrainingPeaks Virtual o adoran las apps
        nativas, tenlo en cuenta. Y si tus atletas están contentos y el único
        preocupado eres tú, mudar a 25 personas por un riesgo hipotético puede
        costarte más confianza de la que ahorra. Los entrenadores que lo han
        intentado cuentan que muchas veces los atletas simplemente dicen que no.
      </p>

      <h3>Tus datos</h3>
      <p>
        Decidas lo que decidas, exporta tu historial ahora. Te lleva una tarde y
        elimina casi todo el riesgo. Cómo hacerlo está al final del artículo.
      </p>

      <h2>Las alternativas independientes</h2>
      <p>
        Ninguna pertenece a un fabricante de relojes. Los precios son los de
        tarifa de cada empresa a {p.checkedOn}; revisa la página enlazada antes
        de pagar.
      </p>

      <h3>intervals.icu</h3>
      <p>
        Gratis, con un plan Supporter de 4 US$ al mes (
        <a href={SOURCES.intervals}>intervals.icu</a>). Para quien se entrena
        solo y disfruta con los datos, es la primera parada: forma, fatiga y
        frescura, curvas de potencia y de ritmo, editor de entrenamientos,
        calendario y una de las listas de integraciones más largas que existen
        (Garmin, COROS, Suunto, Polar, Wahoo, Zwift y muchas más). Los
        entrenadores pueden seguir a sus atletas y planificarles; los equipos y
        organizaciones de coaching requieren Supporter. No hay app móvil oficial
        (apps de terceros cubren el hueco) y a mucha gente la interfaz le
        resulta densa al principio. Si vives en la curva de rendimiento, empieza
        aquí.
      </p>

      <h3>Nolio</h3>
      <p>
        De Grenoble, socio de la federación francesa de atletismo y la opción
        por defecto en los clubes franceses. Los atletas son gratis (Premium a
        6,90 € al mes); los planes de entrenador empiezan en 19,90 € al mes para
        3 atletas y 29,90 € hasta 25, con planes más baratos para clubes
        constituidos como asociación (<a href={SOURCES.nolio}>precios Nolio</a>
        ). Apps nativas para iOS y Android, biblioteca de vídeos de fuerza y
        comentarios en cada sesión. Para un entrenador o club francófono es el
        sustituto más directo. Es poco conocido fuera de Francia y el precio
        sube por tramos: {p.nolioCoach10} al año para un entrenador con 10
        atletas.
      </p>

      <h3>Final Surge</h3>
      <p>
        Estadounidense, popular entre entrenadores de running, institutos y
        universidades. Los atletas tienen todas sus funciones gratis; los
        entrenadores pagan una tarifa plana de 19 US$ al mes de 1 a 5 atletas o
        39 US$ al mes hasta 100 (
        <a href={SOURCES.finalSurge}>precios Final Surge</a>). Apps nativas y
        entrenamientos estructurados enviados a Garmin y COROS. La tarifa plana
        es su gran atractivo: 40 atletas cuestan lo mismo que 10. Tiene poca
        presencia en Europa y no le encontramos funciones de IA, cosa que
        algunos entrenadores verán como una ventaja.
      </p>

      <h3>Tredict</h3>
      <p>
        Alemán, llevado por su fundador, cuidadoso con la privacidad y el más
        combativo con la compra de Garmin (
        <a href={SOURCES.tredictBlog}>su análisis</a>). Envía entrenamientos a
        Garmin, COROS, Suunto, Wahoo, Hammerhead y Zwift, y tiene funciones para
        entrenadores y una API. Su modelo de precio es poco habitual: 49 US$ una
        sola vez por doce meses de acceso completo, después acceso de solo
        lectura gratis, y dos meses de prueba (
        <a href={SOURCES.tredictPrice}>precios Tredict</a>). Equipo pequeño y
        comunidad pequeña, pero muy cerca en espíritu de lo que TrainingPeaks
        fue durante años para mucha gente.
      </p>

      <h3>Runalyze</h3>
      <p>
        Hecho en Kaiserslautern y Kiel, y favorito de los corredores que quieren
        análisis: VO2max efectivo, predicción de marcas, un indicador de forma
        para maratón y carga de entrenamiento. Sincroniza con Garmin, COROS,
        Suunto, Polar, Wahoo, Strava y otros. Gratis, con Premium a 60 € al año
        (<a href={SOURCES.runalyze}>precios Runalyze</a>). Es un diario de
        entrenamiento y una herramienta de análisis más que una plataforma de
        planificación o de coaching: encaja con el corredor que se entrena solo
        y usaba TrainingPeaks sobre todo para mirar atrás, no con el entrenador
        que planifica para otros.
      </p>

      <h3>Golden Cheetah</h3>
      <p>
        Software de escritorio libre y gratuito para Windows, macOS y Linux,
        pensado primero para ciclismo, con un análisis de potencia muy profundo
        (<a href={SOURCES.goldenCheetah}>goldencheetah.org</a>). Sin nube, sin
        colaboración con entrenador y sin envío de entrenamientos al reloj.
        Tiene su sitio aquí porque nadie podrá apagarlo nunca.
      </p>

      <h3>OpenAthlete</h3>
      <p>
        El nuestro, así que júzgalo con eso en mente. Es de código abierto
        (AGPL), gratis si lo alojas tú, o alojado por nosotros en Francia. Todas
        las funciones son gratis en la versión alojada, incluido el coaching de
        hasta 5 atletas; Supporter, a 5 € al mes o 50 € al año, añade atletas
        ilimitados e IA con nuestras claves (
        <Link href="/es/pricing">precios</Link>). Los clubes tienen un espacio
        de club gratuito, sin límite de atletas: grupos con sus entrenadores,
        biblioteca compartida, sesiones semanales del club y planes copiados a
        todo un grupo. Las sesiones planificadas van a relojes Garmin, Suunto y
        COROS; las actividades llegan de esas tres marcas, de Polar y de Strava.
        La carga de entrenamiento es el TRIMP por frecuencia cardiaca, con el
        RPE de sesión al lado, y la forma, la fatiga y la frescura se proyectan
        sobre las sesiones planificadas. La IA es opcional y funciona con tu
        propia clave o con la cuota de Supporter.
      </p>
      <p>
        Las limitaciones son reales. Todavía no hay apps nativas en las tiendas:
        las de iOS y Android están en pruebas y, mientras tanto, los atletas
        usan la app web instalable. No hay marketplace para vender planes, ni
        facturación al club (el espacio de club es gratis, pero las cuotas se
        gestionan fuera de OpenAthlete), ni app de rodillo, ni envío de
        entrenamientos a relojes Polar. El análisis es menos profundo que el de
        intervals.icu, y el proyecto es joven y lo desarrolla una sola persona.
        Nuestra respuesta a «¿y si desaparecéis?» es la licencia: el código y
        tus datos siguen siendo utilizables sin nosotros. La comparación punto
        por punto está en{' '}
        <Link href="/es/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , cómo funciona el coaching en{' '}
        <Link href="/es/coaches">la página para entrenadores</Link>, y el resto
        de comparativas <Link href="/es/compare">aquí</Link>.
      </p>

      <h2>Cómo cambiarte sin perder tu historial</h2>

      <h3>Exporta primero desde TrainingPeaks</h3>
      <p>
        El centro de ayuda de TrainingPeaks describe una función Export Data en
        la web: eliges un periodo de hasta 12 meses y obtienes una carpeta con
        todos los archivos de entrenamiento de ese periodo; la misma herramienta
        genera un resumen CSV de los entrenamientos. También puedes descargar
        cada entrenamiento por separado, en el formato en que se subió (
        <a href={SOURCES.tpExportHelp}>Data Export</a>). Un{' '}
        <a href={SOURCES.tpExportBlog}>artículo del blog de TrainingPeaks</a>{' '}
        dice que la exportación masiva es para suscriptores de Athlete Edition,
        y algunos usuarios en foros dicen que requiere Premium, así que revisa
        lo que muestra tu cuenta. Seis años de historial son seis exportaciones.
        Hazlo antes de darte de baja, no después. No encontramos una forma
        documentada de exportar en bloque tu biblioteca de entrenamientos ni el
        plan futuro, así que cuenta con rehacer las plantillas que reutilizas.
      </p>

      <h3>Vuelve a conectar las cuentas del reloj</h3>
      <p>
        La mayoría de plataformas recuperan las actividades pasadas de la marca
        del reloj al conectarlo, y es más cómodo que los archivos. Hasta dónde
        llegas depende más de la API de la marca que de la plataforma. En
        OpenAthlete, Strava y COROS dan todo el historial (COROS envía 50
        archivos al día, así que un historial largo tarda varios días), Garmin y
        Suunto los últimos 30 días, y Polar nada anterior a la conexión. Otras
        plataformas chocan con límites parecidos por las mismas razones;
        pregunta antes de contar con una importación completa.
      </p>

      <h3>Completa con archivos FIT</h3>
      <p>
        Lo que no devuelve la API lo tienes en la carpeta exportada. Sube los
        archivos FIT a la nueva plataforma; en OpenAthlete puedes soltar varios
        a la vez sobre el calendario (20 MB por archivo). Los archivos FIT
        multideporte de un triatlón todavía no son compatibles.
      </p>

      <h3>Usa las dos durante un bloque</h3>
      <p>
        Si entrenas a otros, mantén TrainingPeaks un bloque más mientras tus
        atletas se conectan a la nueva plataforma, planifica allí las cuatro
        semanas siguientes y mira qué falla. Cambiar después de la carrera
        objetivo o en el periodo de transición es mucho más fácil que en mitad
        de una preparación de maratón.
      </p>
      <p>Y si este mes solo vas a hacer una cosa, que sea la exportación.</p>
    </div>
  );
}
