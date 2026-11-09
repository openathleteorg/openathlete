import Link from 'next/link';

import { Sources } from './sources';

export function ContentEs() {
  return (
    <div>
      <p>
        Para un deportista de resistencia, la IA generativa no es ni un juguete
        ni una revolución. Es una herramienta de texto. Se le da muy bien
        convertir lenguaje impreciso en estructura y estructura en texto
        legible, y es poco fiable cada vez que tiene que acertar sobre tu cuerpo
        o sobre números que nadie le ha dado. Vista así, queda claro dónde
        ahorra tiempo y dónde puede hacerte daño.
      </p>

      <h2>Se le da bien: escribir una sesión</h2>
      <p>
        Meter un entrenamiento estructurado en la app del reloj es un rollo.
        Describirlo no. "20 minutos suaves, luego 6 × 3 minutos fuerte con 2
        minutos de trote, 10 minutos de vuelta a la calma" es justo el tipo de
        frase que un modelo de lenguaje maneja bien: la divide en pasos, calcula
        las repeticiones y, si conoce tus zonas, pone un objetivo a cada paso.
        El "fuerte" de 3 minutos se convierte en tu rango de ritmo de VO2max, y
        el "trote" en ritmo de recuperación.
      </p>
      <p>
        Antes de mandar la sesión al reloj conviene comprobar dos cosas: la
        duración total (a veces el modelo se salta o duplica un bloque) y la
        intensidad que eligió para las palabras vagas. "Fuerte" puede ser umbral
        para una persona y ritmo de 5 km para otra. Si se equivocó, díselo, o
        escribe "a umbral" la próxima vez.
      </p>

      <h2>Se le da bien: convertir sensaciones en datos</h2>
      <p>
        Después de una tirada larga, casi nadie rellena un formulario con cinco
        controles deslizantes. Lo que se dice es algo como "la primera hora
        bien, luego me pudo el calor, los últimos 5 km se me hicieron eternos y
        se me cargó el gemelo derecho". Un modelo de lenguaje puede convertir
        eso en una nota de esfuerzo de alrededor de 8 y una anotación: gemelo
        derecho, sobrecarga, al final del rodaje. Con las semanas, esas
        anotaciones se convierten en algo que un entrenador puede filtrar de
        verdad.
      </p>
      <p>
        Esto importa más de lo que parece. Una revisión sistemática de Saw y sus
        colegas (2016) encontró que las medidas subjetivas, las que indica el
        propio atleta, siguen la carga de entrenamiento mejor que la mayoría de
        los marcadores objetivos. El cuello de botella siempre ha sido conseguir
        que los atletas las registren. Reducir el esfuerzo a una frase o a una
        nota de voz ayuda.
      </p>

      <h2>Se le da bien: resumir y reescribir</h2>
      <p>
        Pega cuatro semanas de notas de entrenamiento y pide un resumen antes de
        hablar con tu entrenador: sacará los temas que se repiten (el Aquiles
        que se queja después de las cuestas, las sesiones del jueves que siempre
        se caen) más rápido que tú. Puede rehacer una semana alrededor de una
        limitación, por ejemplo un viaje de trabajo de martes a jueves con solo
        la cinta del hotel, y darte un borrador razonable. Puede traducir un
        plan que tu entrenador escribió en otro idioma. En todos los casos
        obtienes un borrador que revisar, no una orden que obedecer.
      </p>

      <h2>Útil con cuidado: explicar</h2>
      <p>
        Pregunta qué diferencia el trabajo de umbral de las series de VO2max, o
        por qué el ritmo de la tirada larga debe sentirse fácil, y normalmente
        recibirás una explicación decente. El riesgo es que añada con seguridad
        un detalle falso o cite un estudio que no existe. Los modelos de
        lenguaje producen texto fluido, no hechos comprobados, un problema que
        los investigadores llaman alucinación (Ji y sus colegas, 2023). Si una
        respuesta cita una fuente, búscala antes de repetirla.
      </p>

      <h2>Se le da mal: diagnosticar</h2>
      <p>
        Escribe "me duele la parte externa de la rodilla después de 20 km" y
        recibirás una respuesta bien ordenada sobre la cintilla iliotibial, con
        estiramientos y un plan de vuelta a correr. Puede que acierte. También
        puede ser algo completamente distinto, y el modelo no tiene forma de
        saberlo: no puede explorarte, verte correr ni apretar en la zona que
        duele. Una respuesta verosímil a una pregunta médica es peor que ninguna
        respuesta, porque retrasa la consulta que lo habría resuelto. Un dolor
        que persiste, que te hace cojear, que empeora al correr o que está
        presente en reposo es cosa de un fisioterapeuta o de un médico.
      </p>

      <h2>Se le da mal: planes completos desde cero</h2>
      <p>
        Düking y sus colegas (2024) pidieron a ChatGPT planes de carrera de seis
        semanas y los hicieron valorar por entrenadores expertos según 22
        criterios. Con poca información, el plan quedó por debajo de la nota
        media en 19 de ellos. Con información detallada mejoró mucho, pero los
        autores siguen desaconsejando seguir estos planes sin un entrenador
        experto. El fallo típico es fácil de imaginar: corres 30 km a la semana,
        pides un plan de maratón y la primera semana trae 50 km porque el modelo
        rellenó tu historial con el de un corredor medio.
      </p>

      <h2>Se le da mal: números que no le diste</h2>
      <p>
        Pregunta "¿cuánto corrí en septiembre?" sin darle tus datos y un modelo
        de chat puede inventarse una cifra verosímil sin más. Incluso con los
        datos pegados, sumar treinta filas no es lo suyo. Los totales, las
        medias y los cálculos de carga deben salir de un software que los
        calcule, y el modelo de lenguaje solo debería comentar el resultado.
      </p>

      <h2>Cómo obtener respuestas más útiles</h2>
      <p>
        Dale contexto: tus zonas o tus marcas recientes, tu volumen semanal de
        las últimas cuatro a seis semanas, la carrera y su fecha, los días que
        puedes entrenar y cualquier molestia actual. Pídele que diga qué está
        suponiendo antes de escribir nada. Después contrasta el resultado con
        unas reglas sencillas: sin grandes saltos de volumen semanal, no más
        sesiones duras de las que acostumbras (dos por semana son de sobra para
        la mayoría de los corredores populares) y días suaves que sean suaves de
        verdad.
      </p>

      <h2>En OpenAthlete</h2>
      <p>
        Las funciones de IA de OpenAthlete se quedan en el lado del texto de esa
        línea. La IA escribe una sesión estructurada a partir de una frase
        usando tus zonas, modifica una sesión con una instrucción breve, hace
        tres o cuatro preguntas después de una actividad y convierte las
        respuestas en una nota de esfuerzo y un registro de dolor para tu
        entrenador, y da una lectura breve de cada actividad. Ves cada sesión
        antes de que llegue a tu reloj. No diagnostica nada y solo funciona con
        tu consentimiento, con tu propia clave de API o con la cuota del plan
        Supporter. La <Link href="/es/features/ai-coach">página sobre IA</Link>{' '}
        tiene los detalles.
      </p>

      <h2>Fuentes</h2>
      <Sources />
    </div>
  );
}
