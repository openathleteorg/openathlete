import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El TRIMP, de <em>training impulse</em>, convierte una sesión en un solo
        número a partir de dos datos que tu reloj ya registra: cuánto tiempo
        entrenaste y lo alto que fue tu pulso. Eric Banister lo propuso en los
        años setenta como entrada de su modelo de forma y fatiga, y la mayoría
        de las gráficas de carga basadas en frecuencia cardíaca siguen usando
        alguna versión. Se calcula a mano sin problema, y es la mejor manera de
        ver qué capta y qué se le escapa.
      </p>

      <h2>Cómo se calcula el TRIMP</h2>
      <p>
        El TRIMP de Banister toma la fracción de tu frecuencia cardíaca de
        reserva que usaste, la multiplica por la duración y aplica una
        ponderación exponencial, de modo que un minuto cerca del umbral cuesta
        mucho más que un minuto de trote:
      </p>
      <Formula
        where={[
          'FCr = (FC − FCreposo) / (FCmáx − FCreposo), la fracción de frecuencia cardíaca de reserva',
          'y = 0,64 y k = 1,92 para hombres; y = 0,86 y k = 1,67 para mujeres',
        ]}
      >
        TRIMP = minutos × FCr × y × e^(k × FCr)
      </Formula>
      <p>
        La ponderación se ajustó a cómo sube el lactato en sangre con el pulso:
        casi plano a ritmos suaves, empinado cerca del umbral (Morton,
        Fitz-Clarke y Banister, 1990). Los dos juegos de coeficientes son
        promedios de los hombres y las mujeres de esos estudios. Nadie ha
        demostrado que se ajusten bien a un atleta concreto, así que un TRIMP de
        112 no es realmente más preciso que uno de 105.
      </p>
      <p>
        Puedes aplicar la fórmula una sola vez con el pulso medio de toda la
        sesión, o minuto a minuto (segundo a segundo si tienes el registro
        completo) y sumar. La segunda opción es mejor, y el ejemplo de abajo
        muestra por qué.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>
        Un corredor con pulso en reposo de 48 y máximo de 188 tiene una reserva
        de 140 pulsaciones. Corre 45 minutos a 150 ppm de media.
      </p>
      <ul>
        <li>FCr = (150 − 48) / 140 = 0,729</li>
        <li>Ponderación = 0,64 × e^(1,92 × 0,729) = 0,64 × 4,05 = 2,59</li>
        <li>TRIMP = 45 × 0,729 × 2,59 = 85</li>
      </ul>
      <p>
        Con los coeficientes femeninos, la misma salida da 95. Mismo corazón,
        misma sesión, un 12 % de diferencia solo por la elección de
        coeficientes.
      </p>
      <p>
        Ahora reparte 20 minutos con la misma media de otra forma: 10 minutos a
        175 ppm y 10 minutos a 125 ppm. Calculado sobre la media (150 ppm
        durante 20 minutos), el TRIMP es 38. Calculado bloque a bloque, es 33 +
        10 = 43, cerca de un 15 % más. Como la ponderación es exponencial, los
        minutos duros suman más de lo que restan los suaves, y la media aplana
        justo lo que cansa. Por eso las sesiones de series salen subestimadas
        cuando solo se usa el pulso medio.
      </p>

      <h2>Cómo usarlo en el entrenamiento</h2>
      <p>
        La puntuación de una sesión suelta sirve de poco. El TRIMP cobra sentido
        cuando se acumula: un total semanal para comparar bloques y una serie
        diaria que alimenta las{' '}
        <Link href="/es/learn/ctl-atl-tsb">
          curvas de forma física, fatiga y frescura
        </Link>{' '}
        (CTL, ATL, TSB). Algunos hábitos ayudan:
      </p>
      <ul>
        <li>
          Mantén al día tu pulso en reposo y tu máximo. Un máximo 10 pulsaciones
          por encima del real reduce cada FCr y baja todas las puntuaciones.
        </li>
        <li>
          Compárate contigo. Un total semanal de 600 no dice nada en absoluto;
          pasar de 450 a 650 en dos semanas, sí.
        </li>
        <li>
          Lee el TRIMP junto a tus sensaciones. Si un rodaje habitual marca un
          20 % más de lo normal, el calor, una mala noche o un resfriado en
          camino explican más que un cambio repentino de forma.
        </li>
      </ul>
      <p>
        OpenAthlete calcula el TRIMP de Banister con el pulso segundo a segundo
        de cada actividad (con la media cuando no hay registro), usando los
        coeficientes de arriba, y muestra el{' '}
        <Link href="/es/learn/session-rpe">RPE de sesión</Link> al lado. La{' '}
        <Link href="/es/features/training-load">
          página de carga de entrenamiento
        </Link>{' '}
        incluye una calculadora y enlaces al código fuente.
      </p>

      <h2>Limitaciones</h2>
      <p>
        La frecuencia cardíaca es una medida interna y va con retraso. En
        sprints de 30 segundos o cuestas cortas apenas le da tiempo a subir, así
        que el TRIMP infravalora el trabajo anaeróbico y neuromuscular. La
        fuerza, las bajadas y el daño muscular de una carrera de montaña casi no
        aparecen. El calor, la deshidratación, la cafeína y la altitud suben el
        pulso para el mismo trabajo, y la{' '}
        <Link href="/es/learn/aerobic-decoupling">deriva cardíaca</Link> infla
        la segunda mitad de los esfuerzos largos. Además, la fórmula ignora el
        deporte: una hora a 140 ppm en bici y una hora a 140 ppm corriendo
        puntúan igual, aunque correr suele dejar más huella. Acompaña el TRIMP
        de una medida subjetiva y léelo como una tendencia, no como un
        veredicto.
      </p>
    </div>
  );
}
