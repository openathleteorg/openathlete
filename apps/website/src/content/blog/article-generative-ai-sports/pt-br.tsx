import Link from 'next/link';

import { Sources } from './sources';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Para um atleta de endurance, a IA generativa não é nem um brinquedo nem
        uma revolução. É uma ferramenta de texto. Ela é muito boa em transformar
        linguagem solta em estrutura e estrutura em texto legível, e pouco
        confiável sempre que precisa acertar sobre o seu corpo ou sobre números
        que ninguém passou para ela. Vista assim, fica claro onde ela economiza
        tempo e onde pode atrapalhar.
      </p>

      <h2>Ela faz bem: escrever um treino</h2>
      <p>
        Digitar um treino estruturado no app do relógio é chato. Descrever, não.
        "20 minutos leves, depois 6 tiros de 3 minutos forte com 2 minutos de
        trote, 10 minutos de desaquecimento" é exatamente o tipo de frase que um
        modelo de linguagem resolve bem: ele divide em etapas, monta as
        repetições e, se conhece as suas zonas, coloca um alvo em cada etapa. O
        "forte" de 3 minutos vira a sua faixa de pace de VO2máx, e o "trote"
        vira pace de recuperação.
      </p>
      <p>
        Antes de mandar o treino para o relógio, vale conferir duas coisas: a
        duração total (às vezes o modelo pula ou duplica um bloco) e a
        intensidade que ele escolheu para as palavras vagas. "Forte" pode ser
        limiar para uma pessoa e pace de 5 km para outra. Se ele errou, avise,
        ou escreva "no limiar" da próxima vez.
      </p>

      <h2>Ela faz bem: transformar percepção em dados</h2>
      <p>
        Depois de um longão, quase ninguém preenche um formulário com cinco
        controles deslizantes. O que a gente diz é algo como "primeira hora
        tranquila, depois o calor pegou, os últimos 5 km foram sofridos e a
        panturrilha direita travou". Um modelo de linguagem consegue transformar
        isso numa nota de esforço por volta de 8 e numa anotação: panturrilha
        direita, contratura, no fim do treino. Com as semanas, essas anotações
        viram algo que um treinador consegue filtrar de verdade.
      </p>
      <p>
        Isso importa mais do que parece. Uma revisão sistemática de Saw e
        colegas (2016) mostrou que medidas subjetivas, relatadas pelo próprio
        atleta, acompanham a carga de treino melhor do que a maioria dos
        marcadores objetivos. O gargalo sempre foi fazer os atletas registrarem.
        Reduzir o esforço a uma frase ou a um áudio ajuda.
      </p>

      <h2>Ela faz bem: resumir e reescrever</h2>
      <p>
        Cole quatro semanas de anotações de treino e peça um resumo antes de
        conversar com o seu treinador: ela vai destacar os temas que se repetem
        (o Aquiles que reclama depois das subidas, os treinos de quinta que
        sempre caem) mais rápido do que você. Ela pode reescrever uma semana em
        torno de uma limitação, por exemplo uma viagem de trabalho de terça a
        quinta só com a esteira do hotel, e entregar um rascunho razoável. Pode
        traduzir uma planilha que o seu treinador escreveu em outra língua. Em
        todos os casos, você recebe um rascunho para conferir, não uma ordem
        para seguir.
      </p>

      <h2>Usável com cuidado: explicar</h2>
      <p>
        Pergunte o que diferencia o treino de limiar dos tiros de VO2máx, ou por
        que o pace do longão deve parecer fácil, e normalmente você recebe uma
        explicação decente. O risco é ela acrescentar com segurança um detalhe
        errado ou citar um estudo que não existe. Modelos de linguagem produzem
        texto fluente, não fatos conferidos, um problema que os pesquisadores
        chamam de alucinação (Ji e colegas, 2023). Se uma resposta citar uma
        fonte, procure a fonte antes de repetir.
      </p>

      <h2>Ela faz mal: dar diagnóstico</h2>
      <p>
        Digite "dor na parte de fora do joelho depois de 20 km" e você vai
        receber uma resposta bem arrumada sobre a banda iliotibial, com
        alongamentos e um plano de volta à corrida. Pode ser que esteja certa.
        Também pode ser outra coisa completamente diferente, e o modelo não tem
        como saber: ele não pode examinar você, ver você correr nem apertar o
        ponto dolorido. Uma resposta plausível para uma pergunta médica é pior
        do que nenhuma resposta, porque adia a consulta que teria resolvido. Dor
        que persiste, que faz você mancar, que piora durante a corrida ou que
        aparece em repouso é assunto para fisioterapeuta ou médico.
      </p>

      <h2>Ela faz mal: planilha completa do zero</h2>
      <p>
        Düking e colegas (2024) pediram ao ChatGPT planilhas de corrida de seis
        semanas e colocaram treinadores experientes para avaliá-las segundo 22
        critérios. Com pouca informação, a planilha ficou abaixo da nota média
        em 19 deles. Com informação detalhada ela melhorou bastante, mas os
        autores continuam desaconselhando seguir essas planilhas sem um
        treinador. A falha típica é fácil de imaginar: você corre 30 km por
        semana, pede uma planilha de maratona e a primeira semana vem com 50 km,
        porque o modelo preencheu o seu histórico com o de um corredor médio.
      </p>

      <h2>Ela faz mal: números que você não passou</h2>
      <p>
        Pergunte "quanto eu corri em setembro?" sem passar os seus dados e um
        modelo de chat pode simplesmente inventar um número plausível. Mesmo com
        os dados colados, somar trinta linhas não é o forte dele. Totais, médias
        e cálculos de carga devem vir de um software que calcula, e o modelo de
        linguagem só deveria comentar o resultado.
      </p>

      <h2>Como conseguir respostas mais úteis</h2>
      <p>
        Dê contexto: suas zonas ou seus tempos recentes, seu volume semanal nas
        últimas quatro a seis semanas, a prova e a data, os dias em que você
        pode treinar e qualquer incômodo atual. Peça que ela diga quais
        suposições está fazendo antes de escrever qualquer coisa. Depois confira
        o resultado com algumas regras simples: nada de grandes saltos de volume
        semanal, não mais treinos fortes do que você está acostumado (dois por
        semana bastam para a maioria dos corredores amadores) e dias leves que
        sejam leves de verdade.
      </p>

      <h2>No OpenAthlete</h2>
      <p>
        Os recursos de IA do OpenAthlete ficam do lado do texto dessa linha. A
        IA escreve um treino estruturado a partir de uma frase usando as suas
        zonas, altera um treino com uma instrução curta, faz três ou quatro
        perguntas depois de uma atividade e transforma as respostas numa nota de
        esforço e num registro de dor para o seu treinador, e dá uma leitura
        curta de cada atividade. Você vê cada treino antes de ele ir para o
        relógio. Ela não dá diagnóstico e só funciona com o seu consentimento,
        com a sua própria chave de API ou com a cota do plano Supporter. A{' '}
        <Link href="/pt-br/features/ai-coach">página sobre IA</Link> tem os
        detalhes.
      </p>

      <h2>Fontes</h2>
      <Sources />
    </div>
  );
}
