import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El FTP (<em>functional threshold power</em>, umbral de potencia
        funcional) es la potencia más alta que puedes mantener de forma más o
        menos estable durante una hora aproximadamente, en vatios. Andrew Coggan
        lo definió como un sustituto práctico de los umbrales de laboratorio, y
        el libro de Hunter Allen y Coggan,{' '}
        <em>Training and Racing with a Power Meter</em>, lo convirtió en la
        referencia del entrenamiento en ciclismo: zonas, sesiones y cargas se
        expresan como porcentaje del FTP. Los potenciómetros para correr han
        llevado después la misma idea a la carrera a pie.
      </p>
      <p>
        El FTP es un dato de campo, medido con un potenciómetro y un esfuerzo a
        tope, no una frontera fisiológica medida en laboratorio. Su pariente más
        cercano en fisiología es la potencia crítica, que conviene entender a la
        vez: los dos suelen quedar a pocos vatios uno del otro y aun así no son
        lo mismo.
      </p>

      <h2>Cómo se estima el FTP</h2>
      <p>
        La definición original es la potencia media de una contrarreloj de una
        hora. Poca gente quiere hacer eso a menudo, así que la prueba habitual
        son 20 minutos a tope, normalmente precedidos de un esfuerzo duro de 5
        minutos para gastar parte de la reserva anaeróbica, con el resultado
        rebajado un 5 %:
      </p>
      <Formula
        where={[
          'P20 = potencia media de un esfuerzo de 20 minutos a tope, en vatios',
        ]}
      >
        FTP ≈ 0,95 × P20
      </Formula>
      <p>
        El factor 0,95 corrige de media el hecho de que aguantas más potencia en
        20 minutos que en 60. A unos ciclistas les encaja bien y a otros mal,
        como se ve en los límites.
      </p>

      <h2>La potencia crítica</h2>
      <p>
        La potencia crítica viene de Monod y Scherrer (1965). Si representas tus
        mejores esfuerzos como trabajo total frente a tiempo, entre unos 2 y 20
        minutos los puntos caen sobre una recta. Su pendiente es la potencia
        crítica (CP); su ordenada en el origen, W′ («W prima»), es una cantidad
        fija de trabajo que puedes hacer por encima de la CP antes de tener que
        bajar el ritmo:
      </p>
      <Formula
        where={[
          'CP = potencia crítica, en vatios',
          'W′ = capacidad de trabajo por encima de la CP, en julios',
          't = duración del esfuerzo, en segundos',
        ]}
      >
        P(t) = CP + W′ / t
      </Formula>
      <p>
        En términos fisiológicos, la CP marca la frontera entre el dominio
        intenso, donde el consumo de oxígeno y el lactato se estabilizan, y el
        dominio severo, donde siguen subiendo hasta que paras (Poole et al.,
        2016). Por encima de la CP, cada segundo gasta algo de W′; por debajo,
        W′ se recarga poco a poco. El equivalente en carrera, con velocidad en
        lugar de potencia, es la{' '}
        <Link href="/es/learn/critical-speed">velocidad crítica</Link>.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>
        Una ciclista promedia 262 W en una prueba de 20 minutos. Sus mejores
        esfuerzos recientes son 340 W en 3 minutos, 310 W en 5, 275 W en 12 y
        esos 262 W en 20.
      </p>
      <ul>
        <li>FTP ≈ 0,95 × 262 = 249 W</li>
        <li>
          Ajustando el trabajo frente al tiempo en los cuatro esfuerzos (61,2;
          93,0; 198,0 y 314,4 kJ) sale CP = 248 W y W′ = 18,0 kJ
        </li>
        <li>
          Potencia prevista en 10 minutos: 248 + 17.965 / 600 = 278 W, coherente
          con las marcas de 5 y 12 minutos que la rodean
        </li>
        <li>
          Un ataque a 400 W gasta 400 − 248 = 152 julios de W′ por segundo, así
          que 17.965 / 152 ≈ 118 segundos hasta vaciar la reserva
        </li>
      </ul>
      <p>
        Aquí FTP y CP coinciden casi al vatio. Es habitual en promedio y poco
        fiable a nivel individual: en 17 ciclistas entrenados, Karsten et al.
        (2021) encontraron una CP media de 256 W y un FTP de 249 W, pero la
        diferencia para cada ciclista iba de unos 19 W en un sentido a 33 W en
        el otro.
      </p>

      <h2>Cómo usar el FTP en el entrenamiento</h2>
      <p>
        Las zonas de potencia clásicas de Coggan son porcentajes del FTP. Con
        249 W: resistencia (56–75 %) de 139 a 187 W, tempo (76–90 %) de 189 a
        224 W, umbral (91–105 %) de 227 a 261 W y VO2max (106–120 %) de 264 a
        299 W. De ahí salen las sesiones típicas:
      </p>
      <ul>
        <li>
          2 × 20 minutos al 95–100 % del FTP (237 a 249 W), 5 minutos suaves
        </li>
        <li>3 × 12 minutos al 100–105 % con 4 minutos de recuperación</li>
        <li>5 × 4 minutos al 110–120 % (274 a 299 W), recuperación igual</li>
        <li>Salidas largas de 2 a 4 horas por debajo del 75 %</li>
      </ul>
      <p>
        CP y W′ aportan algo que el FTP no da: cuánto tiempo puedes estar por
        encima del umbral. Sirve para dosificar un puerto, una contrarreloj
        corta o una carrera llena de cambios de ritmo. Repite la prueba cada
        seis a ocho semanas, o antes si las sesiones de umbral se vuelven
        demasiado fáciles o imposibles.
      </p>
      <p>
        En OpenAthlete, el FTP de ciclismo y de carrera es una métrica que
        introduces o sincronizas; la aplicación no te hace ninguna prueba. Los
        pasos del{' '}
        <Link href="/es/features/workout-builder">
          editor de entrenamientos
        </Link>{' '}
        pueden tener como objetivo un porcentaje del FTP o de la potencia
        crítica. La vista Capacidades de las estadísticas calcula la potencia
        crítica a partir de tus mejores potencias en bici de 2 a 20 minutos y
        muestra un intervalo del 95 %: esas marcas salen del entrenamiento, no
        de pruebas máximas, así que el resultado es como mucho lo que ellas
        muestran.
      </p>

      <h2>Límites</h2>
      <p>
        La hora de la definición es aproximada. Cuando Borszcz et al. (2018)
        pidieron a 23 ciclistas entrenados que pedalearan a su FTP de 20 minutos
        hasta el agotamiento, aguantaron 50,9 minutos de media, con una
        desviación típica de casi 16 minutos: algunos pasaron de largo la hora y
        otros pararon hacia la mitad. Los perfiles con mucha capacidad
        anaeróbica sacan un FTP inflado en la prueba de 20 minutos; los diésel,
        uno demasiado bajo.
      </p>
      <p>
        Las condiciones de la prueba también mueven el número: calor en el
        rodillo sin ventilación suficiente, una salida demasiado rápida, fatiga,
        motivación. La potencia crítica tiene sus propios puntos débiles.
        Depende de las duraciones que uses, falla fuera de unos 2 a 20 minutos,
        y los esfuerzos sacados de salidas normales rara vez son a tope. Ninguno
        de los dos dice nada de la durabilidad, de cuánta de esa potencia queda
        tras tres horas sobre la bici. Para la intensidad en pulsaciones,
        consulta la{' '}
        <Link href="/es/learn/heart-rate-reserve">
          frecuencia cardíaca de reserva
        </Link>
        ; para los umbrales de laboratorio que el FTP intenta aproximar, el{' '}
        <Link href="/es/learn/lactate-threshold">umbral de lactato</Link>.
      </p>
    </div>
  );
}
