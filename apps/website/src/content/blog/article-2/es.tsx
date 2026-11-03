import Link from 'next/link';

import { Sources } from './sources';

export function ContentEs() {
  return (
    <div>
      <p>
        En el software de entrenamiento, "IA" se refiere a dos cosas muy
        distintas, y el marketing suele mezclarlas. Por un lado, modelos
        estadísticos que trabajan con números: frecuencia cardiaca, ritmo,
        potencia, variabilidad de la frecuencia cardiaca, sueño. Estiman algo o
        intentan predecirlo. Por otro, los modelos de lenguaje, la familia de
        ChatGPT, Claude o Mistral, que leen y escriben texto. La evidencia
        científica es muy diferente para cada uno, así que conviene verlos por
        separado.
      </p>

      <h2>Mucho de lo que se vende como IA es aritmética</h2>
      <p>
        Las curvas de forma, fatiga y estado (CTL, ATL, TSB) son medias
        ponderadas exponencialmente de la carga diaria, herederas del modelo
        impulso-respuesta de Banister de los años setenta. El TRIMP convierte la
        duración y la frecuencia cardiaca en una puntuación de carga. El RPE de
        sesión es aún más sencillo: el método de Foster multiplica la valoración
        del esfuerzo del atleta, en una escala de 0 a 10, por la duración en
        minutos, así que un rodaje de 60 minutos a RPE 6 son 360 unidades. Nada
        de esto es aprendizaje automático, y es una ventaja: puedes comprobar la
        fórmula, sabes qué deja fuera y, cuando un número parece raro, puedes
        averiguar por qué.
      </p>
      <p>
        La declaración de consenso sobre el control de la carga que publicaron
        Bourdon y sus colegas en 2017 recomienda justo este tipo de
        herramientas: medir lo que se hizo (carga externa, como distancia y
        ritmo) y lo que le costó al atleta (carga interna, como frecuencia
        cardiaca y RPE), y mirar ambas juntas a lo largo del tiempo. Sigue
        siendo la base de una buena práctica, y no necesita ninguna red
        neuronal.
      </p>

      <h2>La predicción es más débil de lo que dicen los anuncios</h2>
      <p>
        La predicción de lesiones es donde las promesas van más por delante de
        los datos. La revisión de Roald Bahr publicada en 2016 en el British
        Journal of Sports Medicine explica por qué las pruebas de cribado no
        pueden predecir la lesión de una persona concreta: incluso un factor de
        riesgo fuerte a nivel de grupo deja un solapamiento enorme entre los
        atletas que se lesionan y los que no. El aprendizaje automático todavía
        no ha cambiado mucho ese panorama. Una revisión sistemática de Van
        Eetvelde y sus colegas (2021) encontró once estudios sobre predicción de
        lesiones deportivas con aprendizaje automático, con resultados que iban
        desde apenas mejor que lanzar una moneda (AUC de 0,52) hasta buenos
        (0,87), y pidió más trabajo para interpretar los modelos.
      </p>
      <p>
        El ratio de carga aguda:crónica es un buen ejemplo de advertencia.
        Durante unos años se extendió por apps y cursos de entrenadores la idea
        de que un ratio entre 0,8 y 1,3 era una "zona óptima" segura.
        Impellizzeri y sus colegas mostraron en 2020 que el ratio tiene
        problemas estadísticos de base y que la evidencia de esa zona óptima no
        se sostiene. Subir mucho la carga de una semana a otra sigue siendo mala
        idea. Una cifra de riesgo precisa basada en ese ratio, no.
      </p>
      <p>
        Así que, cuando una app te muestre "riesgo de lesión: 23 %", pregunta
        cómo se validó ese número, con quién y cuántas veces se equivocó. Si no
        hay respuesta, tómalo como decoración.
      </p>

      <h2>Donde sí ayudan los modelos numéricos: la VFC, con una referencia</h2>
      <p>
        La variabilidad de la frecuencia cardiaca es la señal diaria más útil
        que la mayoría de los atletas puede medir en casa. En un estudio pequeño
        de cuatro semanas, Kiviniemi y sus colegas (2007) dejaron que la VFC de
        la mañana decidiera la sesión del día: intensa si la VFC se mantenía o
        subía, suave o descanso si bajaba por debajo del rango reciente del
        propio atleta. Ese grupo mejoró más su velocidad máxima de carrera que
        un grupo con un plan fijo. Plews y sus colegas (2013) añadieron un
        detalle práctico importante: una sola medición matinal tiene mucho
        ruido, y las medias móviles de una semana aproximadamente, comparadas
        con la referencia del propio atleta, dicen mucho más.
      </p>
      <p>
        Fíjate en lo que es: una referencia personal y una regla sencilla.
        Funciona porque es individual, no porque el modelo sea listo. Y exige
        medir con disciplina, cada mañana en las mismas condiciones, que es
        donde casi todo el mundo falla.
      </p>

      <h2>Las sensaciones siguen ganando a la mayoría de los sensores</h2>
      <p>
        La revisión sistemática de Saw, Main y Gastin (2016) comparó medidas
        subjetivas (estado de ánimo, estrés percibido, fatiga) con medidas
        objetivas (marcadores sanguíneos, frecuencia cardiaca en reposo,
        respuesta cardiaca al ejercicio). Las subjetivas reflejaban los cambios
        de carga con más sensibilidad y coherencia. Dicho de forma sencilla:
        preguntar al atleta cómo se siente, y apuntarlo siempre, es una de las
        mejores herramientas de control que existen.
      </p>
      <p>
        Aquí es donde los modelos de lenguaje resultan útiles de verdad, sin
        mucho brillo. Un atleta escribirá o dirá sin problema "piernas pesadas
        desde el km 8, el Aquiles izquierdo algo molesto al bajar escaleras
        después", pero rara vez rellenará cinco controles deslizantes. Un modelo
        de lenguaje puede convertir esa frase en una nota de esfuerzo y un
        registro de dolor (Aquiles izquierdo, leve, después del rodaje) que el
        entrenador puede filtrar y seguir. Es introducción de datos
        estructurados, hecha por algo que entiende frases poco precisas.
      </p>

      <h2>Cuando un modelo de lenguaje escribe un plan</h2>
      <p>
        Düking y sus colegas (2024) pidieron a ChatGPT planes de carrera de seis
        semanas con tres niveles de detalle en la petición y los hicieron
        evaluar por entrenadores expertos según 22 criterios de calidad. Con la
        información mínima, el plan quedó por debajo de la nota media en 19 de
        los 22 criterios. Con información detallada (historial, objetivos,
        limitaciones), solo en uno. Aun así, los autores desaconsejan usar estos
        planes sin la opinión de un entrenador experto. Un estudio de Washif y
        sus colegas (2024) sobre programas de fuerza llegó a una conclusión
        parecida: borradores verosímiles que alguien que conoce el oficio tiene
        que pulir.
      </p>
      <p>
        Los modelos de lenguaje también afirman cosas falsas con total soltura,
        un fallo conocido como alucinación (Ji y sus colegas lo revisan en
        2023). En el entrenamiento, eso se traduce en un volumen semanal que no
        cuadra, un "estudio" que no existe o un rodaje de recuperación puesto
        sin avisar a ritmo de umbral. Son errores fáciles de pasar por alto
        precisamente porque el resto del texto se lee bien.
      </p>

      <h2>Qué significa en la práctica</h2>
      <p>
        Usa los modelos de lenguaje para el trabajo de texto: escribir una
        sesión estructurada a partir de una descripción, resumir un mes de
        notas, recoger sensaciones después de entrenar, explicar un concepto.
        Deja las decisiones de carga e intensidad en números que puedas
        comprobar, con un entrenador o tu propia experiencia como último filtro.
        Desconfía de cualquier índice de riesgo cuya validación no puedas ver. Y
        si quieres un solo hábito que la investigación respalda claramente,
        apunta cómo te sentiste en cada sesión.
      </p>

      <h2>Cómo usa OpenAthlete la IA</h2>
      <p>
        En OpenAthlete, la carga de entrenamiento es el TRIMP a partir de la
        frecuencia cardiaca, con el RPE de sesión al lado: fórmulas, no una caja
        negra. La IA es opcional y se ocupa del trabajo de texto descrito
        arriba: una sesión estructurada a partir de una frase, tres o cuatro
        preguntas después de una actividad que se convierten en una nota de
        esfuerzo y un registro de dolor para el entrenador, y una lectura breve
        de cada actividad. No hay predicción de lesiones. La{' '}
        <Link href="/es/features/ai-coach">página sobre IA</Link> detalla lo que
        hace y qué proveedores puedes usar.
      </p>

      <h2>Fuentes</h2>
      <Sources />
    </div>
  );
}
