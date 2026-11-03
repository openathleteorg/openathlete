import { DISCORD_URL } from '@/config';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Um treino estruturado no relógio faz três coisas úteis: avisa quando
        cada bloco começa e termina, mostra se você está dentro da faixa alvo e
        conta as repetições por você. Num treino como 15' leve, 5 × 4' no limiar
        com 2' de trote, 10' leve, é a diferença entre correr o treino e fazer
        conta enquanto corre.
      </p>
      <p>
        Levar o treino da planilha para o pulso depende da marca. Este guia
        cobre as três marcas que aceitam treinos vindos de outros apps (Garmin,
        COROS e Suunto), o que fazer se você tem um Polar, e termina com uma
        lista de verificação para o dia em que um treino não aparece.
      </p>

      <h2>Quais relógios podem receber treinos</h2>
      <p>
        Toda marca deixa você montar um treino no próprio app. Menos marcas
        deixam uma plataforma de fora mandar um.
      </p>
      <ul>
        <li>
          <strong>Garmin</strong> aceita treinos de parceiros aprovados. Eles
          caem no seu calendário do Garmin Connect e chegam ao relógio na
          próxima sincronização.
        </li>
        <li>
          <strong>Suunto</strong> aceita como guias: é o nome que a Suunto dá a
          um treino estruturado que você escolhe ao iniciar um exercício.
        </li>
        <li>
          <strong>COROS</strong> aceita treinos estruturados de corrida, trail e
          bike, que aparecem no calendário do app da COROS e depois no relógio.
        </li>
        <li>
          A API pública da <strong>Polar</strong> deixa os apps lerem suas
          atividades e seu sono, não escreverem na sua conta, então o
          OpenAthlete não consegue mandar treinos para lá. Você ainda pode
          montá-los à mão no Polar Flow.
        </li>
        <li>
          O <strong>Strava</strong> não tem treinos estruturados: não há para
          onde mandar.
        </li>
      </ul>

      <h2>O que faz um treino ser "estruturado"</h2>
      <p>
        Um relógio só consegue te guiar por etapas. Cada etapa precisa de um
        tamanho (duração ou distância) e, de preferência, de um alvo: uma faixa
        de pace, de frequência cardíaca ou de potência. As repetições agrupam
        etapas, então "5 × (4' a 4:10–4:20/km, 2' leve)" é um bloco de repetição
        com duas etapas.
      </p>
      <p>
        Um treino que diz só "60 minutos leve", sem etapas, não manda nada: o
        relógio não tem o que guiar. Se você quer no pulso, transforme em uma
        única etapa de 60 minutos com teto de frequência cardíaca.
      </p>
      <p>
        Vale um comentário sobre alvos por zona. As suas zonas numa plataforma
        de treino e as do relógio quase nunca são as mesmas. Quando uma etapa
        mira uma das suas zonas, o OpenAthlete manda os valores reais (por
        exemplo 148–158 bpm ou 4:35–4:45/km) em vez de "zona 3", para que o alvo
        no pulso bata com o plano, sejam quais forem as zonas configuradas no
        relógio. O mesmo vale para porcentagens da FCmáx ou da potência de
        limiar, desde que esses valores estejam nas suas métricas.
      </p>

      <h2>Garmin</h2>
      <p>
        Com a Garmin conectada e a exportação de treinos ligada, cada treino
        estruturado vai para o seu calendário do Garmin Connect. O relógio puxa
        na próxima sincronização com o app. Na maioria dos Forerunner, Fenix e
        Venu recentes, o treino agendado para o dia aparece quando você inicia a
        atividade correspondente; se não, procure no menu de treino, em treinos
        ou no calendário. Os nomes dos menus mudam de modelo para modelo, então
        confira o manual se não encontrar.
      </p>
      <p>
        Se você mover ou editar o treino no OpenAthlete, a cópia na Garmin
        acompanha. São enviados treinos de corrida, ciclismo, natação em
        piscina, força, cardio, yoga e pilates. Na piscina, a Garmin só aceita
        pace como alvo, então alvos de frequência cardíaca nas etapas de natação
        são descartados. A Garmin também limita um treino a 100 etapas,
        repetições incluídas, o que só importa se você escreve treinos de pista
        enormes etapa por etapa.
      </p>
      <p>
        Os detalhes de configuração estão na{' '}
        <Link href="/pt-br/connect/garmin">página de conexão com a Garmin</Link>
        .
      </p>

      <h2>COROS</h2>
      <p>
        Treinos de corrida, trail e ciclismo vão para a COROS. Eles aparecem no
        calendário do app da COROS e chegam ao relógio quando ele sincroniza.
        Natação e força não são enviados.
      </p>
      <p>
        A COROS tem uma particularidade que vale conhecer antes da semana da
        prova: um app não consegue apagar um treino planejado lá. Se você mover
        ou excluir um treino no OpenAthlete, o antigo fica no calendário da
        COROS marcado como cancelado, e você apaga no app da COROS. Ao conectar,
        escolha a região em que criou sua conta COROS (Europa, Estados Unidos e
        outras regiões, ou China continental): a COROS mantém cada conta em um
        único servidor regional.
      </p>
      <p>
        O conector da COROS é o mais novo, no ar desde novembro de 2026.
        Detalhes e limites conhecidos na{' '}
        <Link href="/pt-br/connect/coros">página de conexão com a COROS</Link>.
      </p>

      <h2>Suunto</h2>
      <p>
        Treinos de corrida, trail, ciclismo e natação chegam à sua conta Suunto
        como guias. No relógio, escolha o guia ao iniciar o exercício, como
        qualquer outro guia da Suunto. Treinos de força ficam no OpenAthlete. A{' '}
        <Link href="/pt-br/connect/suunto">página de conexão com a Suunto</Link>{' '}
        explica a configuração.
      </p>

      <h2>Polar: as atividades chegam, os treinos são à mão</h2>
      <p>
        Com um Polar, suas atividades, seu sono e sua VFC noturna podem chegar
        ao OpenAthlete automaticamente do mesmo jeito. Para o treino em si você
        tem duas opções: montar no Polar Flow como meta de treino por fases e
        sincronizar o relógio, ou seguir pelo app do OpenAthlete no celular.
        Nenhuma é tão prática quanto uma sincronização direta, e é bom saber
        disso antes de comprar um relógio se treinos estruturados importam para
        você.
      </p>

      <h2>Quando é o seu treinador que planeja</h2>
      <p>
        Os treinos saem pela conexão do atleta, não pela do treinador. Seu
        treinador pode planejar no seu calendário com qualquer relógio, ou sem
        relógio; desde que você tenha conectado Garmin, COROS ou Suunto com a
        exportação ligada, os treinos dele chegam ao seu pulso como os que você
        mesmo planeja. Um treinador pode ter atletas nas três marcas sem fazer
        nada diferente para cada um.
      </p>

      <h2>O treino não está no meu relógio: lista de verificação</h2>
      <p>Siga na ordem. Os dois primeiros itens explicam quase tudo.</p>
      <ul>
        <li>
          <strong>O treino está dentro dos próximos sete dias?</strong> O
          OpenAthlete manda a semana que vem, não o plano inteiro. Um treino
          daqui a três semanas vai sozinho quando entrar nos sete dias. Treinos
          passados não são enviados.
        </li>
        <li>
          <strong>O relógio sincronizou desde então?</strong> O treino chega
          primeiro ao Garmin Connect, ao app da COROS ou ao app da Suunto. Abra
          o app da marca e deixe o relógio sincronizar.
        </li>
        <li>
          <strong>A exportação está ligada?</strong> Em Configurações,
          Conectores, confira se a exportação de treinos está ligada para aquela
          marca.
        </li>
        <li>
          <strong>O treino tem etapas?</strong> Uma duração sem etapas não manda
          nada.
        </li>
        <li>
          <strong>A marca aceita esse esporte?</strong> Um treino de força não
          vai para a COROS nem para a Suunto; natação não vai para a COROS.
        </li>
        <li>
          <strong>Seu modelo segue treinos estruturados?</strong> A maioria dos
          relógios de corrida recentes, sim; alguns modelos de entrada ou
          antigos, não.
        </li>
        <li>
          <strong>Só COROS:</strong> um treino que você moveu pode aparecer duas
          vezes, uma marcada como cancelada. Apague essa no app da COROS.
        </li>
        <li>
          <strong>Ainda nada?</strong> Desconecte e reconecte a marca em
          Configurações, Conectores, e fale com a gente no{' '}
          <a href={DISCORD_URL}>Discord</a> informando a data do treino.
        </li>
      </ul>

      <h2>Fazer à mão</h2>
      <p>
        Você não precisa de plataforma nenhuma para colocar um treino no
        relógio. Garmin Connect, o app da COROS e o Polar Flow têm editor de
        treinos: você cria as etapas, salva e sincroniza. Para um treino chave
        por semana são dez minutos e funciona bem. Fica cansativo quando a
        planilha muda com frequência, quando um treinador escreve para vários
        atletas ou quando os paces precisam acompanhar zonas atualizadas. É aí
        que compensa deixar uma plataforma mandar os treinos.
      </p>
      <p>
        O OpenAthlete manda treinos para Garmin, COROS e Suunto no plano
        gratuito, e importa atividades dessas três marcas e também de Polar e
        Strava. A{' '}
        <Link href="/pt-br/features/watch-sync">
          página de sincronização com relógios
        </Link>{' '}
        tem a tabela completa, marca por marca.
      </p>
    </div>
  );
}
