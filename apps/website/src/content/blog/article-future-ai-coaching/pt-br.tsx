import Link from 'next/link';

import { Sources } from './sources';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Há uns dois anos, "treino com IA" queria dizer quase sempre um chatbot
        que escrevia uma planilha genérica de doze semanas e esquecia você assim
        que a aba era fechada. O que mudou desde então não é que os modelos de
        linguagem de repente entendam mais de treino. É que agora eles podem
        agir: abrir o seu calendário, ler as atividades do mês passado e
        escrever treinos na planilha que o seu relógio vai baixar amanhã cedo. É
        isso que se chama de agente, e vale pensar com calma no que isso muda
        para os treinadores e no que não muda.
      </p>

      <h2>O que é MCP, em poucas palavras</h2>
      <p>
        O Model Context Protocol é um padrão aberto, apresentado pela Anthropic
        em novembro de 2024, que permite a um cliente de IA como o Claude ou o
        ChatGPT chamar ferramentas expostas por outro aplicativo. Uma plataforma
        de treino pode expor ferramentas como "ler o calendário destas semanas",
        "obter a carga de treino", "planejar estes treinos" ou "mover este
        treino para quinta". O modelo decide quais ferramentas chamar e em que
        ordem. O aplicativo decide o que o modelo pode mexer e confere cada
        pedido como conferiria um clique do usuário.
      </p>
      <p>
        Essa separação importa. O modelo entra com a linguagem e o raciocínio; a
        plataforma fica com os dados, as permissões e as regras. Um modelo que
        entende você errado pode sugerir uma bobagem, mas não alcança nada que a
        plataforma não exponha.
      </p>

      <h2>Uma segunda-feira realista</h2>
      <p>
        Pense num treinador com quinze atletas. Na segunda de manhã, uma delas,
        a nove semanas de uma maratona, escreve que está gripada desde sábado e
        que, na melhor das hipóteses, volta na quinta. O trabalho de sempre:
        abrir o calendário dela, apagar ou mover cinco ou seis treinos,
        reescrever o resto da semana, encurtar o longão e conferir se a semana
        seguinte ainda faz sentido. Dez ou quinze minutos, e é a terceira
        mensagem desse tipo no dia.
      </p>
      <p>
        Com um agente conectado à plataforma, o treinador pode escrever: "A Anna
        está doente desde sábado, provavelmente até quinta. Registre isso, deixe
        tudo leve até domingo, passe o 3 × 15 minutos no ritmo de maratona de
        sábado para a próxima terça e deixe o longão de domingo em 1h15 leve". O
        agente registra a doença, lê o calendário, faz as mudanças e responde. O
        treinador olha a semana no calendário, ajusta uma coisa e segue em
        frente.
      </p>
      <p>
        Repare em quem tomou as decisões. Cada escolha naquela instrução (quanto
        tempo ficar no leve, qual treino merece ser mudado de dia, quanto deve
        durar o longão) veio do treinador. O agente fez os cliques. Essa é a
        versão honesta do que os agentes oferecem hoje à assessoria esportiva: a
        metade administrativa do trabalho fica muito mais barata, e a metade que
        depende de julgamento continua onde estava.
      </p>

      <h2>No que os agentes ainda são ruins</h2>
      <p>
        <strong>Saber o que não sabem.</strong> Um agente monta um bloco mesmo
        quando os dados são escassos: sem frequência cardíaca em metade dos
        treinos, sem RPE, com uma semana de viagem que ninguém mencionou.
        Impellizzeri e colegas defendem há anos que é a carga interna, o quanto
        o treino custou para aquele atleta, que move a adaptação, e é justamente
        a parte que mais falta nos dados. Um treinador percebe o buraco. Um
        modelo tende a preenchê-lo com suposições.
      </p>
      <p>
        <strong>Julgamento de longo prazo.</strong> Se vale incluir um terceiro
        treino de qualidade, quando começar o polimento, se esse atleta precisa
        agora de uma semana regenerativa ou aguenta mais uma: tudo isso depende
        de anos de histórico, do trabalho e da família, de como ele reage à
        fadiga. Quando Düking e colegas (2024) colocaram treinadores experientes
        para avaliar planilhas de corrida escritas pelo ChatGPT, as planilhas
        melhoraram bastante com mais informação, mas ainda não foram
        consideradas ótimas, e os autores recomendam a revisão de um treinador.
      </p>
      <p>
        <strong>Erros cometidos com confiança.</strong> Uma zona lida errado
        transforma um regenerativo num treino de limiar. Uma data deslocada em
        um dia coloca o longão na véspera de uma prova. Os modelos de linguagem
        cometem esses erros num texto fluido e razoável, e é isso que faz com
        que passem despercebidos.
      </p>
      <p>
        <strong>Responsabilidade.</strong> Quando uma planilha contribui para
        uma lesão, alguém precisa assumir essa decisão e conversar com o atleta
        sobre ela. Um modelo não consegue.
      </p>

      <h2>Manter o treinador no circuito, na prática</h2>
      <p>
        "Manter uma pessoa no circuito" é fácil de dizer. Numa ferramenta de
        treino, isso vira algumas escolhas de projeto bem concretas:
      </p>
      <ul>
        <li>
          O agente escreve no mesmo calendário que o treinador e o atleta veem.
          Nada acontece numa camada escondida, então uma mudança errada aparece
          na hora.
        </li>
        <li>
          Ele é instruído a mover e editar treinos em vez de apagar e criar de
          novo: uma mudança continua sendo uma mudança.
        </li>
        <li>
          Treinos concluídos e atividades registradas são histórico. O agente
          não pode reescrevê-los.
        </li>
        <li>
          A IA só funciona depois de um consentimento explícito, que pode ser
          retirado.
        </li>
        <li>
          Os dados vão para o provedor de modelo que você escolheu, com a sua
          chave. Numa instância auto-hospedada com um modelo local, eles não
          saem do seu servidor.
        </li>
      </ul>

      <h2>Um palpite cauteloso para os próximos anos</h2>
      <p>
        O custo administrativo de treinar pessoas vai continuar caindo. Um
        treinador que passa o domingo à noite reescrevendo as semanas de vinte
        atletas vai gastar bem menos tempo com isso. Isso pode ir para dois
        lados: mais atletas por treinador ou mais atenção por atleta. O segundo
        é o melhor uso, e os atletas vão perceber qual deles o treinador
        escolheu.
      </p>
      <p>
        Atletas que treinam sozinhos com um agente vão se dar bem se já sabem
        como é um bom treino e usam o agente para executá-lo. É mais arriscado
        para iniciantes, que são os que menos conseguem identificar uma planilha
        ruim e os que mais tendem a segui-la. Não esperamos previsão confiável
        de lesões tão cedo: a pesquisa sobre triagem e aprendizado de máquina dá
        poucos motivos para isso. E a parte do trabalho que consiste em perceber
        que o "tudo certo" de um atleta não quer dizer tudo certo não vai sumir.
      </p>

      <h2>Para experimentar</h2>
      <p>
        O OpenAthlete tem um{' '}
        <Link href="/pt-br/features/mcp-server">servidor MCP</Link> que funciona
        com o Claude, o ChatGPT e outros clientes. Ele lê o contexto de um
        atleta, o calendário, as atividades e a carga de treino, registra uma
        doença ou uma viagem e planeja até 60 treinos de uma vez; depois os
        treinos aparecem no calendário e vão para os relógios Garmin, Suunto e
        COROS. É gratuito, e um treinador pode usá-lo com todos os atletas que
        acompanha.
      </p>

      <h2>Fontes</h2>
      <Sources />
    </div>
  );
}
