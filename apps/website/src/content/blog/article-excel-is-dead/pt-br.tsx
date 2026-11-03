import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Muitos bons treinadores tocam toda a assessoria numa planilha. Uma aba
        por atleta, uma linha por dia, uma cor para cada tipo de treino e uma
        coluna de comentários que o atleta preenche, ou não. É grátis, se adapta
        a qualquer método e ninguém pode tirar de você. O título deste post é um
        pouco injusto: o Excel não morreu, e para alguns treinadores continua
        sendo a ferramenta certa.
      </p>
      <p>
        Mas ele tem custos, e eles crescem com o número de atletas de um jeito
        fácil de não perceber. Este post passa por esses custos, mostra como
        tirar mais da planilha se você ficar com ela, e quando um software
        dedicado começa a valer a pena.
      </p>

      <h2>Onde a planilha funciona</h2>
      <p>
        Com três a cinco atletas que você conhece bem, que treinam mais por
        sensação e te mandam mensagem depois dos treinos chave, uma planilha é
        difícil de bater. Você pode escrever qualquer coisa numa célula: "tiros
        de 6 × 1 km no pace de 10 km, 1'30 de trote, parar no 4º se a
        panturrilha reclamar" é uma prescrição perfeitamente válida, e nenhum
        software vai te forçar a usar o vocabulário dele. Com Google Sheets é
        fácil compartilhar, o histórico fica onde você colocou e não tem
        assinatura.
      </p>

      <h2>Onde ela começa a custar</h2>
      <p>
        O primeiro custo fica com o atleta. Um treino escrito numa célula
        precisa ser digitado de novo no Garmin Connect ou no app da COROS para
        aparecer no relógio, ou lembrado de cabeça durante a corrida. A maioria
        faz isso para o treino chave da semana e pula o resto, então o limiar
        sai no pace que eles lembram, não no que você escreveu.
      </p>
      <p>
        O segundo é a volta. Para comparar o planejado com o realizado, alguém
        precisa copiar o treino do Strava ou do app do relógio: distância,
        tempo, talvez a frequência média. Ou o atleta faz, quando lembra, ou
        você faz, no domingo à noite. Nos dois casos você tem um resumo do
        treino, não o treino: vê que os 6 × 1 km saíram a 4:05/km de média, não
        que os dois últimos tiros foram a 4:15 com o coração subindo.
      </p>
      <p>
        O terceiro são as mudanças. Uma prova muda duas semanas, um atleta fica
        cinco dias doente, uma viagem para a serra substitui um bloco de pista.
        Na planilha você reescreve linhas à mão, confere se os totais da semana
        ainda fazem sentido e torce para o atleta ter aberto a versão mais
        recente, e não a que foi anexada no e-mail da terça passada.
      </p>
      <p>
        O quarto é a carga. A maioria dos treinadores que fica na planilha
        acompanha o volume (quilômetros, horas) e pouco mais, porque ir além
        exige fórmulas e digitação. Só o volume esconde muita coisa: 60 km de
        rodagem leve e 60 km com dois treinos de qualidade não são a mesma
        semana.
      </p>

      <h2>Se ficar na planilha, faça direito</h2>
      <p>Alguns hábitos resolvem quase tudo isso sem trocar de ferramenta.</p>
      <ul>
        <li>
          Use uma planilha online compartilhada por atleta em vez de arquivos
          por e-mail. Assim existe uma versão só, e o atleta vê as mudanças
          assim que você faz.
        </li>
        <li>
          Acrescente duas colunas que o atleta preenche depois de cada treino: a
          duração em minutos e o esforço numa escala de 0 a 10. Multiplique as
          duas e você tem o RPE da sessão de Foster (Foster et al., 2001), uma
          medida de carga que não precisa de aparelho nenhum: 50 minutos a RPE 6
          dão 300. Some por semana e você vê um bloco se construindo, ou uma
          semana que passou do ponto.
        </li>
        <li>
          Tenha um modelo para cada treino recorrente ("limiar 5 × 4'", "longão
          com os últimos 20' no pace de maratona") e copie em vez de digitar de
          novo. Menos erro, e o atleta aprende o vocabulário.
        </li>
        <li>
          Peça uma linha de comentário por treino, não um parágrafo. "Pernas
          pesadas, tendão de Aquiles esquerdo duro ao acordar" é exatamente o
          que você precisa para pegar um problema cedo.
        </li>
      </ul>
      <p>
        Com isso, uma planilha faz um trabalho decente para um punhado de
        atletas. Ela continua sem colocar o treino no relógio, e continua
        dependendo de gente digitando números que já existem em outro lugar.
      </p>

      <h2>O que um software muda</h2>
      <p>
        O valor de uma plataforma de treino não são os gráficos. É que os dados
        andam sozinhos, sem ninguém copiar. Você escreve o treino uma vez, com
        alvos tirados das zonas do atleta; ele vai para o relógio; a atividade
        volta sozinha depois da corrida e fica ao lado do planejado, etapa por
        etapa. Quando uma prova muda de data, você arrasta o bloco e o relógio
        acompanha. A carga é calculada a partir de cada treino, tenha alguém
        lembrado de preencher uma coluna ou não.
      </p>
      <p>
        Também não sai de graça. Você vai gastar uma ou duas noites recriando
        seus treinos de sempre como modelos, alguns atletas vão precisar de
        ajuda para conectar o relógio, e você abre mão de um pouco da liberdade
        da célula em branco. Se vale a pena depende principalmente de quantos
        atletas você tem e de com que frequência a planilha muda. Como regra
        geral, a pergunta fica séria a partir de cinco atletas, ou na primeira
        vez que um deles faz um treino chave por uma versão desatualizada do
        plano.
      </p>

      <h2>Testar sem pagar</h2>
      <p>
        O OpenAthlete é grátis para treinadores com até cinco atletas, com todos
        os recursos: calendário, editor de treinos, envio para relógios Garmin,
        Suunto e COROS, importação de atividades dessas marcas e também de Polar
        e Strava, e carga de treino pela frequência cardíaca com o RPE da sessão
        ao lado. Acima de cinco atletas, o Supporter custa € 50 por ano para uma
        assessoria de qualquer tamanho. Dá para usar ao lado da sua planilha com
        um ou dois atletas por um mês antes de decidir. A{' '}
        <Link href="/pt-br/coaches">página para treinadores</Link> mostra como é
        o lado do treinador.
      </p>

      <h2>Fonte</h2>
      <ul>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
      </ul>
    </div>
  );
}
