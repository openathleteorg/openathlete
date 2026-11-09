import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El ritmo ajustado por pendiente, o GAP (<em>grade-adjusted pace</em>),
        convierte lo que corriste en una subida o una bajada en el ritmo que te
        habría costado la misma energía en llano. Un kilómetro a 7:30 en una
        carretera al 8 % parece lento en el reloj; corregido por la pendiente,
        equivale a algo menos de 5:00 en llano. El GAP existe porque el ritmo
        bruto deja de significar gran cosa en cuanto el terreno se inclina, y en
        trail eso pasa casi siempre.
      </p>
      <p>
        Hay varios modelos. El que se usa aquí, y en OpenAthlete, es el de
        Alberto Minetti y sus colegas, que midieron el consumo de oxígeno de
        corredores en una cinta inclinada entre −45 % y +45 % y ajustaron una
        curva a los resultados (Minetti et al., 2002).
      </p>

      <h2>Cómo se calcula el ritmo ajustado por pendiente</h2>
      <p>
        La curva de Minetti da el coste energético de correr un metro según la
        pendiente, por kilo de masa corporal. En llano vale 3,6 J/kg/m. El GAP
        aplica a tu ritmo la relación entre el coste en llano y el coste en la
        pendiente:
      </p>
      <Formula
        where={[
          'C(i) = 155,4i⁵ − 30,4i⁴ − 43,3i³ + 46,3i² + 19,5i + 3,6, en J/kg/m',
          'i = pendiente en fracción: 0,08 para 8 %, −0,10 para −10 %',
          'C(0) = 3,6 en llano',
        ]}
      >
        GAP = ritmo en la pendiente × 3,6 / C(i)
      </Formula>
      <p>
        La misma relación sirve al revés: el ritmo que debes llevar en una
        cuesta para un esfuerzo dado en llano es{' '}
        <code>ritmo en llano × C(i) / 3,6</code>. En una actividad completa, el
        cálculo se hace punto por punto con la altitud registrada y luego se
        promedia, de modo que un rodaje con desnivel muestra un GAP junto a su
        ritmo medio bruto.
      </p>

      <h2>Ejemplo resuelto</h2>
      <ul>
        <li>
          Subida: 7:30/km en una pendiente del 8 %. C(0,08) = 5,43, es decir,
          1,51 veces el coste en llano. 7:30 (450 s) / 1,51 = 298 s, unos
          4:58/km en llano.
        </li>
        <li>
          Al revés: alguien cuyo rodaje suave en llano va a 5:30/km quiere
          mantener el mismo esfuerzo en una cuesta del 6 %. C(0,06) = 4,93, 1,37
          veces el coste en llano, así que 5:30 × 1,37 = 7:32/km. Al 15 % la
          relación sube a 2,06 y el ritmo a 11:20/km: ahí casi todo el mundo
          camina, y hace bien.
        </li>
        <li>
          Bajada: 4:30/km al −10 %. C(−0,10) = 2,15, apenas 0,6 veces el coste
          en llano, así que el equivalente en llano es 7:32/km. La factura
          energética es pequeña; la de los cuádriceps, no tanto.
        </li>
      </ul>
      <p>
        La{' '}
        <Link href="/es/tools/grade-adjusted-pace">
          calculadora de ritmo ajustado por pendiente
        </Link>{' '}
        hace estas cuentas para cualquier ritmo y pendiente.
      </p>

      <h2>Cómo usarlo en el entrenamiento</h2>
      <p>
        El GAP sirve sobre todo para comparar salidas en terrenos distintos. Un
        circuito de 14 km con 500 m de desnivel positivo a 6:10/km de media y 14
        km llanos a 5:20/km pueden haber sido la misma sesión para tu corazón.
        Mirar el GAP junto a la frecuencia cardíaca te dice si un día lento fue
        culpa de las cuestas o tuya.
      </p>
      <p>
        También ayuda a fijar referencias en recorridos con desnivel. Si tu
        rodaje debe quedarse en un esfuerzo de 5:30 en llano, una cuesta del 6 %
        a 7:30 está bien; la misma cuesta a 6:30 es un tempo disfrazado. En
        series en subida como 8 × 2', el GAP te permite comprobar que la última
        valió lo mismo que la primera aunque el ritmo del reloj se moviera.
      </p>
      <p>
        El día de la carrera, con cuidado. El GAP dice lo que cuesta una subida
        en energía, no cuánto durará una carrera de montaña; para eso, el{' '}
        <Link href="/es/learn/km-effort">km-esfuerzo</Link> y el{' '}
        <Link href="/es/tools/trail-time-estimator">
          estimador de tiempo en trail
        </Link>{' '}
        responden mejor a la pregunta.
      </p>
      <p>
        OpenAthlete aplica la curva de Minetti a cada salida de running y de
        trail que sincronizas. La pendiente se lee de la altitud en ventanas de
        10 m y se limita a ±30 %, porque las lecturas más empinadas suelen ser
        ruido del GPS o del barómetro, no terreno.
      </p>

      <h2>Límites</h2>
      <p>
        Los sujetos de Minetti corrían sobre una cinta lisa. Piedras, raíces,
        barro y zetas añaden un coste que la curva no conoce: en terreno
        técnico, tu esfuerzo real fue mayor de lo que indica el GAP.
      </p>
      <p>
        Las bajadas son el punto débil. Sobre el papel, el coste sigue bajando
        hasta un mínimo hacia −18 a −20 %, donde un metro cuesta la mitad que en
        llano. En la práctica, a partir de −10 % más o menos, lo que te frena es
        la técnica, los apoyos y la carga excéntrica sobre los cuádriceps, mucho
        antes que la energía. Una bajada rápida muestra un GAP tranquilo, pero
        suele ser la que te deja agujetas tres días.
      </p>
      <p>
        Los datos de altitud tienen ruido. Un reloj con barómetro lo hace mejor
        que la altitud GPS, pero ambos generan pequeñas subidas falsas en llano
        que desplazan el GAP. Las rampas cortas y duras, como un muro de 20 m,
        quedan suavizadas por la ventana de cálculo.
      </p>
      <p>
        Por último, otras plataformas usan otros modelos. Strava dice haber
        construido su GAP a partir de datos de frecuencia cardíaca de sus
        usuarios y no de mediciones de laboratorio, y da menos crédito a las
        bajadas. Las cifras cambian de una herramienta a otra: compara tus
        salidas dentro de la misma, no entre dos.
      </p>
    </div>
  );
}
