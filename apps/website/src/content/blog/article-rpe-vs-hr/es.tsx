import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Dos rodajes, mismo circuito, mismo ritmo de 5:00/km, misma frecuencia
        cardíaca media de 148 ppm. El martes lo habrías puntuado con un 3 sobre
        10. El jueves, tras dos noches cortas y un día largo de trabajo, con un
        6. Tu reloj archiva las dos sesiones como idénticas. Tu cuerpo no.
      </p>

      <p>
        La frecuencia cardíaca y el esfuerzo percibido (RPE, por{' '}
        <em>rating of perceived exertion</em>) miden la carga interna: lo que te
        ha costado el trabajo, frente a la carga externa, que es el trabajo en
        sí (distancia, ritmo, potencia). La distinción viene de Impellizzeri,
        Marcora y Coutts, que sostienen que la carga interna es la que provoca
        la adaptación y que conviene registrar ambas a la vez (
        <a href="https://doi.org/10.1123/ijspp.2018-0935">
          Int J Sports Physiol Perform, 2019
        </a>
        ). Frecuencia cardíaca y RPE miran la carga interna desde ángulos
        distintos, y discrepan con la frecuencia suficiente como para que
        merezca la pena leer esa discrepancia.
      </p>

      <h2>Lo que de verdad te dice la frecuencia cardíaca</h2>
      <p>
        La frecuencia cardíaca es la respuesta cardiovascular al trabajo. En
        esfuerzos estables de varios minutos sigue bien la intensidad, y por eso
        las zonas de pulso y las cargas tipo TRIMP funcionan para la mayor parte
        del entrenamiento de resistencia. Pero no responde solo a la intensidad.
      </p>
      <p>
        Va con retraso. Al empezar una serie de 4 minutos necesita uno o dos
        minutos para alcanzar el esfuerzo, así que subestima las repeticiones
        cortas y apenas dice nada útil de un sprint en cuesta de 30 segundos.
        Deriva. En una tirada larga a ritmo constante sube poco a poco a medida
        que cae el volumen sistólico, más con calor o deshidratación; Coyle y
        González-Alonso revisan los mecanismos (
        <a href="https://pubmed.ncbi.nlm.nih.gov/11337829/">
          Exerc Sport Sci Rev, 2001
        </a>
        ). Se mueve con la cafeína, la enfermedad, la altitud y el estrés. Y el
        número de tu muñeca puede ser simplemente erróneo: comparados con un
        ECG, los sensores ópticos de muñeca fueron menos precisos que una banda
        de pecho, con una precisión que variaba según el dispositivo y la
        actividad (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ).
      </p>

      <h2>Lo que aporta el RPE</h2>
      <p>
        El RPE es el resumen que hace tu cerebro de todo a la vez: respiración,
        piernas, calor, motivación, la atención que exigió la sesión. El método
        de RPE de sesión de Carl Foster lo convierte en una cifra de carga:
        puntúa la sesión completa en la escala de Borg de 0 a 10 unos 30 minutos
        después de terminar y multiplica por la duración en minutos (Foster et
        al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/11708692/">
          J Strength Cond Res, 2001
        </a>
        ). Un rodaje de 50 minutos con un 3 da 150 unidades arbitrarias; una
        sesión de umbral de 70 minutos con 5 × 4' puntuada con un 7 da 490.
      </p>
      <p>
        De media, los dos métodos coinciden. En futbolistas jóvenes, la carga
        por RPE de sesión se correlacionó con tres métodos basados en la
        frecuencia cardíaca, con correlaciones individuales de entre 0,50 y 0,85
        aproximadamente (Impellizzeri et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/15179175/">
          Med Sci Sports Exerc, 2004
        </a>
        ). En esquiadores de fondo júnior, la frecuencia cardíaca y el RPE de
        sesión dieron casi la misma distribución de intensidades, con unas tres
        cuartas partes de las sesiones en la zona suave (Seiler y Kjerland,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/16430681/">
          Scand J Med Sci Sports, 2006
        </a>
        ). Correlaciones de ese orden también significan que a menudo se separan
        en una sesión concreta. Ahí es donde resultan útiles.
      </p>

      <h2>Cómo leer la discrepancia</h2>
      <p>
        <strong>
          Frecuencia cardíaca normal, RPE más alto de lo habitual.
        </strong>{' '}
        El rodaje del jueves. El sistema cardiovascular hizo el mismo trabajo,
        pero la sesión costó más. Dormir poco, la fatiga mental, la fatiga
        acumulada y el inicio de una enfermedad suben el RPE antes de notarse en
        el pulso. Una sesión así es ruido. Tres rodajes así en una semana son
        motivo para suavizar o mover la próxima sesión dura.
      </p>
      <p>
        <strong>
          Frecuencia cardíaca más alta de lo habitual, RPE normal.
        </strong>{' '}
        Normalmente es el entorno o el sensor: calor, humedad, un café doble,
        una correa floja. Revisa las condiciones antes de sacar conclusiones
        sobre tu forma. Si persiste en días frescos, y sobre todo con el pulso
        en reposo elevado, piensa en una enfermedad.
      </p>
      <p>
        <strong>
          Frecuencia cardíaca más baja de lo habitual, RPE más alto.
        </strong>{' '}
        El patrón que hay que tomarse en serio, sobre todo si no consigues subir
        pulsaciones en las series. Es una de las señales descritas en
        deportistas con sobrecarga en el consenso ECSS/ACSM sobre
        sobreentrenamiento (Meeusen et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/23247672/">
          Med Sci Sports Exerc, 2013
        </a>
        ), aunque ese mismo documento deja claro que ningún marcador por sí solo
        permite diagnosticarlo. Descansa unos días y comprueba si ambos valores
        vuelven a la normalidad.
      </p>
      <p>
        <strong>Ambos más bajos al mismo ritmo.</strong> Estás mejorando.
        Disfrútalo y resiste la tentación de acelerar todos tus rodajes.
      </p>

      <h2>Cuál usar y cuándo</h2>
      <p>
        En rodajes y tiradas largas, un techo de pulso es la forma más sencilla
        de que los días suaves sean suaves, siempre que aceptes la deriva de la
        última hora. En series de 5 minutos o menos, usa el ritmo o la potencia
        como objetivo y el RPE como control: el pulso llega demasiado tarde para
        guiar una repetición. En carrera y en las jornadas largas de montaña, el
        RPE es la única medida que tiene en cuenta el calor, el desnivel y los
        40 km que ya llevas en las piernas.
      </p>
      <p>
        Para la carga, quédate con las dos. El TRIMP por frecuencia cardíaca da
        un número que no depende de tu estado de ánimo; el RPE de sesión detecta
        las sesiones que el resto de tu vida hizo más duras. Cuando las dos
        tendencias se separan durante una semana o más, algo ha cambiado fuera
        del entrenamiento.
      </p>

      <h2>Esta semana</h2>
      <p>
        Después de cada sesión, espera media hora, pregúntate «¿qué tan dura fue
        la sesión en conjunto?» y apunta un número del 0 al 10. Anota al lado la
        frecuencia cardíaca media. Elige un circuito suave que corras a menudo y
        compara las parejas al final de la semana. No necesitas más para empezar
        a ver qué días el pulso contaba toda la historia y qué días no.
      </p>

      <p>
        OpenAthlete guarda ambos en cada actividad: el TRIMP calculado con los
        datos de pulso de tu reloj y, en cuanto introduces un RPE, la carga por
        RPE de sesión a su lado. Si activas las funciones de IA, unas pocas
        preguntas cortas tras cada actividad rellenan el RPE y anotan cualquier
        dolor, para ti o para tu entrenador. Es gratis; en la página de{' '}
        <Link href="/es/features/training-load">carga de entrenamiento</Link> se
        explica cómo se combinan los datos, y con la{' '}
        <Link href="/es/tools/heart-rate-zones">
          calculadora de zonas de frecuencia cardíaca
        </Link>{' '}
        puedes ajustar tus zonas.
      </p>
    </div>
  );
}
