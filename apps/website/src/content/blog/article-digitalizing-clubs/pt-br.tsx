import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Pense numa assessoria ou num clube de corrida ou triatlo qualquer. Pista
        na terça, limiar ou subida na quinta, longão em grupo no domingo. Três
        ou quatro treinadores, muitas vezes voluntários, um coordenador técnico
        que também cuida do site, e entre quarenta e duzentos membros, de quem
        está treinando para o primeiro 10K a quem quer correr a maratona abaixo
        de 3 horas. O treino vive num grupo de WhatsApp, numa planilha
        compartilhada que só uma pessoa entende e na memória do coordenador.
      </p>
      <p>
        Funciona, até parar de funcionar. Quem cuidava da planilha se muda. Um
        membro com dor no tendão de Aquiles conta para um treinador que não está
        na terça seguinte. O grupo de WhatsApp tem 140 pessoas e metade
        silenciou. Levar o treino para o digital não resolve nada disso sozinho.
        Organizar um pouco, sim.
      </p>

      <h2>Comece por quem treina quem</h2>
      <p>
        Antes de escolher uma ferramenta, coloque a estrutura no papel. Os
        clubes que funcionam bem costumam ter os mesmos elementos, seja qual for
        o software:
      </p>
      <ul>
        <li>
          Grupos definidos pelo pace atual, não pela ambição. Um grupo "leve a
          5:30-6:00/km" e outro "4:45-5:15/km" são mais claros que
          "intermediário" e "avançado", e dá para trocar de um para o outro sem
          parecer promoção ou rebaixamento.
        </li>
        <li>
          Um treinador responsável por grupo, e um substituto para as semanas em
          que ele não está.
        </li>
        <li>
          Para os membros que querem uma planilha individual, um treinador
          principal. Outros podem ajudar, mas uma pessoa só responde pela carga
          total.
        </li>
        <li>
          Um lugar único onde lesões e incômodos são anotados, para que o
          próximo treinador de plantão fique sabendo.
        </li>
      </ul>

      <h2>Escreva os treinos do clube uma vez só</h2>
      <p>
        A maioria dos treinos de clube se repete com variações: 6 a 10 tiros de
        400 m no pace de 5K com 200 m de trote, 3 × 8' no limiar, subidas de
        45". O coordenador técnico (ou quem gosta dessa parte) escreve os
        treinos da semana uma vez, com alvos em porcentagem da VMA, do limiar ou
        da frequência cardíaca máxima de cada membro, e não em paces fixos.
        Assim quem corre a 4:00/km e quem corre a 6:00/km fazem o mesmo treino,
        cada um na sua intensidade, e os treinadores de grupo só ajustam o
        volume: oito tiros para um grupo, cinco para outro.
      </p>
      <p>
        Guarde tudo numa biblioteca compartilhada, não na cabeça de alguém. No
        dia em que o coordenador sair, o clube continua com seus treinos.
      </p>

      <h2>Separe avisos de conversa sobre treino</h2>
      <p>
        Um único grupo de chat para tudo é onde a informação vai morrer. Separe:
        um canal só de avisos (mudança de local, provas, assembleia), onde só os
        treinadores postam, e conversas de treino por grupo. O feedback sobre o
        treino de uma pessoa específica fica naquele treino, não num grupo de
        sessenta pessoas.
      </p>

      <h2>Dados de saúde pedem cuidado</h2>
      <p>
        Dores relatadas e anotações de lesão são dados de saúde, uma categoria
        sensível tanto na LGPD quanto no RGPD europeu, e frequência cardíaca ou
        sono podem entrar nessa categoria também. Os membros têm o direito de
        saber quem vê esses dados. Na prática: peça autorização antes de
        conectar o relógio, dê a cada treinador acesso só aos membros que ele
        realmente treina e decida quem pode ler as anotações de lesão. Com
        menores de idade, envolva os pais.
      </p>

      <h2>Duas formas de rodar um clube no OpenAthlete</h2>
      <p>
        O OpenAthlete tem um espaço de clube. Ele é gratuito nos nossos
        servidores, sem limite de alunos, e um clube que prefere o próprio
        servidor tem os mesmos recursos instalando o OpenAthlete lá.
      </p>
      <p>
        <strong>Um espaço de clube, nos nossos servidores.</strong> Um treinador
        cria o clube em Configurações &gt; Clubes e dá um papel a cada membro:
        dono, administrador, treinador, assistente ou atleta. Todo treinador do
        clube acessa os alunos do clube, e esses alunos não contam no limite de
        cinco alunos de uma conta gratuita de treinador. Os membros entram a
        partir de uma lista que você importa (colada, ou em CSV da planilha do
        clube, com os grupos), com um código de acesso ou por links que expiram.
        Cada grupo, por pace ou por nível, tem seus treinadores, e a biblioteca
        do clube reúne os treinos e as pastas que todos os treinadores do clube
        usam.
      </p>
      <p>
        Para planejar para um grupo, você copia um treino, um dia ou uma semana
        para vários alunos de uma vez. Cada cópia se adapta às zonas e limiares
        do aluno, uma prévia mostra o que falta para cada um antes de confirmar,
        e um único desfazer volta tudo. Os treinos semanais do clube, como a
        pista de terça no estádio, entram nos calendários do grupo com quatro
        semanas de antecedência: os alunos dizem se vão, o treinador vê quantos
        confirmaram e, se cancelar uma data, todos recebem uma notificação. As
        mensagens vão para um grupo ou para o clube inteiro, na hora ou
        agendadas, e cada treino mantém sua thread de comentários. O painel do
        treinador foi pensado para dezenas de alunos, com totais por período,
        alertas quando uma métrica como a frequência cardíaca de repouso ou o
        peso passa de um limite, e uma barra lateral feita para alternar entre
        trinta alunos.
      </p>
      <p>
        Um aluno continua podendo ter vários treinadores, então o treinador de
        corrida e o de fortalecimento planejam no mesmo calendário. Os membros
        podem usar qualquer relógio: as atividades vêm de Garmin, COROS, Suunto,
        Polar, Strava ou arquivos, e os treinos planejados chegam aos relógios
        Garmin, COROS e Suunto, não aos Polar. Eles também podem assinar os
        próprios treinos pelo Google Agenda ou pelo Calendário da Apple. O que
        ainda falta é a cobrança para o clube: as mensalidades continuam sendo
        geridas fora do OpenAthlete.
      </p>
      <p>
        <strong>O clube roda sua própria instância.</strong> O OpenAthlete é
        open source, então um clube pode instalar num servidor pequeno e ter sua
        própria plataforma no seu próprio endereço, com os mesmos recursos de
        clube, sem limite de alunos e sem assinatura. Os membros podem entrar
        com login único via Authentik, Keycloak ou qualquer provedor OpenID
        Connect, e o cadastro pode ser só por convite ou fechado. Uma instância
        auto-hospedada não envia nada ao OpenAthlete. Uma ressalva honesta: a
        sincronização com a COROS funciona de cara, mas Garmin, Suunto, Polar e
        Strava exigem que o clube se cadastre no programa de desenvolvedores de
        cada marca, e Garmin e Suunto aprovam parceiros um a um. A importação de
        arquivos sempre funciona.
      </p>
      <p>
        Para a maioria dos clubes, o espaço de clube nos nossos servidores é o
        jeito mais rápido de começar. Um clube que quer os dados dos membros no
        próprio servidor, e tem alguém que se vira bem com um, pode seguir o
        segundo caminho. A <Link href="/pt-br/clubs">página de clubes</Link>{' '}
        apresenta as duas, e a{' '}
        <Link href="/pt-br/self-hosting">página de auto-hospedagem</Link>{' '}
        explica a instalação. Se o seu clube tem necessidades específicas,
        contar para a gente como vocês treinam de verdade é a ajuda mais útil
        que você pode dar.
      </p>
    </div>
  );
}
