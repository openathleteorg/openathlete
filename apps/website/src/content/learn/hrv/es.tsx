import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Tu corazón no late como un metrónomo. A 50 pulsaciones por minuto, el
        intervalo medio entre latidos es de 1,2 segundos, pero uno puede durar
        1150 ms y el siguiente 1240 ms. La variabilidad de la frecuencia
        cardíaca (VFC, o HRV en inglés) mide esa variación. La mayor parte de la
        variación rápida, latido a latido, viene del nervio vago, el «freno»
        parasimpático del corazón. Por eso la VFC es una ventana, estrecha y con
        mucho ruido, a cómo tu sistema nervioso autónomo lleva el entrenamiento,
        el sueño, las enfermedades y el estrés.
      </p>

      <h2>Cómo se calcula la VFC</h2>
      <p>
        Existen decenas de índices de VFC (el documento de la Task Force de 1996
        recoge casi todos). Los deportistas y sus relojes usan sobre todo el
        rMSSD, la raíz cuadrada de la media de los cuadrados de las diferencias
        sucesivas entre intervalos RR:
      </p>
      <Formula
        where={[
          'RRi = tiempo entre dos latidos consecutivos, en milisegundos',
          'N = número de intervalos del registro',
        ]}
      >
        rMSSD = √( Σ (RRi+1 − RRi)² / (N − 1) )
      </Formula>
      <p>
        El rMSSD refleja bien la actividad vagal y funciona con registros
        cortos: unos minutos tumbado al despertar, o las fases de sueño profundo
        que el reloj elige por la noche. Como los valores diarios son
        asimétricos (unas pocas noches muy altas tiran de la media), los
        estudios de entrenamiento suelen tomar el logaritmo natural, ln rMSSD,
        antes de promediar.
      </p>

      <h2>Un ejemplo con cifras</h2>
      <p>
        Toma cinco intervalos RR consecutivos: 1000, 1050, 980, 1020 y 990 ms.
      </p>
      <ul>
        <li>Diferencias sucesivas: +50, −70, +40, −30 ms</li>
        <li>Cuadrados: 2500 + 4900 + 1600 + 900 = 9900</li>
        <li>Media sobre las 4 diferencias: 9900 / 4 = 2475</li>
        <li>rMSSD = √2475 = 49,7 ms, es decir, ln rMSSD = 3,91</li>
      </ul>
      <p>
        Un registro real tiene cientos de intervalos, pero la cuenta es la
        misma. Ahora una semana de lecturas nocturnas: 62, 58, 65, 48, 60, 63 y
        59 ms. La media de sus logaritmos es 4,08, que equivale a 59 ms. La
        noche de 48 ms, tras la tirada larga del domingo, asusta vista sola y
        apenas mueve la cifra semanal. Si la semana siguiente marca 52, 49, 55,
        50, 47, 51 y 48 ms, el valor de 7 días baja a 3,92 (50 ms). Eso ya es un
        cambio sostenido y merece una pregunta.
      </p>

      <h2>Cómo usarla en el entrenamiento</h2>
      <p>
        El dato de una sola mañana dice poco. Plews y sus colegas (2013)
        mostraron que, en atletas de resistencia de élite, la media móvil de 7
        días del ln rMSSD, y cuánto oscila, sigue la adaptación mucho mejor que
        las lecturas sueltas. Una rutina práctica:
      </p>
      <ul>
        <li>
          Mide siempre igual: de noche con el mismo reloj, o al despertar,
          tumbado y antes del café.
        </li>
        <li>
          Construye una referencia con al menos tres o cuatro semanas de
          entrenamiento normal y define tu rango habitual alrededor.
        </li>
        <li>
          Lee la media de 7 días frente a ese rango, junto al pulso en reposo,
          el sueño y las sensaciones de las sesiones.
        </li>
      </ul>
      <p>
        Kiviniemi y sus colegas (2007) fueron más lejos: un grupo de hombres
        moderadamente entrenados solo hacía las sesiones duras los días en que
        la VFC no había bajado, y rodaje suave el resto. Mejoraron su velocidad
        máxima de carrera más que un grupo con un plan fijo. La idea es útil,
        pero es un estudio con grupos pequeños, no una regla. Para la mayoría,
        la VFC sirve sobre todo para mirar una semana con más atención: si la
        media de 7 días lleva una semana por debajo de tu rango, el pulso en
        reposo ha subido y las 5 × 4' en umbral te parecieron una carrera, toca
        día suave.
      </p>
      <p>
        OpenAthlete importa la VFC nocturna de Garmin, Polar, Suunto y COROS
        (también puedes anotarla a mano), muestra el valor de la noche en la
        fila de bienestar de cada día del calendario y dibuja la media móvil de
        7 días del ln rMSSD en las estadísticas de recuperación. Muestra la
        tendencia; no la convierte en una puntuación de disponibilidad.
      </p>

      <h2>Límites</h2>
      <p>
        Los valores absolutos son personales: entre personas sanas y en forma
        van de menos de 30 a más de 100 ms, así que compararte con un compañero
        de entrenamiento no tiene sentido. Los dispositivos también difieren:
        unos dan el rMSSD de toda la noche, otros el de una ventana de 5
        minutos, otros una puntuación propia; cambiar de reloj reinicia tu
        referencia. El alcohol, una cena tardía, el calor, los viajes y el ciclo
        menstrual mueven la VFC sin relación con el entrenamiento. Y más alto no
        siempre es mejor: Buchheit (2014) señala que en atletas muy entrenados
        la VFC puede estancarse o incluso bajar en plena carga mientras se
        adaptan bien, y que una subida brusca puede acompañar una fatiga
        profunda. La VFC es una señal entre otras; léela junto a{' '}
        <Link href="/es/learn/session-rpe">
          lo duras que se sintieron las sesiones
        </Link>{' '}
        y a <Link href="/es/learn/ctl-atl-tsb">tus curvas de carga</Link>, nunca
        sola.
      </p>
    </div>
  );
}
