import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        La zona 2 es el ritmo suave y constante que llena casi toda una semana
        de entrenamiento bien planteada: el de las tiradas largas y los rodajes
        de recuperación, en el que todavía puedes hablar con frases completas.
        El nombre viene de la escala de pulso en cinco zonas que usan la mayoría
        de relojes y aplicaciones, donde queda entre el trote muy suave (zona 1)
        y la zona 3, ya más exigente. En términos fisiológicos corresponde a
        intensidades en el primer umbral de lactato o justo por debajo: el
        lactato en sangre apenas supera el valor de reposo y el esfuerzo se
        puede mantener durante horas.
      </p>
      <p>
        Se ha puesto de moda en los últimos años, sobre todo por las
        conversaciones sobre mitocondrias y oxidación de grasas. El consejo de
        fondo es mucho más antiguo: en casi todos los deportes de resistencia,
        los atletas pasan la mayor parte de su tiempo de entrenamiento a baja
        intensidad, como han documentado las revisiones de Stephen Seiler sobre
        el entrenamiento de élite (Seiler, 2010).
      </p>

      <h2>Cómo se calcula la zona 2</h2>
      <p>
        No hay una definición única, y de ahí viene casi toda la confusión. La
        versión más habitual con pulso usa el método de Karvonen, sobre tu{' '}
        <Link href="/es/learn/heart-rate-reserve">
          frecuencia cardíaca de reserva
        </Link>
        :
      </p>
      <Formula
        where={[
          'FCreposo: pulso en reposo, medido tumbado al despertar',
          'FCmáx: el pulso más alto que hayas visto de verdad, mejor que una fórmula por edad',
        ]}
      >
        Zona 2 = FCreposo + (0,60 a 0,70) × (FCmáx − FCreposo)
      </Formula>
      <p>
        La variante sencilla toma del 60 al 70 % de la frecuencia cardíaca
        máxima. En laboratorio, la zona 2 se fija con marcadores medidos: el
        primer umbral de lactato o ventilatorio. Los porcentajes solo aproximan
        esos umbrales, y de forma tosca.
      </p>
      <p>
        Ojo con una trampa: en el modelo de tres zonas que se usa en
        investigación (Seiler y otros), la zona 1 es todo lo que queda por
        debajo del primer umbral y la zona 2 es la franja entre el primer y el
        segundo umbral. Esa «zona 2» es ritmo de tempo, no rodaje suave. Cuando
        leas un estudio, mira qué escala utiliza.
      </p>

      <h2>Ejemplo resuelto</h2>
      <p>
        Una corredora tiene 50 ppm en reposo y ha visto 190 ppm al final de una
        sesión dura de cuestas. Su reserva es de 140 latidos.
      </p>
      <ul>
        <li>Límite inferior de la zona 2: 50 + 0,60 × 140 = 134 ppm</li>
        <li>Límite superior: 50 + 0,70 × 140 = 148 ppm</li>
        <li>
          Con el 60–70 % de la máxima: 0,60 × 190 = 114 a 0,70 × 190 = 133 ppm
        </li>
      </ul>
      <p>
        Los dos métodos casi no se solapan. Para una corredora entrenada con el
        pulso en reposo bajo, 114 ppm está cerca de caminar, y la zona por
        porcentaje de la máxima cae casi entera en zona 1. Por eso Karvonen
        suele funcionar mejor en carrera a pie, y por eso la{' '}
        <Link href="/es/tools/heart-rate-zones">
          calculadora de zonas de frecuencia cardíaca
        </Link>{' '}
        lo usa por defecto.
      </p>
      <p>
        Otro corredor, con 60 en reposo y 180 de máxima, obtiene de 132 a 144
        ppm. Números parecidos para dos personas muy distintas: las zonas solo
        tienen sentido con tus propios valores.
      </p>

      <h2>Cómo usar la zona 2 en el entrenamiento</h2>
      <p>
        Para la mayoría de corredores que entrenan de cuatro a seis días por
        semana, casi todo el tiempo de carrera va en zonas 1 y 2, con una o dos
        sesiones duras encima. En la práctica:
      </p>
      <ul>
        <li>
          Rodajes: de 40 a 70 minutos en zona 2, mejor en la parte baja el día
          después de una sesión de series.
        </li>
        <li>
          Tirada larga: de 1 h 30 a 2 h 30, casi toda en zona 2. El pulso sube
          poco a poco con el cansancio y el calor; acepta unos latidos de deriva
          en vez de acabar arrastrándote, y fíjate en cuánto deriva, porque dice
          algo de tu resistencia (ver{' '}
          <Link href="/es/learn/aerobic-decoupling">desacople aeróbico</Link>
          ).
        </li>
        <li>
          En terreno con desnivel, camina las subidas empinadas si es lo que te
          mantiene en la zona. En trail se hace igual en carrera.
        </li>
        <li>
          Mide el progreso con una referencia fija: el mismo circuito llano al
          mismo pulso cada pocas semanas. Si el ritmo a 140 ppm mejora, tu base
          aeróbica también.
        </li>
      </ul>
      <p>
        La prueba del habla sirve de control: si solo puedes decir unas pocas
        palabras seguidas, estás por encima de la zona 2, diga lo que diga el
        reloj.
      </p>
      <p>
        En OpenAthlete, las zonas de pulso se configuran por porcentaje de la
        máxima o de la reserva, por deporte, y cada actividad muestra el tiempo
        en cada zona. La{' '}
        <Link href="/es/features/training-load">
          página de carga de entrenamiento
        </Link>{' '}
        explica cómo el pulso alimenta también el{' '}
        <Link href="/es/learn/trimp">TRIMP</Link> de cada sesión.
      </p>

      <h2>Límites</h2>
      <p>
        Las zonas por porcentaje suponen que el primer umbral de todo el mundo
        está en la misma fracción de su reserva. No es así: en corredores
        entrenados puede quedar claramente por encima del 70 %, y en
        principiantes por debajo. Una prueba de umbral, en laboratorio o en
        pista, da mejores límites que cualquier porcentaje.
      </p>
      <p>
        La frecuencia máxima es el eslabón débil. Las fórmulas por edad, como la
        de Tanaka (208 − 0,7 × edad), describen un promedio de población y
        fallan por 10 latidos o más en mucha gente, lo que desplaza toda la
        zona. El calor, la deshidratación, dormir mal y la cafeína suben el
        pulso al mismo ritmo, y en cuestas cortas el corazón reacciona tarde.
      </p>
      <p>
        Por último, pon las promesas en su sitio. Buena parte del entusiasmo
        reciente por la zona 2, las mitocondrias y la quema de grasa se apoya en
        comparaciones entre ciclistas profesionales y personas poco entrenadas
        (San-Millán y Brooks, 2018). Muestran en qué se diferencian los atletas
        entrenados, no lo que una cantidad concreta de zona 2 hará por ti. El
        volumen suave funciona, y un poco de intensidad encima también: esa es
        la idea del{' '}
        <Link href="/es/learn/polarized-training">
          entrenamiento polarizado
        </Link>
        .
      </p>
    </div>
  );
}
