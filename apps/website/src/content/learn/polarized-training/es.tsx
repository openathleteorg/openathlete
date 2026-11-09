import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El entrenamiento polarizado describe una forma de repartir la
        intensidad: la mayor parte del volumen claramente suave, una parte más
        pequeña pero real claramente dura, y muy poco en medio. La idea no salió
        de un protocolo de laboratorio, sino de observar lo que hacen de verdad
        los deportistas de resistencia de élite. Al revisar los estudios
        descriptivos, Stephen Seiler vio que los atletas de nivel nacional e
        internacional que entrenan de 10 a 13 veces por semana tienden a hacer
        alrededor del 80 % de sus sesiones a baja intensidad y un 20 % dominadas
        por trabajo duro, como series en torno al 90 % del VO2max (Seiler,
        2010).
      </p>
      <p>
        Ese patrón se resume a menudo como «80/20». El atajo esconde dos
        detalles importantes: qué zonas cuentas y si cuentas sesiones o minutos.
      </p>

      <h2>Las tres zonas</h2>
      <p>
        El entrenamiento polarizado usa un modelo de tres zonas basado en dos
        umbrales fisiológicos. La zona 1 está por debajo del primer umbral
        ventilatorio o{' '}
        <Link href="/es/learn/lactate-threshold">umbral de lactato</Link>{' '}
        (lactato en sangre en torno a 2 mmol/L): rodaje suave en el que puedes
        hablar con frases completas. La zona 2 queda entre los dos umbrales. La
        zona 3 empieza por encima del segundo umbral (en torno a 4 mmol/L, cerca
        de la <Link href="/es/learn/critical-speed">velocidad crítica</Link>),
        donde viven las series.
      </p>
      <p>
        Cuidado con la coincidencia de nombres. En los sistemas de cinco zonas
        de la mayoría de los relojes, la «
        <Link href="/es/learn/zone-2">zona 2</Link>» es resistencia aeróbica
        suave, que cae dentro de la zona 1 del modelo de tres zonas. El
        entrenamiento polarizado no te pide evitar esos rodajes suaves; te pide
        pasar poco tiempo entre los dos umbrales.
      </p>

      <h2>Ponerle un número</h2>
      <p>
        Treff y sus colegas (2019) propusieron un índice de polarización para
        distinguir una distribución polarizada de las demás, a partir de la
        fracción del tiempo (o la distancia) de entrenamiento en cada una de las
        tres zonas:
      </p>
      <Formula
        where={[
          'Z1, Z2, Z3 = fracción del tiempo total en cada zona (0,80 para 80 %), Z1 + Z2 + Z3 = 1',
          'Válido si Z1 > Z3 > Z2. Si Z3 = 0, PI = 0. Si Z2 = 0, usa 0,01 para Z2 y Z3 − 0,01 para Z3',
          'PI > 2,00: polarizado. PI ≤ 2,00: no polarizado',
        ]}
      >
        PI = log10(Z1 / Z2 × Z3 × 100)
      </Formula>

      <h2>Un ejemplo con números</h2>
      <p>
        Una corredora entrena 8 horas por semana. En un mes, su tiempo por zona
        queda en un 80 % en zona 1, un 5 % en zona 2 y un 15 % en zona 3.
      </p>
      <ul>
        <li>Z1 / Z2 = 0,80 / 0,05 = 16</li>
        <li>16 × 0,15 × 100 = 240</li>
        <li>PI = log10(240) = 2,38, por encima de 2,00: polarizado</li>
      </ul>
      <p>
        Cambia la mezcla a 75 % / 20 % / 5 %, una pirámide con mucho tempo y
        pocas series: PI = log10(0,75 / 0,20 × 0,05 × 100) = log10(18,75) =
        1,27. Un bloque centrado en el umbral, 60 % / 35 % / 5 %, da 0,93.
        Mismas horas semanales, tres semanas muy distintas.
      </p>

      <h2>¿Sesiones o minutos?</h2>
      <p>
        El 80/20 de Seiler cuenta sesiones. El tiempo por zona da otra imagen,
        porque una sesión dura es sobre todo calentamiento, recuperaciones y
        vuelta a la calma. Una sesión de 70 minutos con 5 × 4' a ritmo de 3000 a
        5000 m tiene 20 minutos de trabajo, y como el pulso va con retraso, el
        reloj registra todavía menos en zona 3. Seiler y Kjerland (2006)
        midieron las dos cosas en once esquiadores de fondo júnior durante 32
        días: por frecuencia cardíaca, sus sesiones de resistencia se
        repartieron en 75 % / 8 % / 17 % entre las tres zonas, y el RPE de
        sesión dio casi lo mismo. Cuatro rodajes de una hora más esa sesión de
        series forman una semana 80/20 por sesiones, pero solo 20 de sus 310
        minutos, alrededor del 6 %, son duros. Ninguna lectura es incorrecta,
        pero compara lo comparable.
      </p>

      <h2>Cómo aplicarlo</h2>
      <p>
        Para un corredor con cinco o seis sesiones por semana, una semana
        polarizada puede ser así: tres o cuatro rodajes suaves y una tirada
        larga, todos por debajo del primer umbral, más una o dos sesiones duras
        como 5 × 4' o 6 × 3' a ritmo de 3000 a 5000 m con recuperaciones al
        trote de la misma duración. Los días suaves tienen que seguir siendo
        suaves, lo que para casi todos significa más lento de lo que nos
        gustaría; fija el techo con la{' '}
        <Link href="/es/tools/heart-rate-zones">
          calculadora de zonas de frecuencia cardíaca
        </Link>{' '}
        o con la prueba del habla. Las estadísticas de OpenAthlete muestran la
        parte del entrenamiento por debajo, entre y por encima de tus umbrales,
        suficiente para comprobar qué tipo de semana hiciste en realidad.
      </p>

      <h2>Límites</h2>
      <p>
        El mejor respaldo experimental viene de Stöggl y Sperlich (2014): 48
        corredores, ciclistas, triatletas y esquiadores bien entrenados
        siguieron durante nueve semanas uno de cuatro programas, y el grupo
        polarizado mejoró su VO2pico un 11,7 % y su tiempo hasta el agotamiento
        un 17,4 %, más que los grupos de volumen, umbral o series. Nueve semanas
        y 48 deportistas repartidos en cuatro grupos es un estudio corto y
        pequeño, con sujetos que ya estaban en forma. El propio Seiler (2010)
        presenta el 80/20 como descriptivo: es hacia donde convergen los atletas
        que triunfan, no la prueba de que sea lo mejor para todos. Un corredor
        con cuatro horas a la semana quizá gane más con algo de trabajo de
        umbral que con una polarización estricta; la pregunta sigue abierta. Por
        último, las zonas dependen de umbrales que hay que medir o estimar, y un
        error de 10 pulsaciones mueve minutos de una zona a otra.
      </p>
    </div>
  );
}
