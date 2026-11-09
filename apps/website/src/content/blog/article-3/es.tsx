import Link from 'next/link';

import { Sources } from './sources';

export function ContentEs() {
  return (
    <div>
      <p>
        Pregunta a diez corredores por qué se lesionaron y casi todos tendrán
        una causa a mano: las zapatillas nuevas, la sesión en pista, la carrera
        con demasiada bajada, "hice demasiado, demasiado pronto". La
        investigación es menos tajante. La relación entre carga de entrenamiento
        y lesiones existe, pero es más débil, más ruidosa y más individual de lo
        que sugieren los paneles de la mayoría de las apps. Este artículo repasa
        lo que la evidencia permite afirmar y dónde se acaba.
      </p>

      <h2>Con qué frecuencia se lesionan los corredores</h2>
      <p>
        Una revisión sistemática sobre corredores de fondo encontró tasas
        anuales de lesión de entre el 19 % y el 79 % según el estudio (van Gent
        et al., 2007). Esa dispersión dice tanto de cómo cada estudio define una
        lesión como de la carrera en sí. Contar por hora de carrera es más útil:
        un metaanálisis posterior situó a los principiantes en unas 18 lesiones
        por cada 1.000 horas, frente a unas 8 en corredores habituales (Videbæk
        et al., 2015). Con el mismo tiempo corriendo, un principiante se lesiona
        el doble. Primera pista: lo que cuenta es la distancia entre lo que
        haces y aquello a lo que tu cuerpo está acostumbrado.
      </p>
      <p>
        El factor de riesgo más constante entre estudios no es el kilometraje ni
        el ritmo. Es haber tenido una lesión antes (van der Worp et al., 2015).
        Si ya tuviste problemas en el tendón de Aquiles, ese tendón merece más
        prudencia que cualquier ratio en un gráfico.
      </p>

      <h2>Carga frente a capacidad</h2>
      <p>
        La forma más útil de pensar las lesiones por sobreuso viene de Bertelsen
        y sus colegas (2017). Una lesión aparece cuando la carga sobre una
        estructura concreta, por ejemplo la tibia o la fascia plantar, supera lo
        que esa estructura tolera, de forma repetida, durante un tiempo. Se
        mueven dos cosas: la carga que aplicas y la capacidad del tejido, que
        sube con un entrenamiento gradual y baja con el mal sueño, una ingesta
        energética insuficiente, una enfermedad o una lesión previa.
      </p>
      <p>
        Ese marco deja al descubierto el punto débil de cualquier métrica de
        carga. Tu reloj mide tiempo, distancia y frecuencia cardiaca. A tu tibia
        la frecuencia cardiaca le da igual. Dos horas de trail con 1.200 m de
        desnivel negativo y dos horas en llano con la misma frecuencia cardiaca
        media dan un TRIMP parecido, pero tus cuádriceps y tus rodillas te dirán
        al día siguiente que no fue lo mismo. Las cifras de carga describen
        bastante bien lo que cuesta una sesión a tu sistema cardiovascular. Lo
        que cuesta a un tendón o un hueso concreto, solo de forma indirecta.
      </p>

      <h2>Lo que muestran los estudios en corredores</h2>
      <p>
        Hay menos estudios buenos en corredores de lo que cabría esperar, y la
        mayoría siguen a principiantes. Conviene conocer tres.
      </p>
      <p>
        En una cohorte danesa de 874 principiantes con reloj GPS, quienes
        aumentaron su distancia semanal más de un 30 % en dos semanas tuvieron
        más lesiones "relacionadas con la distancia" (dolor femoropatelar,
        síndrome de la cintilla iliotibial, periostitis tibial y algunas más)
        que quienes se quedaron por debajo del 10 % (Nielsen et al., 2014). La
        tasa global de lesiones no fue distinta entre grupos, e incluso ese
        resultado concreto quedó en el límite de la significación estadística.
        Los propios autores calificaron el estudio de exploratorio.
      </p>
      <p>
        En un ensayo aleatorizado neerlandés, 532 principiantes que preparaban
        una carrera de 6,7 km siguieron un plan estándar de 8 semanas o uno más
        gradual de 13 semanas basado en la regla del 10 %. Las tasas de lesión
        fueron casi idénticas: 20,8 % y 20,3 % (Buist et al., 2008).
      </p>
      <p>
        En el ensayo Run Clever, 447 corredores populares progresaron durante 16
        semanas el volumen o la intensidad de sus entrenamientos. Los
        investigadores esperaban que cada enfoque produjera su propio tipo de
        lesión. No encontraron diferencias (Ramskov et al., 2018).
      </p>
      <p>
        En conjunto: los saltos grandes y bruscos probablemente importan, sobre
        todo en principiantes. Por debajo de eso, afinar el ritmo de progresión
        no ha demostrado cambiar gran cosa. Para llevarlo a la práctica semana a
        semana, mira{' '}
        <Link href="/es/blog/injury-prevention-2-when-algorithms-predict-the-break">
          cuánto aumentar tu kilometraje
        </Link>
        .
      </p>

      <h2>El ratio de carga aguda:crónica y por qué se discute</h2>
      <p>
        Si has leído sobre lesiones y carga, te habrás topado con el ACWR
        (acute:chronic workload ratio): la carga de la última semana dividida
        entre la carga semanal media de las últimas cuatro. Nació de estudios
        con lanzadores rápidos de críquet (Hulin et al., 2014) y se popularizó
        con el artículo de Tim Gabbett sobre la "paradoja
        entrenamiento-prevención de lesiones", que describía una zona óptima
        entre 0,8 y 1,3 y una zona de peligro por encima de 1,5 (Gabbett, 2016).
        En pocos años esas cifras estaban en apps, cursos de entrenadores y
        muchos blogs, incluida una versión anterior de este artículo.
      </p>
      <p>Las críticas llegaron igual de rápido.</p>
      <ul>
        <li>
          En el cálculo habitual, la última semana está a la vez en el numerador
          y en el denominador. Lolli y sus colegas (2019) mostraron que ese
          acoplamiento matemático genera por sí solo una correlación, incluso
          con datos aleatorios.
        </li>
        <li>
          Impellizzeri y sus colegas (2020) señalaron que dividir por la carga
          crónica supone una relación entre ambas que nunca se comprobó, que el
          ratio cambia según uses medias móviles o exponenciales, y que los
          umbrales salieron de unas pocas muestras de deportes de equipo para
          luego aplicarse a todo el mundo. Un año después fueron más allá y
          recomendaron abandonar el ACWR y la teoría que lo sostiene
          (Impellizzeri et al., 2021).
        </li>
        <li>
          La mayoría de los estudios sobre el ACWR son observacionales, en
          deportes de equipo y con pocas lesiones. Una variable asociada a las
          lesiones en un grupo no predice qué persona se va a lesionar. Roald
          Bahr lo explicó para las pruebas de cribado en general, y aquí vale
          igual (Bahr, 2016).
        </li>
      </ul>
      <p>
        Mi lectura: la idea de fondo, no hacer de golpe mucho más de lo que
        venías haciendo, es antigua, sensata y coherente con los datos en
        corredores que vimos arriba. Los umbrales precisos no están demostrados.
        Trata el "1,5" como folclore y no como fisiología, y desconfía de
        cualquier cosa que convierta tu entrenamiento en un único porcentaje de
        riesgo de lesión.
      </p>

      <h2>Qué hacer con todo esto</h2>
      <p>
        Que la evidencia sea incierta no es motivo para ignorar la carga. Es
        motivo para usarla en lo que hace bien: avisar de que esta semana es muy
        distinta de las anteriores y obligarte a preguntar por qué.
      </p>
      <p>
        Fíjate en los cambios que las métricas de carga no ven. La primera
        sesión de series en pista en meses, una carrera con mucha bajada,
        zapatillas con menos drop, pasar de la montaña al asfalto: cada uno
        carga ciertos tejidos de una forma nueva aunque el total semanal apenas
        se mueva. Cambia una sola de esas cosas a la vez.
      </p>
      <p>
        Toma en serio lo que sientes. Una revisión sistemática encontró que lo
        que los deportistas dicen sentir (ánimo, fatiga, dolor muscular)
        respondía al entrenamiento de forma más fiable que marcadores objetivos
        habituales como la frecuencia cardiaca o los análisis de sangre (Saw et
        al., 2016). Apunta un dolor el día que aparece, con dónde y cuánto. Un
        dolor que cambia tu forma de correr, que empeora a la mañana siguiente o
        que se concentra en un punto preciso de un hueso es motivo para parar y
        consultar, diga lo que diga un gráfico.
      </p>
      <p>
        Y ten en cuenta la capacidad. Una semana durmiendo mal, una
        gastroenteritis o una temporada comiendo poco reducen lo que tus tejidos
        aguantan. El mismo plan no es la misma carga para el mismo corredor en
        todos los meses del año.
      </p>

      <h2>Qué hace OpenAthlete</h2>
      <p>
        OpenAthlete no predice lesiones ni te da una puntuación de riesgo.
        Muestra juntas las cifras que este artículo considera útiles. Cada
        sesión recibe una carga calculada con la frecuencia cardiaca (TRIMP),
        con la carga por RPE de sesión al lado. La forma física, la fatiga y la
        frescura se dibujan sobre tu historial y se proyectan sobre las sesiones
        planificadas, y cada semana muestra su carga frente a un rango
        construido con tus semanas recientes: una referencia, no un límite de
        seguridad. Después de una actividad, unas preguntas opcionales registran
        el esfuerzo percibido y cualquier dolor que menciones; ese dolor pasa a
        un registro de lesiones que ve tu entrenador. Los detalles y las
        fórmulas están en la{' '}
        <Link href="/es/features/training-load">
          página de carga de entrenamiento
        </Link>
        .
      </p>

      <h2>Fuentes</h2>
      <Sources />
    </div>
  );
}
