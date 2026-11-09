import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('es');

export function ContentEs() {
  return (
    <div>
      <p>
        TrainingPeaks lleva mucho tiempo siendo la plataforma por defecto de los
        entrenadores de resistencia, y con motivos: el Performance Management
        Chart, un vocabulario (TSS, CTL, TSB) que media comunidad ya habla, una
        tienda llena de planes y apps móviles maduras. Quien busca alternativas
        lo hace sobre todo por dinero. La cuenta Basic gratuita no envía los
        entrenamientos planificados al reloj, y los entrenadores pagan por cada
        atleta en Premium. Desde que Garmin compró TrainingPeaks el 22 de julio
        de 2026, algunos también quieren una plataforma que no pertenezca a un
        fabricante de relojes; esa cuestión tiene su propio artículo,
        <Link href="/es/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternativas a TrainingPeaks tras la compra de Garmin
        </Link>
        . Este se centra en precios y funciones.
      </p>
      <p>
        Este artículo compara cuatro alternativas por lo que cuestan y lo que
        hacen: intervals.icu, Nolio, Final Surge y OpenAthlete, que es la
        nuestra. Los precios salen de la página de precios de cada empresa,
        consultada el 3 de noviembre de 2026. Los precios en dólares
        estadounidenses son sin impuestos, como los muestran las empresas.
      </p>

      <h2>Lo que cuesta TrainingPeaks</h2>
      <p>
        Para un atleta, Basic es gratis y Premium cuesta {q('tpMonth')} al mes o{' '}
        {q('tpYear')} al año. Enviar entrenamientos estructurados al reloj es
        una función Premium, y es el motivo principal por el que los corredores
        que se entrenan solos pagan.
      </p>
      <p>
        Para un entrenador, el plan de entrada cuesta {q('tpCoach')} al mes, con
        cuatro atletas Basic y uno Premium. Cada atleta Premium adicional suma{' '}
        {q('tpPerMax')} al mes, que baja hasta {q('tpPerMin')} con el volumen, y
        hay una cuota de alta de {q('tpSetup')}, que se anula con un código
        promocional. En la práctica, un entrenador cuyos atletas necesitan todos
        los entrenamientos en el reloj paga unos{' '}
        {coachYear('trainingpeaks', 10)} al año por diez atletas y{' '}
        {coachYear('trainingpeaks', 30)} por treinta, salvo que los atletas
        paguen su propio Premium.
      </p>

      <h2>Qué comparar</h2>
      <p>
        Las listas de funciones se parecen todas. Cuatro preguntas separan mejor
        estas plataformas:
      </p>
      <ul>
        <li>
          ¿Los entrenamientos planificados llegan al reloj en el plan gratuito,
          y para qué marcas?
        </li>
        <li>
          ¿Cómo se calcula la carga de entrenamiento y se puede ver la fórmula?
          Ninguna alternativa usa TSS, así que los números no coincidirán con
          los que conoces.
        </li>
        <li>¿Cómo crece el precio del entrenador con el número de atletas?</li>
        <li>
          ¿Puedes sacar tus datos, y qué pasa si la empresa cierra? Today's
          Plan, una plataforma de coaching de pago, cerró en marzo de 2024 y sus
          usuarios tuvieron que mudar a todos sus atletas.
        </li>
      </ul>

      <h2>intervals.icu</h2>
      <p>
        intervals.icu es gratis, con un plan Supporter opcional de{' '}
        {q('icuMonth')} al mes ({q('icuYear')} al año). Es la opción más fuerte
        de esta lista para el análisis: curvas de potencia, gráficos
        personalizados y la lista de integraciones más amplia, con Wahoo y Zwift
        para los entrenamientos, que OpenAthlete no cubre. Entrenar a otros es
        gratis; los equipos y organizaciones necesitan Supporter. No tiene apps
        móviles oficiales (existen de terceros) y el código es cerrado. Si te
        entrenas solo y te gustan los datos, empieza por aquí.
      </p>

      <h2>Nolio</h2>
      <p>
        Nolio, una empresa de Grenoble socia de la federación francesa de
        atletismo, tiene un plan gratuito para atletas generoso, con
        sincronización con el reloj y entrenamientos estructurados. Premium
        cuesta {q('nolioPremium')} al mes. Los planes de entrenador cuestan{' '}
        {q('nStarter')} al mes para 3 atletas, {q('nClassic')} para 25 y{' '}
        {q('nPro')} para 30 atletas y dos entrenadores. Tiene planes para
        clubes, apps nativas y más de 200 vídeos de ejercicios. No anuncia IA
        integrada y, como las demás, su código es cerrado. Nuestra{' '}
        <Link href="/es/blog/nolio-vs-trainingpeaks-vs-openathlete-2025-comparison">
          comparativa a tres con TrainingPeaks
        </Link>{' '}
        entra en detalle en el lado del entrenador.
      </p>

      <h2>Final Surge</h2>
      <p>
        Final Surge es gratis para los atletas. Los entrenadores pagan una
        tarifa plana de {q('fsStarter')} al mes de 1 a 5 atletas o {q('fsPro')}{' '}
        hasta 100, sin cuota por atleta. Los entrenamientos estructurados van a
        Garmin y COROS. Está pensado para entrenadores, escuelas y clubes de
        atletismo de Estados Unidos, con descuentos para escuelas y apps
        nativas. Precios simples y honestos; menos profundidad en el análisis.
      </p>

      <h2>OpenAthlete</h2>
      <p>
        Todas las funciones son gratuitas en nuestros servidores: calendario,
        editor de entrenamientos, envío de entrenamientos a Garmin, Suunto y
        COROS, carga de entrenamiento y coaching de hasta cinco atletas. El plan
        Supporter opcional ({q('oaMonth')} al mes o {q('oaYear')} al año) añade
        IA con nuestras claves y atletas ilimitados, y nada más. El código es
        AGPL-3.0, así que también puedes instalarlo en tu propio servidor,
        gratis y sin límites.
      </p>
      <p>
        La carga de entrenamiento es el TRIMP de Banister a partir de la
        frecuencia cardíaca, con el RPE de sesión al lado, y la forma, la fatiga
        y el estado de forma se proyectan sobre las sesiones planificadas. Las
        funciones de IA usan tu propia clave (OpenAI, Anthropic, Mistral y
        otras) en cualquier plan: una sesión estructurada a partir de una frase,
        una lectura breve de cada actividad y unas preguntas después de cada
        salida que registran el esfuerzo y el dolor para el entrenador. Claude o
        ChatGPT también pueden planificar en el calendario a través del servidor
        MCP.
      </p>
      <p>
        Lo que todavía no hace: las apps de iOS y Android están en pruebas
        (mientras tanto, la app web se instala en el móvil), no hay tienda de
        planes, ni app de entrenamiento en interior, ni cuenta de club, y el
        análisis de potencia es menos profundo que en intervals.icu. Los
        entrenamientos no pueden ir a relojes Polar, porque su API es de solo
        lectura. Las unidades son solo métricas.
      </p>

      <h2>Los números lado a lado</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Atleta que se entrena solo, entrenamientos en el reloj</th>
            <th>Entrenador con 10 atletas, al año</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TrainingPeaks</td>
            <td>Premium, {q('tpYear')}/año</td>
            <td>{coachYear('trainingpeaks', 10)} (atletas en Premium)</td>
          </tr>
          <tr>
            <td>intervals.icu</td>
            <td>Gratis (Supporter {q('icuYear')}/año opcional)</td>
            <td>Gratis; los equipos necesitan Supporter</td>
          </tr>
          <tr>
            <td>Nolio</td>
            <td>Gratis</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
          </tr>
          <tr>
            <td>Final Surge</td>
            <td>Gratis</td>
            <td>{coachYear('final-surge', 10)} (Pro)</td>
          </tr>
          <tr>
            <td>OpenAthlete</td>
            <td>Gratis</td>
            <td>{q('oaYear')} (Supporter)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Precios de lista consultados el 3 de noviembre de 2026. Las empresas los
        cambian: revisa sus páginas antes de decidir.
      </p>

      <h2>Cuál te conviene</h2>
      <p>
        Quédate en TrainingPeaks si vendes planes en su tienda, si tus atletas
        usan TrainingPeaks Virtual o si toda tu forma de entrenar se basa en el
        TSS y no quieres reaprender los números. Elige intervals.icu para el
        análisis gratuito más profundo, sobre todo con potenciómetro. Elige
        Nolio si entrenas en un club francés y quieres precios para asociaciones
        y apps nativas hoy mismo. Elige Final Surge para un equipo escolar o un
        club de Estados Unidos con tarifa plana. Elige OpenAthlete si quieres
        los entrenamientos en tu Garmin, Suunto o COROS sin pagar, un precio
        fijo como entrenador, IA con tu propia clave o un código que puedes
        alojar tú mismo.
      </p>

      <h2>Llevarte tu historial</h2>
      <p>
        Tus actividades también están en la cuenta de tu reloj, que suele ser la
        fuente más fácil. En OpenAthlete, Strava y COROS traen todo tu
        historial, Garmin y Suunto los últimos 30 días, y Polar solo lo que
        registres después de conectar; los archivos FIT, GPX y TCX antiguos se
        pueden subir en bloque. Los entrenamientos planificados y los planes no
        pasan de una plataforma a otra, así que vuelve a crear tus sesiones
        habituales como plantillas. No hemos comprobado nosotros la exportación
        masiva de TrainingPeaks, así que consulta su centro de ayuda antes de
        contar con ella.
      </p>
      <p>
        Si quieres probar OpenAthlete, la{' '}
        <Link href="/es/pricing">página de precios</Link> detalla qué es gratis
        y qué añade Supporter.
      </p>
    </div>
  );
}
