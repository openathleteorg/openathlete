import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Un reloj de running moderno registra mucho: el track GPS, el ritmo, la
        frecuencia cardíaca, la cadencia, a veces la potencia, además del sueño
        y la variabilidad de la frecuencia cardíaca por la noche. Después te da
        conclusiones: un VO2máx estimado, un tiempo de recuperación, una
        puntuación de disposición, un estado de entrenamiento que dice
        «productivo» o «improductivo». Las mediciones son en general buenas. Es
        con las conclusiones con lo que hay que tener cuidado, porque al reloj
        le falta casi todo lo que querría saber un entrenador.
      </p>

      <h2>Lo que el reloj mide y lo que estima</h2>
      <p>
        El tiempo, la distancia y el ritmo del GPS son lo bastante fiables para
        entrenar, salvo entre edificios altos, bajo árboles o en las curvas
        cerradas de la pista. La frecuencia cardíaca se mide, pero su calidad
        depende del sensor. En un estudio frente a ECG, los sensores ópticos de
        muñeca fueron menos precisos que una banda de pecho, con una precisión
        que variaba según el dispositivo y el tipo de ejercicio (Gillinov et
        al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ). En la práctica, el sensor óptico funciona bien en rodajes constantes
        y sufre en las series, con frío y con la correa floja.
      </p>
      <p>
        Todo lo demás es una estimación construida sobre esos datos. Las
        calorías son el ejemplo más claro: un estudio de Stanford con siete
        dispositivos de muñeca vio que la mayoría medía la frecuencia cardíaca
        con un error mediano inferior al 5 % en bicicleta, pero ninguno estimaba
        el gasto energético con un error por debajo del 20 % (Shcherbina et al.,{' '}
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/">
          J Pers Med, 2017
        </a>
        ). El VO2máx, el tiempo de recuperación y las puntuaciones de
        disposición salen de algoritmos propietarios que los fabricantes
        describen a grandes rasgos pero no publican de forma verificable. Pueden
        ser tendencias útiles. No son mediciones.
      </p>

      <h2>Lo que el reloj no sabe</h2>
      <p>
        No sabe qué tenía que ser la sesión. Un 10 km a 4:45/km es un buen tempo
        para un corredor y un error para otro que tenía un rodaje suave
        planificado. Sin el plan, no hay con qué comparar.
      </p>
      <p>
        No sabe cómo te sentiste. El esfuerzo percibido suele ser lo primero que
        cambia cuando se acumula la fatiga, antes que el pulso o el ritmo. Una
        revisión sistemática encontró que las medidas autoinformadas de los
        deportistas respondían a la carga de entrenamiento con más sensibilidad
        y regularidad que los marcadores objetivos, incluido el pulso en reposo
        (Saw et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). Algunos relojes ya piden una valoración al terminar; si el tuyo lo
        hace, úsala.
      </p>
      <p>
        No conoce tu vida. La fatiga mental eleva el esfuerzo percibido sin
        cambiar la frecuencia cardíaca ni el lactato, al menos en laboratorio (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">
          Van Cutsem et al., Sports Med, 2017
        </a>
        ). Estrés laboral, un recién nacido, un vuelo largo: el reloj puede
        captar parte a través del sueño y la VFC, pero no puede saber por qué.
      </p>
      <p>
        No sabe nada de la molestia en tu tendón de Aquiles, de la carrera
        dentro de ocho semanas ni de que vuelves tras tres semanas parado. Te
        llamará «improductivo» tan tranquilo en plena puesta a punto.
      </p>

      <h2>Úsalo para lo que hace bien</h2>
      <p>
        Fíate de las mediciones y cuestiona las conclusiones. Para las sesiones
        en las que importa el pulso, una banda de pecho vale lo que cuesta. Mira
        las tendencias de disposición y VFC a lo largo de una semana o más, no
        como un veredicto diario: una puntuación baja tras una buena noche y con
        las piernas frescas probablemente es un error del algoritmo, no tuyo.
      </p>
      <p>
        Añade tú el contexto. Después de cada sesión, una nota del 0 al 10 y una
        línea de comentario («gemelos cargados», «calor, 28 °C», «dormí mal»)
        llevan treinta segundos y hacen que tus datos se entiendan un mes
        después. Una vez por semana, compara lo que hiciste con lo que tenías
        planificado: sesiones hechas, perdidas, cambiadas, y por qué.
      </p>
      <p>
        Y guarda el plan en algún sitio que no sea tu cabeza. Los entrenamientos
        que sugiere el reloj se basan en sus estimaciones y solo conocen tu
        objetivo por lo que le hayas introducido. Un plan escrito por ti o por
        un entrenador, con las sesiones clave colocadas según tu vida, da a los
        datos una referencia.
      </p>

      <h2>Esta semana</h2>
      <p>
        Elige una estimación de tu reloj (estado de entrenamiento, tiempo de
        recuperación o disposición) y apúntala cada día junto a tu propia nota
        del 0 al 10 sobre lo fresco que te sientes. Al final de la semana, mira
        cuántas veces coincidieron. Sabrás cuánto peso darle a ese número.
      </p>

      <p>
        OpenAthlete es una plataforma gratuita que se sitúa por encima de tu
        reloj: importa actividades de Garmin, COROS, Suunto, Polar y Strava (o
        archivos FIT, GPX y TCX), las pone junto a la sesión planificada y reúne
        en el mismo calendario el RPE, el TRIMP de frecuencia cardíaca y el
        sueño y la VFC de tu dispositivo. Los entrenamientos estructurados se
        pueden enviar a relojes Garmin, Suunto y COROS. Consulta{' '}
        <Link href="/es/features/watch-sync">sincronización con el reloj</Link>{' '}
        y <Link href="/es/features/training-load">carga de entrenamiento</Link>.
      </p>
    </div>
  );
}
