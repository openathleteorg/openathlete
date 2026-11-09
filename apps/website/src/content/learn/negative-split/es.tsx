import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Hacer un split negativo es correr la segunda mitad de una carrera más
        rápido que la primera. Lo contrario, el split positivo, es lo que hace
        casi todo el mundo sin proponérselo: una salida empujada por la
        adrenalina y el ambiente, y después un largo bajón. Los entrenadores lo
        recomiendan desde hace décadas, sobre todo como antídoto contra ese
        bajón. La evidencia es más escasa de lo que sugiere el consejo, pero el
        hábito que crea, contenerse al principio, sirve para cualquier distancia
        a partir del 10K.
      </p>

      <h2>Cómo se mide</h2>
      <p>
        Divide la carrera en dos tramos de igual distancia y compara los
        tiempos. Si expresas la diferencia como porcentaje de la primera mitad,
        puedes comparar un 10K con un maratón:
      </p>
      <Formula
        where={[
          'T1 = tiempo de la primera mitad, T2 = tiempo de la segunda',
          'Valor negativo: split negativo. Valor positivo: split positivo. Entre −1 y +1 % aproximadamente: ritmo constante',
        ]}
      >
        split (%) = (T2 − T1) / T1 × 100
      </Formula>
      <p>
        El margen de ±1 % para hablar de ritmo constante es una convención
        práctica, no una norma: la deriva del GPS, el viento o una sola cuesta
        bastan para mover una mitad esa cantidad. En un recorrido con desnivel o
        de punto a punto, compara mitades de perfil parecido, o mira el{' '}
        <Link href="/es/learn/grade-adjusted-pace">
          ritmo ajustado por pendiente
        </Link>{' '}
        en lugar del reloj.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>
        Una corredora busca 50:00 en 10 km, es decir, 5:00/km de media. Pasa el
        km 5 en 25:30 (5:06/km) y corre los otros 5 km en 24:30 (4:54/km).
      </p>
      <ul>
        <li>T2 − T1 = 1470 − 1530 = −60 s</li>
        <li>split = −60 / 1530 × 100 = −3,9 %</li>
      </ul>
      <p>
        Es un split negativo claro, quizá demasiado: recuperar un minuto en la
        segunda mitad de un 10K suele indicar que la salida fue muy conservadora
        y que se quedó tiempo en el asfalto.
      </p>
      <p>
        En maratón los márgenes son más finos. Para 3:30:00 (4:59/km de media),
        un plan sensato es pasar la media en 1:45:50 (5:01/km) y correr la
        segunda mitad en 1:44:10 (4:56/km): un split de −1,6 %. Ir apenas dos o
        tres segundos por kilómetro más lento que la media en la primera mitad
        cuesta 50 segundos en el paso y deja margen para los últimos 10 km, que
        es donde se pierden la mayoría de los maratones.
      </p>

      <h2>Cómo usarlo</h2>
      <p>
        No se trata de esprintar al final, sino de no pagar intereses por una
        salida demasiado rápida. Los primeros kilómetros por encima de tu ritmo
        sostenible gastan glucógeno y tolerancia a la fatiga que no vas a
        recuperar más adelante. Algunas reglas prácticas:
      </p>
      <ul>
        <li>
          Fija el ritmo objetivo a partir de una carrera reciente, no de un
          deseo. El{' '}
          <Link href="/es/tools/race-predictor">predictor de tiempos</Link> y
          las <Link href="/es/pace-charts">tablas de ritmos</Link> te dan los
          parciales por kilómetro para un tiempo final.
        </li>
        <li>
          En media maratón o maratón, corre los primeros 3 a 5 km entre 5 y 10
          segundos por kilómetro más lento que el ritmo objetivo y luego
          asiéntate. En un 10K, el kilómetro que hay que frenar es el primero.
        </li>
        <li>
          Ensáyalo. Un rodaje progresivo, por ejemplo 12 km empezando suave y
          terminando los últimos 3 a ritmo de maratón, te enseña cómo se siente
          la contención. Una tirada larga de 26 km con los últimos 8 a ritmo de
          maratón hace lo mismo con más fatiga encima.
        </li>
        <li>
          Analiza la carrera después por su split. Un split positivo de más del
          3 o 4 % en maratón casi siempre apunta a la primera mitad, no a la
          segunda.
        </li>
      </ul>

      <h2>Límites</h2>
      <p>
        La ciencia no convierte el split negativo en ley. En su revisión sobre
        estrategias de ritmo, Abbiss y Laursen (2008) señalan que repartir el
        ritmo de forma uniforme suele convenir en pruebas de más de un par de
        minutos, y que en pruebas muy largas los deportistas entrenados suelen
        ir frenando poco a poco, digan lo que digan sus planes. Díaz y sus
        colegas (2018) analizaron todos los récords mundiales de maratón de los
        últimos cincuenta años: de media, los plusmarquistas corrieron la
        primera mitad algo más rápido que la segunda. Los récords más recientes
        fueron los más regulares, y los autores sugieren que el futuro está en
        un ritmo casi constante más que en un split negativo marcado.
      </p>
      <p>
        Así que el objetivo realista para la mayoría es un ritmo constante con
        una ligera tendencia negativa, no un final espectacular. El recorrido
        también influye: una carrera que sube en la segunda mitad dará un split
        positivo en el reloj aunque el esfuerzo haya sido perfectamente
        constante. En trail y ultras, donde el terreno y la noche pesan sobre la
        segunda mitad, comparar mitades por tiempo dice poco; el esfuerzo
        percibido, el pulso y la alimentación importan más.
      </p>
    </div>
  );
}
