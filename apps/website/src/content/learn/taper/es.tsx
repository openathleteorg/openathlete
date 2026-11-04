import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El tapering, o puesta a punto, es el tramo de entrenamiento más suave
        antes de una carrera objetivo. La lógica es sencilla: semanas de trabajo
        duro te dejan más en forma y también más cansado, y el cansancio se va
        antes que la forma. Si bajas la carga un tiempo, la fatiga desaparece y
        la mayor parte de lo ganado se queda. Bien hecho, llegas a la salida más
        fresco que en meses. Mal hecho, porque recortaste poco o descansaste de
        más, llegas todavía cansado o algo apagado.
      </p>

      <h2>Qué dicen los estudios</h2>
      <p>
        Bosquet y sus colegas (2007) reunieron 27 estudios con deportistas de
        competición en carrera, ciclismo y natación. El patrón que mejor
        funcionó fue un tapering de unas dos semanas, con un recorte progresivo
        del volumen del 41 al 60%, sin cambiar la intensidad ni el número de
        sesiones semanales. Mujika y Padilla (2003), revisando la literatura
        anterior, llegaron a una receta parecida: mantener la intensidad,
        reducir mucho el volumen, no bajar la frecuencia más de un 20% y
        preferir una bajada progresiva a un corte brusco. Situaban la mejora
        habitual en torno al 3%, con un rango del 0,5 al 6%.
      </p>
      <p>
        En maratonianos populares, Smyth y Lawlor (2021) analizaron los
        registros de más de 158.000 corredores. Los tapers estrictos, en los que
        el volumen baja semana tras semana, se asociaron con mejores marcas que
        los relajados, y los estrictos de tres semanas fueron los mejores, con
        un ahorro mediano de unos cinco minutos y medio (2,6%) frente a un taper
        mínimo. Son datos observacionales: quizá los corredores más
        disciplinados simplemente hacen mejor el taper. Pero apuntan en la misma
        dirección que los ensayos.
      </p>

      <h2>El tapering en forma física, fatiga y frescura</h2>
      <p>
        El <Link href="/es/learn/ctl-atl-tsb">modelo forma-fatiga</Link> hace
        visible el mecanismo. La forma física (CTL) es una media exponencial de
        la carga diaria con una constante de 42 días, la fatiga (ATL) otra con
        una constante de 7 días, y la frescura (TSB) es la diferencia:
      </p>
      <Formula
        where={[
          'Peso diario de la CTL = 1 − e^(−1/42) ≈ 0,024',
          'Peso diario de la ATL = 1 − e^(−1/7) ≈ 0,133',
        ]}
      >
        CTL(hoy) = CTL(ayer) + (carga − CTL(ayer)) × 0,024
      </Formula>
      <p>
        Como la ATL reacciona unas cinco veces y media más rápido que la CTL,
        bajar la carga hace caer la fatiga mucho antes que la forma, y la TSB
        sube. Ese es todo el tapering en una frase.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>
        Un maratoniano lleva tres semanas en unos 560 de{' '}
        <Link href="/es/learn/trimp">TRIMP</Link> semanales (unos 80 km en su
        caso, 80 por día de media), tras una base de 65 por día. Para que las
        cuentas sean legibles, la carga se reparte por igual en cada semana.
      </p>
      <ul>
        <li>Inicio del tapering: CTL 70,9, ATL 79,3, TSB −8,4.</li>
        <li>
          A dos semanas, el volumen baja un 30% (unos 56 km, 56 por día). Al
          final de esa semana: CTL 68,6, ATL 64,6, TSB +4,1.
        </li>
        <li>
          Semana de carrera, volumen al 45% del pico (unos 36 por día, unos 30
          km antes del día D). La víspera: CTL 64,3, ATL 48,1, TSB +16,2.
        </li>
      </ul>
      <p>
        En dos semanas, la fatiga bajó 31 puntos y la forma 6,6, alrededor de un
        9%. Si ese corredor hubiera parado del todo esos 13 días, su CTL habría
        caído a unos 52. El modelo es tosco, pero muestra por qué se recorta
        volumen en lugar de parar y por qué el efecto se concentra en los
        últimos días.
      </p>

      <h2>Cómo hacer el tapering</h2>
      <ul>
        <li>
          Maratón: dos o tres semanas. 10K o media: una o dos semanas. Carrera
          secundaria: tres o cuatro días más suaves.
        </li>
        <li>
          Baja el volumen poco a poco: un 20 a 30% la primera semana de un taper
          de tres, un 40 a 60% en la semana de carrera. Acorta primero la tirada
          larga.
        </li>
        <li>
          Mantén el ritmo de la semana y algo de intensidad. Por ejemplo, 3 × 2
          km a ritmo de maratón diez días antes y 6 × 1 min algo más rápido que
          el ritmo de carrera cuatro días antes: las piernas no pierden la
          costumbre de la velocidad y no sumas fatiga.
        </li>
        <li>
          Duerme, come con normalidad y deja las zapatillas nuevas, los geles
          nuevos y los ejercicios de fuerza nuevos para después.
        </li>
      </ul>
      <p>
        En OpenAthlete puedes marcar esas semanas como un ciclo de entrenamiento
        en fase de tapering, y las{' '}
        <Link href="/es/features/training-load">
          curvas de carga de entrenamiento
        </Link>{' '}
        se proyectan sobre las sesiones planificadas: ves la frescura con la que
        llegarás al día de la carrera antes de hacer la primera sesión del
        taper.
      </p>

      <h2>Límites</h2>
      <p>
        No existe una TSB objetivo validada para el día de la carrera: el número
        depende de cómo se mida la carga y del deportista, y los mejores tapers
        de los estudios se juzgaron por el rendimiento, no por una curva. Un
        tapering no salva una preparación demasiado corta ni corrige en una
        semana un sobreentrenamiento acumulado. Las sensaciones también engañan:
        piernas pesadas y nervios son frecuentes y suelen desaparecer en la
        salida. Usa las curvas para planificar y las sesiones a ritmo de carrera
        para juzgar.
      </p>
    </div>
  );
}
