import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        La VAM, velocidad aeróbica máxima (en Francia, VMA; en inglés, MAS o
        vVO2max), es la velocidad de carrera más baja a la que tu consumo de
        oxígeno llega a su techo, tu <Link href="/es/learn/vo2max">VO2max</Link>
        . Si corres más rápido, la energía extra sale del metabolismo
        anaeróbico, y por eso la mayoría solo aguanta la VAM entre 4 y 8
        minutos. El concepto se hizo popular en la escuela francesa, con el test
        en pista de Luc Léger en 1980 y los trabajos de Véronique Billat en los
        años noventa. Su ventaja es práctica: el VO2max es un dato de
        laboratorio en mililitros; la VAM es una velocidad que puedes correr en
        una pista.
      </p>

      <h2>Cómo se calcula la VAM</h2>
      <p>
        El método de campo más directo es el test de 6 minutos (medio Cooper).
        Tras 20 minutos de calentamiento y unas progresiones, corres la mayor
        distancia posible en 6 minutos, a ritmo constante. Seis minutos entran
        en el tiempo que casi todos aguantan a VAM, así que tu velocidad media
        es una buena estimación:
      </p>
      <Formula
        where={[
          'distancia en metros, tiempo en minutos; × 0,06 pasa de m/min a km/h',
        ]}
      >
        VAM (km/h) = distancia / tiempo × 0,06
      </Formula>
      <p>
        El test de Cooper de 12 minutos es más fácil de dosificar, pero da un
        valor algo bajo: casi todo el mundo se frena pasados 6 o 7 minutos a esa
        velocidad. Los tests progresivos (el de Léger y Boucher, el VAMEVAL)
        suben la velocidad 0,5 o 1 km/h por etapa hasta que no puedes seguir; la
        última etapa completada da la VAM. Necesitan pista, conos y una pista de
        audio, pero eliminan el problema del ritmo.
      </p>
      <p>
        También puedes partir de una carrera reciente. Cada distancia se corre a
        una fracción típica de la VAM: alrededor del 95 % en 5K, 90 % en 10K, 85
        % en media maratón y 80 % en maratón. Divide tu velocidad media por esa
        fracción. Un 5K o 10K llano estima mejor que un maratón, donde la
        hidratación, los geles y el calor pesan más que la potencia aeróbica.
      </p>

      <h2>Un ejemplo con números</h2>
      <ul>
        <li>
          Test de 6 minutos: 1500 m → 1500 / 6 × 0,06 = 15,0 km/h (4:00/km)
        </li>
        <li>
          Test de Cooper, mismo corredor: 2900 m en 12 minutos → 14,5 km/h
        </li>
        <li>10K en 45:00: 13,33 km/h de media, entre 0,90 → 14,8 km/h</li>
      </ul>
      <p>
        Tres métodos y tres resultados separados por menos de 0,5 km/h. Esa
        dispersión es normal y recuerda que la VAM es una estimación con margen,
        no un dato fijo como tu altura. Con 15 km/h, los ritmos quedan así:
      </p>
      <ul>
        <li>100 % VAM: 15,0 km/h, 4:00/km, 125 m en 30 segundos</li>
        <li>95 %: 14,25 km/h, 4:13/km</li>
        <li>85 % (cerca del umbral para muchos): 12,75 km/h, 4:42/km</li>
        <li>65–75 % (rodaje suave): 9,75 a 11,25 km/h, de 6:09 a 5:20/km</li>
      </ul>

      <h2>Cómo usarla en el entrenamiento</h2>
      <p>
        La VAM es la regla con la que se miden las series. Formatos clásicos a
        VAM o cerca: el 30/30 (30 segundos al 100 % y 30 de trote) de 10 a 20
        veces, 6 × 1000 m al 95 % con 2 minutos de recuperación, 5 × 3 minutos
        entre el 95 y el 100 %. Billat mostró que el tiempo que se aguanta a VAM
        varía mucho entre corredores del mismo nivel (Billat y Koralsztein,
        1996); por eso las repeticiones cortas con recuperaciones cortas
        permiten acumular más minutos a esa intensidad que un solo esfuerzo
        largo.
      </p>
      <p>
        Por debajo de la VAM, los porcentajes son menos fiables. Dos corredores
        de 15 km/h pueden tener el umbral al 82 % y al 90 % de su VAM, según su
        fondo y su historial. Para el tempo y la tirada larga, el pulso (mira la{' '}
        <Link href="/es/tools/heart-rate-zones">
          calculadora de zonas de frecuencia cardíaca
        </Link>
        ) o los ritmos basados en carreras como el{' '}
        <Link href="/es/learn/vdot">VDOT</Link> suelen guiar mejor. La{' '}
        <Link href="/es/tools/vma">calculadora de VAM</Link> convierte un test o
        una carrera en ritmos, y las{' '}
        <Link href="/es/pace-charts">tablas de ritmos</Link> hacen la cuenta por
        kilómetro.
      </p>
      <p>
        En OpenAthlete, la VAM es una de tus capacidades. Los pasos de una
        sesión pueden apuntar a un porcentaje de ella (por ejemplo, 95 %), y la
        sesión llega con ritmos reales a los relojes Garmin, Suunto o COROS.
      </p>

      <h2>Limitaciones</h2>
      <p>
        La VAM depende del test: cinta, pista, carretera con cuestas o un día de
        viento dan cifras distintas, y unos 6 minutos mal dosificados pueden
        costar 0,5 km/h. Además mezcla dos cosas, el VO2max y la economía de
        carrera: dos corredores con el mismo VO2max pueden tener 1 o 2 km/h de
        diferencia de VAM si uno corre de forma más económica. Y dice poco de la
        resistencia. Un corredor con VAM alta y pocos kilómetros se hundirá en
        una media que otro con menos VAM y más volumen termina cómodo. Úsala
        para fijar los ritmos de series, repite el test cada dos o tres meses y
        deja que las carreras te cuenten el resto.
      </p>
    </div>
  );
}
