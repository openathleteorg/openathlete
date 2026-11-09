import Link from 'next/link';

import { Sources } from './sources';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Pergunte a dez corredores por que se machucaram e quase todos terão uma
        explicação pronta: o tênis novo, o treino de pista, a prova com descida
        demais, "fiz muito, cedo demais". A ciência é menos categórica. A
        relação entre carga de treino e lesão existe, mas é mais fraca, mais
        cheia de ruído e mais individual do que os painéis da maioria dos apps
        dão a entender. Este artigo mostra o que as evidências sustentam e onde
        elas acabam.
      </p>

      <h2>Com que frequência corredores se lesionam</h2>
      <p>
        Uma revisão sistemática com corredores de fundo encontrou taxas anuais
        de lesão entre 19% e 79%, dependendo do estudo (van Gent et al., 2007).
        Essa variação diz tanto sobre como cada estudo define lesão quanto sobre
        a corrida em si. Contar por hora de corrida ajuda mais: uma meta-análise
        posterior chegou a cerca de 18 lesões a cada 1.000 horas em iniciantes,
        contra cerca de 8 em corredores recreativos (Videbæk et al., 2015). Com
        o mesmo tempo de corrida, o iniciante se machuca duas vezes mais.
        Primeira pista: o que pesa é a diferença entre o que você faz e o que o
        seu corpo está acostumado a fazer.
      </p>
      <p>
        O fator de risco mais consistente entre os estudos não é a quilometragem
        nem o pace. É ter tido uma lesão antes (van der Worp et al., 2015). Se
        você já teve problema no tendão de Aquiles, esse tendão merece mais
        cuidado do que qualquer índice num gráfico.
      </p>

      <h2>Carga versus capacidade</h2>
      <p>
        A forma mais útil de pensar lesões por sobrecarga vem de Bertelsen e
        colegas (2017). A lesão acontece quando a carga sobre uma estrutura
        específica, como a tíbia ou a fáscia plantar, passa do que essa
        estrutura aguenta, de forma repetida, por um certo tempo. Duas coisas
        variam: a carga que você aplica e a capacidade do tecido, que sobe com
        treino gradual e cai com sono ruim, alimentação insuficiente, doença ou
        lesão anterior.
      </p>
      <p>
        Esse modelo expõe a fraqueza de qualquer métrica de carga. Seu relógio
        mede tempo, distância e frequência cardíaca. Sua tíbia não liga para
        frequência cardíaca. Duas horas de trail com 1.200 m de descida e duas
        horas no plano com a mesma frequência cardíaca média dão um TRIMP
        parecido, mas seus quadríceps e joelhos vão avisar no dia seguinte que
        não foi a mesma coisa. Os números de carga descrevem bem o custo de um
        treino para o sistema cardiovascular. O custo para um tendão ou um osso
        específico, só de forma indireta.
      </p>

      <h2>O que os estudos com corredores mostram</h2>
      <p>
        Há menos estudos bons com corredores do que se imagina, e a maioria
        acompanha iniciantes. Vale conhecer três.
      </p>
      <p>
        Numa coorte dinamarquesa de 874 iniciantes com relógio GPS, quem
        aumentou a distância semanal em mais de 30% ao longo de duas semanas
        teve mais lesões "ligadas à distância" (dor patelofemoral, síndrome da
        banda iliotibial, canelite e mais algumas) do que quem ficou abaixo de
        10% (Nielsen et al., 2014). A taxa geral de lesões não foi diferente
        entre os grupos, e mesmo esse resultado específico ficou no limite da
        significância estatística. Os próprios autores chamaram o estudo de
        exploratório.
      </p>
      <p>
        Num ensaio randomizado holandês, 532 iniciantes se preparando para uma
        prova de 6,7 km seguiram uma planilha padrão de 8 semanas ou uma mais
        gradual, de 13 semanas, baseada na regra dos 10%. As taxas de lesão
        foram quase idênticas: 20,8% e 20,3% (Buist et al., 2008).
      </p>
      <p>
        No ensaio Run Clever, 447 corredores recreativos aumentaram durante 16
        semanas o volume ou a intensidade dos treinos. Os pesquisadores
        esperavam que cada abordagem gerasse seu próprio tipo de lesão. Não
        encontraram diferença (Ramskov et al., 2018).
      </p>
      <p>
        Juntando tudo: saltos grandes e repentinos provavelmente importam,
        principalmente para iniciantes. Abaixo disso, ajustar o ritmo de
        progressão não mostrou mudar muita coisa. Para a prática semana a
        semana, veja{' '}
        <Link href="/pt-br/blog/injury-prevention-2-when-algorithms-predict-the-break">
          quanto aumentar sua quilometragem
        </Link>
        .
      </p>

      <h2>A relação carga aguda:crônica, e por que ela é contestada</h2>
      <p>
        Se você já leu sobre lesão e carga, deve ter esbarrado no ACWR
        (acute:chronic workload ratio): a carga da última semana dividida pela
        carga semanal média das últimas quatro. Ele surgiu de estudos com
        arremessadores rápidos do críquete (Hulin et al., 2014) e ficou famoso
        com o artigo de Tim Gabbett sobre o "paradoxo treino-prevenção de
        lesões", que descrevia uma zona ideal entre 0,8 e 1,3 e uma zona de
        perigo acima de 1,5 (Gabbett, 2016). Em poucos anos esses números
        estavam em apps, cursos para treinadores e muitos blogs, incluindo uma
        versão anterior deste texto.
      </p>
      <p>As críticas vieram na mesma velocidade.</p>
      <ul>
        <li>
          No cálculo usual, a última semana entra no numerador e no denominador.
          Lolli e colegas (2019) mostraram que esse acoplamento matemático cria
          sozinho uma correlação, mesmo com dados aleatórios.
        </li>
        <li>
          Impellizzeri e colegas (2020) apontaram que dividir pela carga crônica
          pressupõe uma relação entre as duas que nunca foi testada, que o
          índice muda conforme se usa média móvel ou exponencial, e que os
          limites vieram de poucas amostras de esportes coletivos e depois foram
          aplicados a todo mundo. Um ano depois, foram além e recomendaram
          abandonar o ACWR e a teoria por trás dele (Impellizzeri et al., 2021).
        </li>
        <li>
          A maioria dos estudos sobre ACWR é observacional, em esportes
          coletivos, com poucas lesões. Uma variável associada a lesões num
          grupo não prevê qual pessoa vai se machucar. Roald Bahr mostrou isso
          para testes de triagem em geral, e vale aqui também (Bahr, 2016).
        </li>
      </ul>
      <p>
        Minha leitura: a ideia de fundo, não fazer de repente muito mais do que
        você vinha fazendo, é antiga, sensata e bate com os dados de corrida
        citados acima. Os limites exatos não estão comprovados. Trate o "1,5"
        como folclore, não como fisiologia, e desconfie de qualquer coisa que
        transforme seu treino num único percentual de risco de lesão.
      </p>

      <h2>O que fazer com isso</h2>
      <p>
        Evidência incerta não é motivo para ignorar a carga. É motivo para
        usá-la no que ela faz bem: mostrar que esta semana está muito diferente
        das anteriores e fazer você perguntar por quê.
      </p>
      <p>
        Repare nas mudanças que as métricas de carga não enxergam. O primeiro
        treino de tiros na pista em meses, uma prova com muita descida, um tênis
        com menos drop, a troca da trilha pelo asfalto: cada uma carrega certos
        tecidos de um jeito novo, mesmo que o total da semana quase não mude.
        Mude uma coisa de cada vez.
      </p>
      <p>
        Leve a sério o que você sente. Uma revisão sistemática concluiu que o
        que os atletas relatam (humor, cansaço, dor muscular) respondia ao
        treino de forma mais confiável do que marcadores objetivos comuns, como
        frequência cardíaca ou exames de sangue (Saw et al., 2016). Anote uma
        dor no dia em que ela aparece, com onde e quanto. Dor que muda sua
        passada, que piora na manhã seguinte ou que fica num ponto exato de um
        osso é motivo para parar e procurar um profissional, diga o gráfico o
        que disser.
      </p>
      <p>
        E considere a capacidade. Uma semana dormindo mal, uma virose ou uma
        fase comendo pouco reduzem o que seus tecidos aguentam. A mesma planilha
        não é a mesma carga para o mesmo corredor em todos os meses do ano.
      </p>

      <h2>O que o OpenAthlete faz</h2>
      <p>
        O OpenAthlete não prevê lesões nem dá uma nota de risco. Ele mostra lado
        a lado os números que este artigo considera úteis. Cada treino recebe
        uma carga calculada pela frequência cardíaca (TRIMP), com a carga por
        RPE da sessão ao lado. Condicionamento, fadiga e forma são desenhados
        sobre o seu histórico e projetados sobre os treinos planejados, e cada
        semana mostra sua carga em relação a uma faixa construída a partir das
        suas semanas recentes: uma referência, não um limite de segurança.
        Depois de uma atividade, algumas perguntas opcionais registram o esforço
        percebido e qualquer dor que você mencionar; essa dor vai para um
        registro de lesões que o seu treinador vê. Detalhes e fórmulas estão na{' '}
        <Link href="/pt-br/features/training-load">
          página de carga de treino
        </Link>
        .
      </p>

      <h2>Fontes</h2>
      <Sources />
    </div>
  );
}
