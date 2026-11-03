import Link from 'next/link';

import { Sources } from './sources';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Em software de treino, "IA" quer dizer duas coisas bem diferentes, e o
        marketing costuma misturar as duas. De um lado, modelos estatísticos que
        trabalham com números: frequência cardíaca, pace, potência,
        variabilidade da frequência cardíaca, sono. Eles estimam ou tentam
        prever alguma coisa. Do outro, os modelos de linguagem, a família do
        ChatGPT, do Claude e do Mistral, que leem e escrevem texto. As
        evidências científicas são muito diferentes para cada um, então vale
        olhar um de cada vez.
      </p>

      <h2>Muito do que se vende como IA é aritmética</h2>
      <p>
        As curvas de condicionamento, fadiga e forma (CTL, ATL, TSB) são médias
        ponderadas exponencialmente da carga diária, herdeiras do modelo
        impulso-resposta de Banister, dos anos 1970. O TRIMP transforma duração
        e frequência cardíaca numa pontuação de carga. O RPE da sessão é ainda
        mais simples: o método de Foster multiplica a nota de esforço do atleta,
        numa escala de 0 a 10, pela duração em minutos. Um treino de 60 minutos
        com RPE 6 dá 360 unidades. Nada disso é aprendizado de máquina, e isso é
        bom: você pode conferir a fórmula, sabe o que ela ignora e, quando um
        número parece estranho, consegue entender por quê.
      </p>
      <p>
        A declaração de consenso sobre monitoramento de carga publicada por
        Bourdon e colegas em 2017 recomenda exatamente esse tipo de ferramenta:
        medir o que foi feito (carga externa, como distância e pace) e quanto
        custou ao atleta (carga interna, como frequência cardíaca e RPE), e
        olhar as duas juntas ao longo do tempo. Essa continua sendo a base de
        uma boa prática, e não precisa de rede neural nenhuma.
      </p>

      <h2>A previsão é mais fraca do que os anúncios sugerem</h2>
      <p>
        A previsão de lesões é onde as promessas mais se adiantam aos dados. A
        revisão de Roald Bahr publicada em 2016 no British Journal of Sports
        Medicine explica por que testes de triagem não conseguem prever a lesão
        de uma pessoa específica: mesmo um fator de risco forte no nível do
        grupo deixa uma sobreposição enorme entre os atletas que se machucam e
        os que não se machucam. O aprendizado de máquina ainda não mudou muito
        esse quadro. Uma revisão sistemática de Van Eetvelde e colegas (2021)
        encontrou onze estudos sobre previsão de lesões esportivas com
        aprendizado de máquina, com desempenho que ia de pouco melhor que cara
        ou coroa (AUC de 0,52) a bom (0,87), e pediu mais trabalho na
        interpretação dos modelos.
      </p>
      <p>
        A relação entre carga aguda e crônica é um bom exemplo de cautela. Por
        alguns anos, a ideia de que uma relação entre 0,8 e 1,3 era uma "zona
        ideal" segura se espalhou por apps e cursos de treinadores. Impellizzeri
        e colegas mostraram em 2020 que essa relação tem problemas estatísticos
        de base e que as evidências da zona ideal não se sustentam. Aumentar
        muito a carga de uma semana para a outra continua sendo má ideia. Um
        número de risco preciso construído sobre essa relação, não.
      </p>
      <p>
        Então, quando um app mostrar "risco de lesão: 23%", pergunte como esse
        número foi validado, com quem e quantas vezes ele errou. Se não houver
        resposta, trate como enfeite.
      </p>

      <h2>Onde os modelos numéricos ajudam: a VFC, com uma referência</h2>
      <p>
        A variabilidade da frequência cardíaca é o sinal diário mais útil que a
        maioria dos atletas consegue medir em casa. Num estudo pequeno, de
        quatro semanas, Kiviniemi e colegas (2007) deixaram a VFC da manhã
        decidir o treino do dia: forte se a VFC se mantinha ou subia, leve ou
        descanso se caía abaixo da faixa recente do próprio atleta. Esse grupo
        melhorou mais a velocidade máxima de corrida do que um grupo com uma
        planilha fixa. Plews e colegas (2013) acrescentaram um ponto prático
        importante: uma única medida matinal tem muito ruído, e médias móveis de
        mais ou menos uma semana, comparadas com a referência do próprio atleta,
        dizem muito mais.
      </p>
      <p>
        Repare no que é isso: uma referência pessoal e uma regra simples.
        Funciona porque é individual, não porque o modelo é esperto. E exige
        medir com disciplina, toda manhã nas mesmas condições, que é onde quase
        todo mundo desiste.
      </p>

      <h2>A percepção ainda ganha da maioria dos sensores</h2>
      <p>
        A revisão sistemática de Saw, Main e Gastin (2016) comparou medidas
        subjetivas (humor, estresse percebido, fadiga) com medidas objetivas
        (marcadores no sangue, frequência cardíaca de repouso, resposta cardíaca
        ao exercício). As subjetivas acompanharam as mudanças de carga com mais
        sensibilidade e consistência. Em termos simples: perguntar ao atleta
        como ele se sente, e registrar isso sempre, é uma das melhores
        ferramentas de monitoramento que existem.
      </p>
      <p>
        É aqui que os modelos de linguagem se mostram úteis de verdade, sem
        glamour. Um atleta escreve ou fala sem problema "perna pesada desde o km
        8, Aquiles esquerdo meio dolorido na escada depois", mas raramente
        preenche cinco controles deslizantes. Um modelo de linguagem consegue
        transformar essa frase numa nota de esforço e num registro de dor
        (Aquiles esquerdo, leve, depois do treino) que o treinador pode filtrar
        e acompanhar. É entrada de dados estruturados, feita por algo que
        entende frases soltas.
      </p>

      <h2>Quando um modelo de linguagem escreve a planilha</h2>
      <p>
        Düking e colegas (2024) pediram ao ChatGPT planilhas de corrida de seis
        semanas com três níveis de detalhe no pedido e colocaram treinadores
        experientes para avaliá-las segundo 22 critérios de qualidade. Com o
        mínimo de informação, a planilha ficou abaixo da nota média em 19 dos 22
        critérios. Com informação detalhada (histórico, objetivos, limitações),
        em apenas um. Mesmo assim, os autores desaconselham usar essas planilhas
        sem a avaliação de um treinador. Um estudo de Washif e colegas (2024)
        sobre programas de musculação chegou a uma conclusão parecida: rascunhos
        plausíveis que precisam de ajuste de quem conhece o assunto.
      </p>
      <p>
        Modelos de linguagem também afirmam coisas falsas com total fluência,
        uma falha conhecida como alucinação (Ji e colegas revisam o problema em
        2023). No treino, isso aparece como um volume semanal que não fecha, um
        "estudo" que não existe ou um regenerativo colocado sem aviso no pace de
        limiar. São erros fáceis de deixar passar justamente porque o resto do
        texto se lê bem.
      </p>

      <h2>O que isso significa na prática</h2>
      <p>
        Use modelos de linguagem para trabalho de texto: escrever um treino
        estruturado a partir de uma descrição, resumir um mês de anotações,
        registrar a percepção depois do treino, explicar um conceito. Deixe as
        decisões de carga e intensidade em números que você pode conferir, com
        um treinador ou a sua própria experiência como filtro final. Desconfie
        de qualquer índice de risco cuja validação você não consegue ver. E, se
        for para manter um único hábito que a pesquisa claramente apoia,
        registre como você se sentiu em cada treino.
      </p>

      <h2>Como o OpenAthlete usa IA</h2>
      <p>
        No OpenAthlete, a carga de treino é o TRIMP calculado pela frequência
        cardíaca, com o RPE da sessão ao lado: fórmulas, não uma caixa-preta. A
        IA é opcional e cuida do trabalho de texto descrito acima: um treino
        estruturado a partir de uma frase, três ou quatro perguntas depois de
        uma atividade que viram uma nota de esforço e um registro de dor para o
        treinador, e uma leitura curta de cada atividade. Não há previsão de
        lesões. A <Link href="/pt-br/features/ai-coach">página sobre IA</Link>{' '}
        detalha o que ela faz e quais provedores você pode usar.
      </p>

      <h2>Fontes</h2>
      <Sources />
    </div>
  );
}
