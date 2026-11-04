import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        CTL, ATL y TSB son tres curvas que salen de la misma carga de
        entrenamiento diaria. La CTL (<em>chronic training load</em>) se suele
        llamar forma física, la ATL (<em>acute training load</em>) fatiga y la
        TSB (<em>training stress balance</em>) frescura. Vienen del modelo de
        impulso-respuesta que Eric Banister publicó en 1975: cada sesión sube a
        la vez tu forma y tu fatiga, la fatiga se va en unos días, la forma en
        semanas, y el rendimiento está en la diferencia entre ambas. Las siglas
        las popularizó después el software de ciclismo, pero las cuentas son de
        Banister.
      </p>

      <h2>Cómo se calculan</h2>
      <p>
        Se parte de una carga por día, por ejemplo la suma del{' '}
        <Link href="/es/learn/trimp">TRIMP</Link> de las sesiones de ese día (0
        en un día de descanso). Forma física y fatiga son medias ponderadas
        exponencialmente de esa serie, con constantes de tiempo distintas:
      </p>
      <Formula
        where={[
          'CTL: τ = 42 días, cada día pesa 1 − e^(−1/42) ≈ 0,0235',
          'ATL: τ = 7 días, cada día pesa 1 − e^(−1/7) ≈ 0,133',
          'TSB = CTL − ATL',
        ]}
      >
        hoy = ayer + (1 − e^(−1/τ)) × (carga − ayer)
      </Formula>
      <p>
        Con τ = 42 días, el efecto de una sesión sobre la CTL se reduce a la
        mitad en unos 29 días; sobre la ATL, en menos de 5. Algunas herramientas
        usan el atajo de las medias móviles, 2 / (N + 1), como peso diario. No
        es el mismo modelo: con N = 42 da 0,047, el doble de 0,0235, lo que
        equivale a dividir por dos ambas constantes de tiempo y hace que las
        curvas reaccionen mucho más rápido (Clarke y Skiba, 2013, explican la
        derivación).
      </p>
      <p>
        Las herramientas tampoco coinciden en qué día usa la TSB. OpenAthlete
        resta los valores del mismo día, ya contada la carga de ese día; otras
        usan los de ayer, para describir lo fresco que llegas a la sesión de
        hoy. Con los mismos datos la diferencia puede ser de unos puntos, así
        que no compares cifras entre aplicaciones.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>
        Una corredora lleva meses con una media de 60 de TRIMP al día: CTL y ATL
        están en 60 y la TSB en 0. Empieza una semana dura a 90 al día. Tras el
        primer día:
      </p>
      <ul>
        <li>CTL = 60 + 0,0235 × (90 − 60) = 60,7</li>
        <li>ATL = 60 + 0,133 × (90 − 60) = 64,0</li>
        <li>TSB = 60,7 − 64,0 = −3,3</li>
      </ul>
      <p>
        Tras siete días a 90, la CTL apenas ha subido a 64,6 mientras que la ATL
        ha saltado a 79,0: la TSB está en −14,4. Está algo más en forma y
        claramente cansada. Luego baja a 40 al día durante una semana. La ATL
        cae rápido a 54,3, la CTL solo baja a 60,8 y la TSB vuelve a positivo,
        +6,5. Esa asimetría, la fatiga que se va antes que la forma, es todo el
        principio del <Link href="/es/learn/taper">tapering</Link>.
      </p>

      <h2>Cómo usarlas en el entrenamiento</h2>
      <p>
        La CTL dice cuánto entrenamiento has asimilado en el último mes o dos.
        Una subida constante de unos puntos por semana durante un bloque de
        construcción es lo habitual; un salto brusco merece una pregunta, y una
        meseta larga también si esperabas progresar. La ATL se mueve cada semana
        y sobre todo explica por qué notas las piernas pesadas. La TSB es la que
        se mira antes de una carrera: la mayoría de atletas compiten bien entre
        un valor ligeramente negativo y uno claramente positivo, pero el valor
        bueno es personal y solo se aprende apuntando la TSB antes de las
        carreras que salieron bien y mal.
      </p>
      <p>
        Las curvas son más útiles cuando se prolongan hacia el futuro. Si tus
        sesiones planificadas llevan una estimación de carga, el modelo puede
        proyectar CTL, ATL y TSB hasta el día de la carrera y mostrar si las dos
        últimas semanas te dejan de verdad fresco en la salida. OpenAthlete lo
        hace: calcula las curvas con tus actividades y las proyecta sobre las
        sesiones de tu calendario. Señala una TSB por debajo de −20 o por encima
        de +25; esos umbrales son convenciones para leer la curva, no límites
        validados. En la{' '}
        <Link href="/es/features/training-load">
          página de carga de entrenamiento
        </Link>{' '}
        tienes el detalle y el código.
      </p>

      <h2>Límites</h2>
      <p>
        El modelo vale lo que vale la carga diaria que le das. El TRIMP por
        pulso subestima los sprints, la fuerza y las bajadas, así que las curvas
        se pierden parte de lo que hace un corredor de trail o un triatleta en
        el gimnasio. Los huecos de datos también pesan: una semana de rodajes
        sin banda de pulso parece una semana de descanso.
      </p>
      <p>
        Las constantes de tiempo son convenciones. Banister las ajustaba atleta
        por atleta y los valores varían mucho; 42 y 7 días son valores por
        defecto razonables, no tu fisiología. Hellard y sus colegas (2006)
        mostraron lo inestables que son los parámetros ajustados incluso con
        buenos datos de nadadores de élite. Y el modelo no sabe nada del sueño,
        la enfermedad o el estrés fuera del deporte. Una TSB negativa no
        diagnostica un sobreentrenamiento, y una alta no garantiza que estés
        listo. Lee las curvas junto al{' '}
        <Link href="/es/learn/session-rpe">RPE de sesión</Link>, la{' '}
        <Link href="/es/learn/hrv">VFC</Link> y tus sensaciones.
      </p>
    </div>
  );
}
