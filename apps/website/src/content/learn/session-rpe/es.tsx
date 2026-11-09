import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        El RPE de sesión es la medida de carga más sencilla que se sostiene en
        la investigación: puntúas lo dura que fue la sesión entera de 0 a 10, lo
        multiplicas por su duración en minutos y obtienes una carga en unidades
        arbitrarias. Carl Foster y sus colegas lo describieron a finales de los
        noventa y lo compararon con los métodos basados en el pulso en 2001. No
        necesita ningún sensor, sirve para cualquier deporte, también la fuerza
        y las sesiones técnicas, y recoge lo que el pulso no ve, como las
        piernas machacadas por una bajada o el coste mental de una carrera.
      </p>

      <h2>Cómo se calcula el RPE de sesión</h2>
      <Formula
        where={[
          'RPE: esfuerzo percibido de toda la sesión, en la escala CR-10 de 0 a 10',
          'minutos: duración total, calentamiento y vuelta a la calma incluidos',
          'resultado en unidades arbitrarias (UA)',
        ]}
      >
        carga de la sesión = RPE × minutos
      </Formula>
      <p>
        La escala es una versión de la CR-10 de Borg: 0 es reposo, 1 muy suave,
        3 moderado, 5 duro, 7 muy duro, 10 máximo. La pregunta es sobre la
        sesión completa, no sobre la serie más dura ni sobre cómo te encuentras
        ahora. El protocolo de Foster pide la puntuación unos 30 minutos después
        de terminar, cuando el último esfuerzo ya no domina la respuesta. En la
        práctica, puntuar al subir la actividad, el mismo día, funciona bien si
        eres constante.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>La semana de una corredora, puntuada sesión a sesión:</p>
      <ul>
        <li>martes, 60 min con 5 × 4' a umbral, RPE 7: 420 UA</li>
        <li>miércoles, 45 min de rodaje suave, RPE 3: 135 UA</li>
        <li>jueves, 50 min de rodaje medio, RPE 4: 200 UA</li>
        <li>sábado, tirada larga de 100 min, RPE 5: 500 UA</li>
        <li>domingo, 40 min de trote regenerativo, RPE 2: 80 UA</li>
      </ul>
      <p>
        La carga semanal es de 1.335 UA. La sesión de umbral supone el 15 % del
        tiempo de entrenamiento pero casi un tercio de la carga, lo que encaja
        con cómo describiría la semana casi cualquier corredor. Foster (1998)
        sacó además dos indicadores semanales de los valores diarios. La
        monotonía es la carga diaria media dividida por su desviación típica:
        aquí 191 / 184 ≈ 1,0, con dos días de descanso y un contraste real entre
        días duros y suaves. La tensión (<em>strain</em>) es carga semanal ×
        monotonía, unas 1.390. Entrenar cada día la misma dosis moderada dispara
        la monotonía, y en los datos de Foster las enfermedades tendían a llegar
        tras semanas de tensión alta.
      </p>

      <h2>Cómo usarlo en el entrenamiento</h2>
      <p>
        Puntúa todas las sesiones, también los rodajes suaves y el gimnasio. Los
        huecos dejan el total semanal sin sentido. Después mira tendencias: una
        semana un 30 % por encima de las anteriores es un salto, sea cual sea la
        cifra absoluta. Comparar el esfuerzo previsto con el puntuado suele
        decir más que la propia carga. Un rodaje suave puntuado con un 5 en vez
        de un 3, o una sesión de umbral que se sintió como un 9, avisa de
        fatiga, calor o enfermedad antes que cualquier curva.
      </p>
      <p>
        El RPE de sesión rinde más junto a una medida objetiva. Cuando el{' '}
        <Link href="/es/learn/trimp">TRIMP</Link> se mantiene y el RPE sube para
        los mismos entrenamientos, el cuerpo está pagando más por el mismo
        trabajo. Los entrenadores usan justo esa diferencia para ajustar los
        días siguientes.
      </p>
      <p>
        En OpenAthlete cada actividad tiene un RPE de 0 a 10, y un entrenador
        puede exigirlo para dar una sesión por validada. La vista de carga
        muestra el RPE de sesión (RPE × minutos) junto al TRIMP por pulso. Si
        las funciones de IA están activadas, unas pocas preguntas breves tras la
        actividad pueden rellenar el RPE a partir de la respuesta del atleta.
        Más detalles en la{' '}
        <Link href="/es/features/training-load">
          página de carga de entrenamiento
        </Link>
        .
      </p>

      <h2>Límites</h2>
      <p>
        Es subjetivo, y eso es a la vez su gracia y su debilidad. Las
        puntuaciones cambian con el ánimo, la motivación y la experiencia; los
        principiantes tienden a meterlo todo entre 4 y 7. Las unidades
        arbitrarias no se convierten en TRIMP ni en TSS, así que no se pueden
        mezclar en la misma curva sin reescalar. La duración pesa de forma
        lineal: tres horas de bici suave a RPE 3 (540 UA) superan una sesión de
        series de 40 minutos a RPE 8 (320 UA), lo cual es correcto para la carga
        total y engañoso para el estrés propio de la intensidad. Y una
        puntuación no dice por qué la sesión fue dura. La revisión de Haddad y
        sus colegas (2017) concluye que el RPE de sesión es válido en muchos
        deportes, con correlaciones con los métodos de pulso en general buenas
        pero lejos de perfectas. Úsalo como una segunda opinión siempre
        disponible, no como el único número.
      </p>
    </div>
  );
}
