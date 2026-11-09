import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El VO2max es el ritmo más alto al que puedes tomar oxígeno del aire y
        usarlo en los músculos. Se expresa en litros por minuto o, más útil para
        un corredor, en mililitros por kilo y por minuto, porque un cuerpo más
        pesado cuesta más de mover. A. V. Hill describió la meseta del consumo
        de oxígeno en los años veinte, y desde entonces es la cifra estrella de
        la fisiología del fondo. Mide el tamaño de tu motor aeróbico. Por sí
        solo, no decide lo rápido que corres una carrera.
      </p>

      <h2>Qué determina el VO2max: la ecuación de Fick</h2>
      <p>
        El consumo de oxígeno es el producto de la sangre que bombea el corazón
        por el oxígeno que los músculos extraen de ella:
      </p>
      <Formula
        where={[
          'Q = gasto cardíaco (litros de sangre por minuto) = frecuencia cardíaca × volumen sistólico',
          'CaO2 − CvO2 = diferencia de contenido de oxígeno entre sangre arterial y venosa (ml de O2 por litro)',
        ]}
      >
        VO2 = Q × (CaO2 − CvO2)
      </Formula>
      <p>
        En esfuerzo máximo, la extracción difiere menos entre entrenados y
        sedentarios que el gasto cardíaco, y la frecuencia cardíaca máxima no
        sube con el entrenamiento. Lo que separa un 40 de un 70 es sobre todo el
        volumen sistólico, la sangre expulsada en cada latido. Bassett y Howley
        (2000) concluyen que en deportistas entrenados el VO2max está limitado
        sobre todo por el aporte de oxígeno, más que por los músculos.
      </p>

      <h2>Cómo se mide o se estima</h2>
      <p>
        La referencia es la prueba de laboratorio: carrera en cinta con
        velocidad creciente y una mascarilla que analiza el aire espirado, hasta
        que el consumo de oxígeno deja de subir aunque aumente la velocidad.
        Todo lo demás es una estimación:
      </p>
      <ul>
        <li>
          El test de Cooper (Cooper, 1968): distancia recorrida en 12 minutos y
          VO2max = (distancia en metros − 504,9) / 44,73.
        </li>
        <li>
          El cociente de frecuencias (Uth et al., 2004): VO2max ≈ 15,3 × FCmáx /
          FCreposo. Rápido, pero exige una FC máxima real e ignora lo rápido que
          corres.
        </li>
        <li>
          El rendimiento en carrera: el <Link href="/es/learn/vdot">VDOT</Link>{' '}
          de Daniels convierte una marca en un VO2max «efectivo» que incluye tu
          economía de carrera.
        </li>
        <li>
          Los relojes: Garmin, Polar, COROS y otros lo estiman con la relación
          entre pulso y ritmo o potencia, con modelos que no publican del todo.
        </li>
      </ul>

      <h2>Un ejemplo con números</h2>
      <p>
        Un corredor hace 2900 m en el test de Cooper, tiene 48 pulsaciones en
        reposo y 188 de máxima, y acaba de correr un 10K en 45:00.
      </p>
      <ul>
        <li>Cooper: (2900 − 504,9) / 44,73 = 53,5 ml/kg/min</li>
        <li>Cociente de frecuencias: 15,3 × 188 / 48 = 59,9 ml/kg/min</li>
        <li>VDOT del 10K: 45,3</li>
      </ul>
      <p>
        Tres cifras entre 45 y 60 para la misma persona. Ninguna está mal: miden
        cosas distintas. El cociente solo mira el corazón, el Cooper un esfuerzo
        de 12 minutos y el VDOT lo que el corredor produce de verdad durante 45
        minutos. Una diferencia así suele indicar un buen motor con margen de
        mejora en economía y resistencia.
      </p>
      <p>
        Para la versión de laboratorio, con valores plausibles: un gasto
        cardíaco de 25 litros por minuto y una extracción de 160 ml de oxígeno
        por litro de sangre dan 4000 ml/min, es decir, 57 ml/kg/min para un
        corredor de 70 kg.
      </p>

      <h2>VO2max, VAM y economía de carrera</h2>
      <p>
        En llano, correr cuesta unos 3,5 ml/kg/min de oxígeno por cada km/h
        (Léger y Mercier, 1984). Si divides el VO2max por ese coste obtienes una{' '}
        <Link href="/es/learn/vma">VAM</Link> aproximada: 53,5 / 3,5 ≈ 15,3
        km/h, cerca de los 15 km/h que este corredor saca en el test de 6
        minutos. Quien gasta menos oxígeno por km/h, el más económico, va más
        rápido con el mismo VO2max. Joyner y Coyle (2008) describen el
        rendimiento de resistencia como tres factores a la vez: el VO2max, la
        fracción que puedes sostener (ligada al umbral de lactato) y la
        economía.
      </p>

      <h2>Cómo usarlo en el entrenamiento</h2>
      <p>
        El VO2max responde al trabajo cercano a él: de 4 a 6 repeticiones de 3 a
        5 minutos al 95–100 % de la VAM, con recuperaciones de duración
        parecida, o formatos cortos como el 30/30. También sube con el volumen
        de rodaje suave, gracias a un mayor volumen sistólico. Para fijar
        ritmos, la VAM y el VDOT son más prácticos, porque son velocidades. En
        OpenAthlete, el VO2max es una métrica que se importa de Garmin, Polar o
        COROS o se introduce a mano, y puedes seguirla en la página de métricas
        junto a la <Link href="/es/learn/hrv">VFC</Link> y el pulso en reposo.
        La <Link href="/es/tools/vma">calculadora de VAM</Link> te da los
        ritmos.
      </p>

      <h2>Limitaciones</h2>
      <p>
        Entre corredores de nivel parecido, el VO2max predice mal los
        resultados: la economía y la fracción sostenible pesan lo mismo. Los
        valores del reloj se mueven con el calor, las cuestas, la fatiga y una
        frecuencia máxima mal configurada, así que léelos como tendencia
        semanal. La genética marca buena parte del techo y las mejoras se frenan
        tras los primeros años, mientras que el umbral y la economía pueden
        seguir progresando mucho tiempo.
      </p>
    </div>
  );
}
