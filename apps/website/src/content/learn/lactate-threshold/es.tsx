import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Tus músculos producen lactato a cualquier ritmo, incluso caminando, y lo
        eliminan sin parar. A ritmo suave las dos cosas se equilibran y la
        concentración en sangre se queda cerca de la de reposo, alrededor de 1
        mmol/L. Si aceleras, llega un momento en que la producción gana a la
        eliminación. A ese punto se le llama umbral de lactato, y explica por
        qué un ritmo que aguantas una hora no se parece en nada a otro solo 15
        segundos por kilómetro más rápido.
      </p>
      <p>
        El problema es que «el» umbral de lactato no existe como un número
        único. Faude, Kindermann y Meyer (2009) revisaron más de veinte
        conceptos de umbral en la literatura, con protocolos distintos y reglas
        distintas para leer la misma curva. En la práctica se agrupan en dos
        familias. El primer umbral (LT1, a menudo llamado umbral aeróbico) es
        donde el lactato empieza a subir por encima del reposo. El segundo (LT2,
        umbral anaeróbico o, en su versión más estricta, máximo estado estable
        de lactato) es la intensidad más alta a la que el lactato todavía se
        estabiliza en vez de subir hasta que paras. Cuando un entrenador habla
        de «rodar al umbral», casi siempre se refiere al LT2.
      </p>

      <h2>Cómo se mide</h2>
      <p>
        La prueba clásica es un test escalonado en cinta o en pista: escalones
        de 3 a 5 minutos, cada uno 0,5 a 1 km/h más rápido que el anterior, con
        una gota de sangre del dedo o del lóbulo de la oreja al final de cada
        escalón. Después se lee el umbral sobre la curva. Hay dos reglas
        habituales: una concentración fija, normalmente 4 mmol/L para el LT2, y
        una subida sobre el valor basal, a menudo basal + 1 mmol/L para el LT1.
        La velocidad entre dos escalones se calcula por interpolación lineal:
      </p>
      <Formula
        where={[
          'La = lactato objetivo (4 mmol/L, o basal + 1)',
          'v1, La1 = velocidad y lactato del último escalón por debajo',
          'v2, La2 = velocidad y lactato del primer escalón por encima',
        ]}
      >
        v = v1 + (La − La1) / (La2 − La1) × (v2 − v1)
      </Formula>
      <p>
        El máximo estado estable de lactato es la referencia a la que intentan
        acercarse los demás métodos, pero hacen falta varios días de carreras de
        30 minutos a ritmo constante para situarlo, y por eso casi nadie lo mide
        fuera de un laboratorio (Jones et al., 2019).
      </p>

      <h2>Ejemplo resuelto</h2>
      <p>
        Una corredora hace escalones de 4 minutos desde 10 km/h, sumando 1 km/h
        cada vez. Lactato al final de cada escalón: 1,1; 1,2; 1,4; 1,8; 2,6; 4,1
        y 6,3 mmol/L a 10, 11, 12, 13, 14, 15 y 16 km/h.
      </p>
      <ul>
        <li>
          LT2 a 4 mmol/L: entre 14 km/h (2,6) y 15 km/h (4,1). v = 14 + (4 −
          2,6) / (4,1 − 2,6) × 1 = 14,9 km/h, es decir, 4:01 por kilómetro.
        </li>
        <li>
          LT1 a basal + 1: el valor más bajo es 1,1, así que el objetivo es 2,1
          mmol/L, entre 13 km/h (1,8) y 14 km/h (2,6). v = 13 + 0,3 / 0,8 = 13,4
          km/h, es decir, 4:29 por kilómetro.
        </li>
      </ul>
      <p>
        Misma prueba, misma sangre, y los dos umbrales quedan a casi 30 segundos
        por kilómetro. Con otra regla de lectura (el punto más alejado de la
        recta que une el primer y el último escalón, por ejemplo) saldría otro
        valor más. No es un fallo de la prueba: es el motivo para preguntar
        siempre de qué umbral se habla.
      </p>

      <h2>Cómo usarlo en el entrenamiento</h2>
      <p>
        Sin laboratorio, una buena estimación de campo del LT2 es el ritmo que
        podrías mantener en carrera durante una hora, que para la mayoría de
        corredores entrenados queda entre su ritmo de 10K y el de media maratón.
        Las <Link href="/es/pace-charts">tablas de ritmos</Link> te lo dan a
        partir de una marca reciente. El pulso en el LT2 suele estar entre el 85
        y el 92 % de la frecuencia máxima, aunque las diferencias individuales
        son grandes.
      </p>
      <ul>
        <li>
          Sesiones de umbral: 3 × 10' o 5 × 6' a ritmo de LT2 con 1 a 2 minutos
          trotando, o 20 a 30 minutos seguidos. Debe sentirse «duro pero
          controlado»: puedes decir unas palabras, no una frase entera.
        </li>
        <li>
          El rodaje suave se queda por debajo del LT1. Ese techo es lo que
          intenta reflejar la <Link href="/es/learn/zone-2">zona 2</Link>, y en
          una semana <Link href="/es/learn/polarized-training">polarizada</Link>{' '}
          la mayor parte de tus minutos están ahí.
        </li>
        <li>
          Repite la prueba cada 6 a 10 semanas, o usa tus carreras: el umbral
          cambia con la forma, y unas zonas viejas acaban en el sitio
          equivocado.
        </li>
      </ul>
      <p>
        OpenAthlete no mide el lactato. Introduces o sincronizas tus zonas, y
        las estadísticas muestran cómo se reparte tu tiempo por debajo, entre y
        por encima de tus umbrales semana a semana, junto a las curvas de{' '}
        <Link href="/es/features/training-load">carga de entrenamiento</Link>.
      </p>

      <h2>Límites</h2>
      <p>
        El número depende del protocolo: con escalones más cortos sale una
        velocidad de umbral más alta, porque el lactato aún no ha terminado de
        subir cuando se toma la muestra. Los analizadores portátiles difieren
        entre sí en unas décimas de mmol/L, lo que desplaza bastante un umbral
        de valor fijo en una zona plana de la curva. Con el glucógeno bajo, el
        lactato baja a todas las velocidades y el umbral parece mejor de lo que
        es. Y una velocidad medida en cinta a 18 °C no se traslada tal cual a un
        recorrido con desnivel y calor. Si prefieres una referencia de ritmo
        sacada de tus propias carreras y no de una muestra de sangre, mira la{' '}
        <Link href="/es/learn/critical-speed">velocidad crítica</Link>, que se
        sitúa justo por encima del máximo estado estable de lactato.
      </p>
    </div>
  );
}
