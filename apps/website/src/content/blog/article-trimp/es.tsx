import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El TRIMP (de <em>training impulse</em>, impulso de entrenamiento) es el
        intento serio más antiguo de resumir una sesión en un solo número. Eric
        Banister y sus colegas lo propusieron en los años 70 como dato de
        entrada de su modelo de forma y fatiga, y cincuenta años después sigue
        estando, de una forma u otra, detrás de casi todos los gráficos de carga
        basados en la frecuencia cardíaca. Es lo bastante sencillo como para
        calcularlo a mano, y esa es la mejor manera de entender lo que mide bien
        y dónde te puede engañar.
      </p>

      <h2>La fórmula</h2>
      <p>
        El TRIMP de Banister multiplica la duración de la sesión por la fracción
        de tu frecuencia cardíaca de reserva que utilizaste, y pondera esa
        intensidad de forma exponencial, para que los minutos duros cuenten más
        que los suaves:
      </p>
      <p>
        <code>TRIMP = duración (min) × FCr × 0,64 × e^(1,92 × FCr)</code>
      </p>
      <p>
        donde <code>FCr = (FCmedia − FCreposo) / (FCmáx − FCreposo)</code>, es
        decir, la fracción de la reserva cardíaca usada durante la sesión. Para
        mujeres, los coeficientes son 0,86 y 1,67:{' '}
        <code>TRIMP = duración × FCr × 0,86 × e^(1,67 × FCr)</code>.
      </p>
      <p>
        Lo interesante es la ponderación exponencial. Se ajustó a la forma en
        que el lactato en sangre sube con la frecuencia cardíaca: casi plano a
        intensidades suaves y muy empinado cerca del umbral (Morton, Fitz-Clarke
        y Banister, 1990). Los coeficientes distintos para hombres y mujeres
        salen del mismo trabajo y describen promedios de grupo, no a ti. Nadie
        ha demostrado que se ajusten bien a un atleta concreto, así que conviene
        no tratar un TRIMP de 112 como más preciso que uno de 105.
      </p>

      <h2>Cómo calcular el TRIMP: un ejemplo paso a paso</h2>
      <p>
        Tomemos a una corredora o un corredor con 50 pulsaciones en reposo y una
        máxima de 190, es decir, una reserva de 140 latidos. Sale a rodar una
        hora suave a una media de 140 ppm.
      </p>
      <ul>
        <li>FCr = (140 − 50) / (190 − 50) = 90 / 140 = 0,643</li>
        <li>Ponderación = 0,64 × e^(1,92 × 0,643) = 0,64 × 3,44 = 2,20</li>
        <li>TRIMP = 60 × 0,643 × 2,20 = 85</li>
      </ul>
      <p>
        Con los coeficientes femeninos, la misma hora da 97. Mismo corazón,
        misma salida, y un 14 % de diferencia solo por el coeficiente elegido.
        Eso da una idea de cuánto depende la cifra absoluta de las hipótesis.
      </p>
      <p>
        Ahora una sesión de umbral para la misma persona: 20 minutos de
        calentamiento a 135 ppm, 5 × 4' a 175 ppm con 3' de trote a 140, y 8
        minutos de vuelta a la calma a 130. Otra vez sesenta minutos. Sumando
        bloque por bloque, el TRIMP es 114. Calculado con la frecuencia media de
        toda la sesión (149 ppm), sale 105.
      </p>
      <p>
        Esa diferencia es la exponencial en acción: cuatro minutos a 175 cuestan
        mucho más de lo que sugiere la media, así que promediar una sesión que
        mezcla tramos suaves y duros siempre la subestima. El método original de
        Banister usaba la media porque era lo que daban los pulsómetros de la
        época. Hoy cualquier reloj registra la frecuencia cardíaca cada segundo,
        e integrarla segundo a segundo es la mejor opción. Cuanto más larga y
        variada la sesión, más se nota.
      </p>
      <p>
        Como referencia, una tirada larga de 2 h 30 a 135 ppm da unos 187, y 20
        minutos a 185 ppm (casi a tope para esta persona) unos 79. La fórmula
        dice, por tanto, que un esfuerzo corto y muy intenso puede costar tanto
        como una hora suave. Que tus piernas estén de acuerdo es otra cuestión.
      </p>

      <h2>Lo que tienes que configurar bien</h2>
      <p>
        El TRIMP solo es tan bueno como sus dos valores de referencia. Una FCmáx
        10 pulsaciones demasiado alta hace que todas las sesiones parezcan más
        fáciles; una demasiado baja lo infla todo. Usa el valor más alto que
        hayas visto en una carrera dura o en una cuesta a tope, no 220 menos tu
        edad, que a menudo falla por 10 ppm o más en cualquier dirección. La
        frecuencia en reposo se mide mejor tumbado al despertar, promediando
        varias mañanas. Si no conoces tus valores, nuestra{' '}
        <Link href="/es/tools/heart-rate-zones">
          herramienta de zonas de frecuencia cardíaca
        </Link>{' '}
        explica cómo estimarlos.
      </p>
      <p>
        Luego está el sensor. Los ópticos de muñeca funcionan bien en rodajes
        estables y a menudo fallan en los primeros minutos, con frío y en series
        cortas. Una banda de pecho elimina la mayor parte de ese ruido. Un pulso
        de muñeca enganchado a la cadencia, 170 ppm en un trote suave, te dará
        un TRIMP que no tiene nada que ver con lo que corriste.
      </p>

      <h2>Dónde falla el TRIMP</h2>
      <p>
        La frecuencia cardíaca mide lo que hace tu sistema cardiovascular, no lo
        que pagan tus músculos. Eso tiene consecuencias previsibles.
      </p>
      <p>
        El caso típico es la bajada. Un trail con 1.500 m de desnivel negativo
        puede dejarte los cuádriceps destrozados cuatro días mientras el pulso
        se queda moderado en los descensos, así que el TRIMP lo infravalora. Las
        sesiones de fuerza, la pliometría y los sprints en cuesta tienen el
        mismo problema.
      </p>
      <p>
        Las series cortas son otro. El pulso tarda uno o dos minutos en alcanzar
        al esfuerzo, de modo que en unas 30/30 nunca llega al nivel que merece
        el trabajo, y el TRIMP sale bajo.
      </p>
      <p>
        El calor actúa al revés. En un día caluroso, la deriva cardíaca puede
        subir el pulso diez latidos o más al mismo ritmo a lo largo de una hora.
        El TRIMP lo cuenta como una sesión más dura. Fisiológicamente lo fue,
        así que no es del todo erróneo, pero hace que una semana de verano
        parezca más pesada que la misma semana en marzo.
      </p>
      <p>
        Por último, la frecuencia cardíaca no es comparable entre deportes. La
        mayoría alcanza pulsaciones más bajas en bici que corriendo, y aún más
        bajas en el agua, así que un TRIMP de ciclismo y uno de carrera con el
        mismo número no representan el mismo estrés. Por eso algunos
        entrenadores usan una FCmáx distinta por deporte.
      </p>

      <h2>Otras versiones, y el RPE de sesión</h2>
      <p>
        Varias variantes intentan corregir parte de esto. El TRIMP de Edwards
        (1993) multiplica los minutos pasados en cada una de cinco zonas de
        frecuencia cardíaca por 1 a 5. El de Lucía (Lucía y col., 2003) usa tres
        zonas definidas por los umbrales ventilatorios, ponderadas 1, 2 y 3. El
        TRIMP individualizado de Manzi (Manzi y col., 2009) sustituye la curva
        poblacional de Banister por el perfil de lactato del propio atleta: más
        preciso, pero requiere una prueba de laboratorio.
      </p>
      <p>
        La alternativa más sencilla prescinde del pulso. El RPE de sesión de
        Foster (Foster y col., 2001) multiplica la duración en minutos por lo
        dura que te pareció la sesión en una escala de 0 a 10: 50 minutos a RPE
        6 dan 300. Ve el daño muscular, el calor, una mala noche y un mal día en
        el trabajo, porque tú los ves. Los estudios que compararon ambos métodos
        los encontraron bien correlacionados pero lejos de ser idénticos
        (Impellizzeri y col., 2004), y ahí está lo útil: cuando el TRIMP y el
        RPE de sesión no coinciden, algo pasa. Un umbral que se sintió como un 8
        con un TRIMP normal merece una segunda mirada.
      </p>

      <h2>De una sesión a la forma y la fatiga</h2>
      <p>
        Un TRIMP aislado dice poco. Sirve como dato diario del modelo de
        Banister, que mantiene dos medias exponenciales de tu carga: una lenta
        para la forma, normalmente con una constante de 42 días (la llamada
        CTL), y una rápida para la fatiga, con 7 días (ATL). El estado de forma,
        o TSB, es la diferencia. Durante un bloque se queda por debajo de cero;
        en el tapering la fatiga cae más rápido que la forma y el TSB vuelve a
        subir. El modelo es una descripción, no una ley, y los 42 y 7 días son
        convenciones, no valores medidos en ti, pero la tendencia a lo largo de
        semanas es útil.
      </p>
      <p>
        De ahí salen dos reglas prácticas. Compara tu carga contigo mismo, no
        con la de otra persona ni entre sistemas: un TRIMP de 100 y un TSS de
        100 en TrainingPeaks son unidades distintas. Y lee la curva por semanas;
        un día suelto significa poco.
      </p>

      <h2>Cómo lo usa OpenAthlete</h2>
      <p>
        OpenAthlete calcula el TRIMP de Banister de cada actividad con
        frecuencia cardíaca, segundo a segundo cuando hay registro completo, con
        los coeficientes 0,64/1,92 y 0,86/1,67 y la FCmáx y FC en reposo de tus
        métricas. Si le pones una nota de esfuerzo a una actividad, muestra
        también el RPE de sesión al lado, para que veas cuándo no coinciden. La
        forma, la fatiga y el estado de forma se proyectan después sobre las
        sesiones que tienes planificadas. La{' '}
        <Link href="/es/features/training-load">
          página de carga de entrenamiento
        </Link>{' '}
        incluye una pequeña calculadora de TRIMP y enlaces a las fórmulas en el
        código fuente.
      </p>

      <h2>Fuentes</h2>
      <ul>
        <li>
          Banister EW, Calvert TW, Savage MV, Bach T. A systems model of
          training for athletic performance. Australian Journal of Sports
          Medicine, 1975;7:57–61.
        </li>
        <li>
          Morton RH, Fitz-Clarke JR, Banister EW. Modeling human performance in
          running. Journal of Applied Physiology, 1990;69(3):1171–1177.{' '}
          <a href="https://doi.org/10.1152/jappl.1990.69.3.1171">
            doi:10.1152/jappl.1990.69.3.1171
          </a>
        </li>
        <li>
          Banister EW. Modeling elite athletic performance. En: MacDougall JD,
          Wenger HA, Green HJ (eds.), Physiological Testing of the
          High-Performance Athlete. Human Kinetics, 1991.
        </li>
        <li>Edwards S. The Heart Rate Monitor Book. Polar Electro, 1993.</li>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
        <li>
          Lucía A, Hoyos J, Santalla A, Earnest C, Chicharro JL. Tour de France
          versus Vuelta a España: which is harder? Medicine and Science in
          Sports and Exercise, 2003;35(5):872–878.
        </li>
        <li>
          Impellizzeri FM, Rampinini E, Coutts AJ, Sassi A, Marcora SM. Use of
          RPE-based training load in soccer. Medicine and Science in Sports and
          Exercise, 2004;36(6):1042–1047.
        </li>
        <li>
          Manzi V, Iellamo F, Impellizzeri F, D'Ottavio S, Castagna C. Relation
          between individualized training impulses and performance in distance
          runners. Medicine and Science in Sports and Exercise,
          2009;41(11):2090–2096.
        </li>
      </ul>
    </div>
  );
}
