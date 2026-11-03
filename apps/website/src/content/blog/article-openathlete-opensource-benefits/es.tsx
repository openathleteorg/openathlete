import Link from 'next/link';

export function ContentEs() {
  return (
    <div>
      <p>
        Unos cuantos años de historial de entrenamiento son mucho material: cada
        sesión de series, cada curva de frecuencia cardiaca, cada nota del tipo
        "dormí cinco horas, piernas muertas". Para un entrenador es todavía más:
        años de entrenamientos estructurados, plantillas y temporadas
        construidas para cada atleta. Dónde vive ese material, y quién decide
        qué pasa con él, parece una cuestión abstracta hasta el día en que una
        plataforma cierra o cambia de dueño.
      </p>

      <h2>Las plataformas cierran y cambian de dueño</h2>
      <p>
        Today's Plan, una plataforma de entrenamiento y seguimiento, cerró en
        marzo de 2024. Sus usuarios tuvieron que exportar lo que pudieron y
        empezar de nuevo en otro sitio. En julio de 2026 Garmin{' '}
        <a href="https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/">
          compró TrainingPeaks y TrainHeroic
        </a>
        . TrainingPeaks sigue funcionando, y nada indica que vaya a tratar de
        forma distinta a otras marcas. Pero los planes, las bibliotecas de
        entrenamientos y las relaciones con los atletas de muchos entrenadores
        de resistencia pertenecen ahora a un fabricante de relojes, y las
        decisiones sobre esa plataforma se tomarán pensando en los intereses de
        Garmin.
      </p>
      <p>
        Nada de esto es un escándalo. Las empresas se compran y a veces
        fracasan. La cuestión es que, con una plataforma cerrada, tu historial
        de entrenamiento dura lo mismo que el negocio que lo guarda.
      </p>

      <h2>Qué obtienes de verdad al "exportar tus datos"</h2>
      <p>
        Si vives en la Unión Europea, el artículo 20 del RGPD te da derecho a la
        portabilidad: los datos que has facilitado, en un formato estructurado y
        legible por máquina. En la práctica, lo que puedes llevarte varía mucho.
        Los archivos de actividad (FIT, GPX) suelen salir bien, porque todas las
        herramientas los leen. Los entrenamientos planificados, los comentarios
        del entrenador, las plantillas y la forma en que se construyó una
        temporada son otra historia: suelen guardarse en un formato propio de la
        plataforma y, aunque puedas exportarlos, puede que ninguna otra
        herramienta sepa importarlos.
      </p>
      <p>
        Dos hábitos ayudan, uses la herramienta que uses. Haz que tus
        actividades lleguen a más de un sitio, por ejemplo desde la cuenta de tu
        reloj a tu plataforma de entrenamiento y a un segundo servicio, para que
        ninguna empresa tenga la única copia. Y pide una exportación completa
        una vez al año, antes de necesitarla, para ver qué obtendrías realmente.
      </p>

      <h2>Qué cambia el código abierto y qué no</h2>
      <p>
        El código de OpenAthlete es{' '}
        <a href="https://github.com/openathleteorg/openathlete">público</a>. Eso
        tiene algunas consecuencias concretas. Puedes leer cómo se calcula la
        carga de entrenamiento en lugar de fiarte de una caja negra. Puedes ver
        qué datos salen del servidor y adónde van. Y si el proyecto se parase
        mañana, el código, el esquema de la base de datos y los archivos de
        migración seguirían ahí, y cualquiera podría seguir haciéndolo
        funcionar. Los datos están en una base PostgreSQL corriente, no en un
        formato que solo entiende una empresa.
      </p>
      <p>
        El código abierto no hace que un programa sea seguro por sí solo. Un
        código que nadie lee no es más seguro por ser público, y un proyecto
        pequeño tiene menos revisores que uno popular. Tampoco garantiza que
        alguien lo siga manteniendo. Lo que garantiza es que tienes permiso para
        mirar, y que existe la opción de continuar sin el autor original.
      </p>

      <h2>Por qué la AGPL</h2>
      <p>
        OpenAthlete se publica con la{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          Licencia Pública General Affero de GNU v3
        </a>
        . Cualquiera puede usarlo, modificarlo, ponerlo en marcha y
        redistribuirlo. La condición es que, si lo modificas y dejas que otras
        personas usen tu versión a través de una red, tienes que ofrecerles el
        código fuente de esa versión. La GPL normal no lo exige para un programa
        que funciona como servicio web, y por eso existe la variante Affero.
      </p>
      <p>
        En la práctica, nadie puede coger OpenAthlete, añadirle funciones y
        venderlo como un servicio alojado cerrado. Las mejoras de cualquiera que
        lo ofrezca a otros vuelven a todos. La versión alojada en
        openathlete.org usa el mismo código público; las funciones que solo
        tienen sentido allí, como la facturación, están desactivadas mientras no
        se configuren.
      </p>

      <h2>Autoalojamiento, sin adornos</h2>
      <p>
        Puedes instalar OpenAthlete en tu propio servidor con el{' '}
        <code>docker-compose.yml</code> del repositorio o con las imágenes
        publicadas en GHCR. Necesita PostgreSQL y Redis, ambos incluidos en el
        archivo compose. Es gratuito, sin límite de atletas ni funciones de
        pago. Una instancia autoalojada no envía nada a OpenAthlete, y una
        prueba automatizada lo comprueba en cada versión. Puedes conectar un
        inicio de sesión único mediante OIDC, elegir registros abiertos, por
        invitación o cerrados, y ejecutar las funciones de IA con un modelo
        local a través de Ollama, para que no salga absolutamente nada de tu
        máquina.
      </p>
      <p>
        Los costes son reales, eso sí. Las copias de seguridad, las
        actualizaciones y la seguridad corren de tu cuenta. Las conexiones con
        los relojes usan tus propias credenciales de desarrollador de cada
        proveedor: algunas, como las de Strava, se consiguen rápido, y otras,
        como las de Garmin, pasan por una revisión de la solicitud antes de dar
        acceso a la API. Subir archivos FIT, GPX o TCX funciona sin nada de eso.
        El autoalojamiento tiene más sentido para un entrenador o un grupo con
        alguien que se maneje con un servidor, o para una organización que
        necesita los datos de sus atletas en su propia infraestructura. La{' '}
        <Link href="/es/self-hosting">página de autoalojamiento</Link> explica
        la instalación.
      </p>

      <h2>Si prefieres no gestionar un servidor</h2>
      <p>
        La versión alojada es gratuita y tiene todas las funciones. Su API y su
        base de datos funcionan en OVH, en Francia, y la app web la sirve
        Vercel. El plan Supporter (5 € al mes o 50 € al año) añade IA con las
        claves de OpenAthlete y entrenar a más de cinco atletas, y ayuda a pagar
        los servidores. Las razones del proyecto están en la{' '}
        <Link href="/es/open-source">página de código abierto</Link>.
      </p>
    </div>
  );
}
