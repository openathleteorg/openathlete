import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('es');

export function ContentEs() {
  return (
    <div>
      <p>
        Si entrenas a atletas de resistencia en Francia, o en cualquier sitio
        donde los clubes franceses marcan la pauta, la elección suele quedar
        entre TrainingPeaks y Nolio. Este artículo añade OpenAthlete, que es
        nuestro, y compara los tres desde la silla del entrenador: lo que pagas
        cuando crece el grupo, lo que necesitan tus atletas y lo que cada uno
        hace mejor que los otros. Los precios salen de la página de precios de
        cada empresa, consultada el 3 de noviembre de 2026. Los precios en
        dólares son sin impuestos, como los muestra TrainingPeaks.
      </p>

      <h2>Tres formas de cobrar</h2>
      <p>
        <strong>TrainingPeaks</strong> cobra por atleta. El plan de entrenador
        empieza en {q('tpCoach')} al mes con cuatro atletas Basic y uno Premium;
        cada atleta Premium adicional cuesta {q('tpPerMax')} al mes, que baja
        hasta {q('tpPerMin')} con el volumen. Hay una cuota de alta de{' '}
        {q('tpSetup')}, que se anula con un código promocional. Los atletas
        pueden quedarse en Basic ({q('tpCoachUnlimited')} al mes cubren a todos
        los que quieras), pero entonces sus entrenamientos planificados no
        llegan al reloj, así que la mayoría de entrenadores pagan el Premium o
        piden a los atletas que paguen {q('tpYear')} al año por su cuenta.
      </p>
      <p>
        <strong>Nolio</strong> cobra por tramos. Starter cuesta {q('nStarter')}{' '}
        al mes para 3 atletas, Classic {q('nClassic')} para 25 y Pro {q('nPro')}{' '}
        para 30 atletas y dos entrenadores; un entrenador adicional cuesta{' '}
        {q('nExtraCoach')} al mes. Los atletas no pagan por la sincronización
        con el reloj: el plan gratuito la incluye. Los clubes tienen sus propios
        planes, Club Starter a {q('nClubStarter')} y Club Classic a{' '}
        {q('nClubClassic')} al mes.
      </p>
      <p>
        <strong>OpenAthlete</strong> es gratis hasta cinco atletas. A partir de
        ahí, el plan Supporter a {q('oaYear')} al año quita el límite, sea cual
        sea el grupo, y además añade IA con nuestras claves. La sincronización
        con el reloj es gratis para los atletas. Instalarlo en tu propio
        servidor es gratis y sin límites. Los clubes tienen un espacio de club
        gratuito, y los atletas a los que un entrenador llega a través de un
        club no cuentan entre los cinco.
      </p>

      <table>
        <thead>
          <tr>
            <th>Atletas</th>
            <th>TrainingPeaks (atletas en Premium)</th>
            <th>Nolio</th>
            <th>OpenAthlete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3</td>
            <td>{coachYear('trainingpeaks', 3)}</td>
            <td>{coachYear('nolio', 3)} (Starter)</td>
            <td>Gratis</td>
          </tr>
          <tr>
            <td>10</td>
            <td>{coachYear('trainingpeaks', 10)}</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>25</td>
            <td>{coachYear('trainingpeaks', 25)}</td>
            <td>{coachYear('nolio', 25)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>30</td>
            <td>{coachYear('trainingpeaks', 30)}</td>
            <td>{coachYear('nolio', 30)} (Pro)</td>
            <td>{q('oaYear')}</td>
          </tr>
        </tbody>
      </table>
      <p>
        Coste anual para un entrenador, facturación mensual, precios de lista
        consultados el 3 de noviembre de 2026. La columna de TrainingPeaks
        supone que el entrenador paga el Premium de cada atleta; si tus atletas
        ya lo pagan, tu factura es mucho menor.
      </p>

      <h2>Lo que cada uno hace mejor</h2>
      <p>
        <strong>TrainingPeaks</strong> es el idioma común. Muchos atletas llegan
        con cuenta e historial allí, muchos entrenadores piensan en TSS y en el
        Performance Management Chart, y si vendes planes, su tienda los pone
        delante de los compradores. Las apps móviles son maduras y TrainingPeaks
        Virtual cubre el rodillo. Desde el 22 de julio de 2026 pertenece a
        Garmin; lo que eso puede cambiar lo tratamos en
        <Link href="/es/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternativas a TrainingPeaks tras la compra de Garmin
        </Link>
        .
      </p>
      <p>
        <strong>Nolio</strong> está hecho para los clubes franceses. Es una
        empresa de Grenoble, socia de la federación francesa de atletismo, con
        precios para asociaciones, varios entrenadores en una misma cuenta, apps
        nativas de iOS y Android y una biblioteca de más de 200 vídeos de
        ejercicios de fuerza. Si tu club quiere una sola cuenta para tres
        entrenadores y sesenta socios, con apps nativas en cada móvil, Nolio
        tiene un plan justo para eso.
      </p>
      <p>
        <strong>OpenAthlete</strong> mantiene un precio fijo y añade algunas
        cosas que los otros dos no anuncian. La IA funciona con tu propia clave
        (o con la cuota de Supporter): escribes "10 km suave y luego 6 × 400 m a
        ritmo de 5K" y obtienes una sesión estructurada con las zonas del
        atleta; después de cada actividad, el atleta recibe una lectura breve y
        unas preguntas, y el esfuerzo y cualquier dolor que indique acaban en un
        registro de lesiones y en tu panel. A través del servidor MCP, Claude o
        ChatGPT pueden leer el entrenamiento de un atleta y planificar hasta 60
        sesiones en su calendario. Los clubes tienen un espacio de club gratuito
        sin límite de atletas: grupos con sus entrenadores, una biblioteca
        compartida, sesiones semanales del club a las que los atletas responden,
        y una sesión, un día o una semana copiados a todo un grupo, adaptados a
        las zonas de cada uno. El código es AGPL-3.0, así que un club también
        puede tener su propia instancia, con inicio de sesión único y registro
        solo por invitación.
      </p>

      <h2>Lo que le falta a cada uno</h2>
      <p>
        TrainingPeaks no incluye IA en sus páginas de precios, y la cuota por
        atleta crece rápido si pagas el Premium. Los planes de entrenador de
        Nolio son de pago desde el primer atleta y no anuncia IA. Ninguno de los
        dos es de código abierto.
      </p>
      <p>
        Las carencias de OpenAthlete también son reales. Las apps de iOS y
        Android están en pruebas, así que por ahora los atletas usan la app web
        instalable. El espacio de club no tiene facturación al club: las cuotas
        se gestionan fuera de OpenAthlete. No hay tienda, ni biblioteca de
        vídeos, ni acuerdo con ninguna federación. Los entrenamientos van a
        relojes Garmin, Suunto y COROS, no a Polar. La carga es el TRIMP de
        Banister a partir de la frecuencia cardíaca, con el RPE de sesión al
        lado, así que los números no coincidirán con el TSS si tus atletas
        vienen de TrainingPeaks.
      </p>

      <h2>Tres entrenadores, tres respuestas</h2>
      <p>
        Un entrenador por cuenta propia con doce corredores que usan varios
        Forerunner, un COROS Pace y un Suunto: aquí TrainingPeaks es lo más
        caro, salvo que los atletas paguen su Premium. Nolio Classic y
        OpenAthlete cumplen; la diferencia está entre {coachYear('nolio', 12)} y{' '}
        {q('oaYear')} al año, IA por un lado y apps nativas por el otro.
      </p>
      <p>
        Un club con tres entrenadores y sesenta socios: si quieren una app
        nativa en el móvil ya, los planes para clubes de Nolio encajan mejor. Si
        les basta la app web instalable, el espacio de club de OpenAthlete lo
        resuelve gratis, con grupos, una biblioteca compartida y la pista del
        martes ya en el calendario de cada socio. Una instancia propia es una
        opción si alguien del club se anima a mantener un servidor.
      </p>
      <p>
        Un entrenador que vende planes a atletas con los que nunca habla:
        quédate en TrainingPeaks. Ni Nolio ni OpenAthlete tienen tienda.
      </p>
      <p>
        Más detalle, con fuentes para cada dato, en las páginas{' '}
        <Link href="/es/compare/nolio">OpenAthlete vs Nolio</Link> y{' '}
        <Link href="/es/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , y lo que OpenAthlete ofrece a los entrenadores en la{' '}
        <Link href="/es/coaches">página para entrenadores</Link>.
      </p>
    </div>
  );
}
