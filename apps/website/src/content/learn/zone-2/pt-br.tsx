import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        A zona 2 é o ritmo leve e constante que ocupa quase toda uma semana de
        treino bem montada: o ritmo do longão e das rodagens de recuperação, em
        que você ainda consegue falar frases completas. O nome vem da escala de
        frequência cardíaca em cinco zonas usada pela maioria dos relógios e
        aplicativos, onde ela fica entre o trote bem leve (zona 1) e a zona 3,
        já mais puxada. Fisiologicamente, corresponde a intensidades no primeiro
        limiar de lactato ou logo abaixo: o lactato no sangue mal passa do valor
        de repouso, e o esforço pode durar horas.
      </p>
      <p>
        Virou moda nos últimos anos, principalmente por causa das conversas
        sobre mitocôndrias e oxidação de gordura. O conselho por trás é bem mais
        antigo: em quase todos os esportes de endurance, os atletas passam a
        maior parte do tempo de treino em baixa intensidade, como mostraram as
        revisões de Stephen Seiler sobre o treino de elite (Seiler, 2010).
      </p>

      <h2>Como calcular a zona 2</h2>
      <p>
        Não existe uma definição única, e daí vem quase toda a confusão. A
        versão mais comum por frequência cardíaca usa o método de Karvonen,
        sobre a sua{' '}
        <Link href="/pt-br/learn/heart-rate-reserve">
          frequência cardíaca de reserva
        </Link>
        :
      </p>
      <Formula
        where={[
          'FCrepouso: frequência de repouso, medida deitado ao acordar',
          'FCmáx: a maior frequência que você já viu de verdade, melhor que uma fórmula por idade',
        ]}
      >
        Zona 2 = FCrepouso + (0,60 a 0,70) × (FCmáx − FCrepouso)
      </Formula>
      <p>
        A variante simples usa de 60 a 70% da frequência máxima. Em laboratório,
        a zona 2 é definida por marcadores medidos: o primeiro limiar de lactato
        ou ventilatório. As porcentagens só aproximam esses limiares, e de forma
        grosseira.
      </p>
      <p>
        Cuidado com uma armadilha: no modelo de três zonas usado em pesquisa
        (Seiler e outros), a zona 1 é tudo abaixo do primeiro limiar e a zona 2
        é a faixa entre o primeiro e o segundo limiar. Essa “zona 2” é ritmo
        moderado, não rodagem leve. Ao ler um estudo, confira qual escala ele
        usa.
      </p>

      <h2>Exemplo de cálculo</h2>
      <p>
        Uma corredora tem 50 bpm em repouso e já viu 190 bpm no fim de um treino
        forte de subidas. A reserva dela é de 140 batimentos.
      </p>
      <ul>
        <li>Limite inferior da zona 2: 50 + 0,60 × 140 = 134 bpm</li>
        <li>Limite superior: 50 + 0,70 × 140 = 148 bpm</li>
        <li>Com 60–70% da máxima: 0,60 × 190 = 114 a 0,70 × 190 = 133 bpm</li>
      </ul>
      <p>
        Os dois métodos quase não se sobrepõem. Para uma corredora treinada, com
        frequência de repouso baixa, 114 bpm é quase caminhar, e a zona por
        porcentagem da máxima cai quase toda na zona 1. Por isso Karvonen
        costuma funcionar melhor para quem corre, e é o padrão da{' '}
        <Link href="/pt-br/tools/heart-rate-zones">
          calculadora de zonas de frequência cardíaca
        </Link>
        .
      </p>
      <p>
        Outro corredor, com 60 em repouso e 180 de máxima, fica com 132 a 144
        bpm. Números parecidos para duas pessoas muito diferentes: as zonas só
        fazem sentido com os seus próprios valores.
      </p>

      <h2>Como usar a zona 2 na planilha</h2>
      <p>
        Para a maioria dos corredores que treinam de quatro a seis vezes por
        semana, quase todo o tempo de corrida fica nas zonas 1 e 2, com um ou
        dois treinos fortes por cima. Na prática:
      </p>
      <ul>
        <li>
          Rodagens: de 40 a 70 minutos na zona 2, de preferência na parte baixa
          no dia seguinte aos tiros.
        </li>
        <li>
          Longão: de 1h30 a 2h30, quase todo na zona 2. A frequência sobe aos
          poucos com o cansaço e o calor; aceite alguns batimentos de deriva em
          vez de terminar se arrastando, e anote quanto ela deriva, porque isso
          diz algo sobre a sua resistência (veja{' '}
          <Link href="/pt-br/learn/aerobic-decoupling">
            desacoplamento aeróbico
          </Link>
          ).
        </li>
        <li>
          Em terreno com subidas, caminhe nas rampas íngremes se for isso que
          mantém você na zona. No trail, todo mundo faz isso em prova.
        </li>
        <li>
          Acompanhe a evolução com uma referência fixa: o mesmo percurso plano,
          na mesma frequência, a cada três ou quatro semanas. Se o pace a 140
          bpm melhora, sua base aeróbica está melhorando.
        </li>
      </ul>
      <p>
        O teste da fala ajuda a conferir: se você só consegue dizer poucas
        palavras seguidas, está acima da zona 2, diga o relógio o que disser.
      </p>
      <p>
        No OpenAthlete, as zonas de frequência cardíaca são definidas por
        porcentagem da máxima ou da reserva, por esporte, e cada atividade
        mostra o tempo em cada zona. A{' '}
        <Link href="/pt-br/features/training-load">
          página de carga de treino
        </Link>{' '}
        explica como a frequência cardíaca também alimenta o{' '}
        <Link href="/pt-br/learn/trimp">TRIMP</Link> de cada sessão.
      </p>

      <h2>Limites</h2>
      <p>
        As zonas por porcentagem supõem que o primeiro limiar de todo mundo fica
        na mesma fração da reserva. Não fica: em corredores treinados pode
        passar bem de 70%, em iniciantes ficar abaixo. Um teste de limiar, em
        laboratório ou na pista, dá limites melhores que qualquer porcentagem.
      </p>
      <p>
        A frequência máxima é o elo fraco. Fórmulas por idade, como a de Tanaka
        (208 − 0,7 × idade), descrevem uma média da população e erram por 10
        batimentos ou mais em muita gente, o que desloca a zona inteira. Calor,
        desidratação, noite mal dormida e cafeína elevam a frequência no mesmo
        pace, e em subidas curtas o coração reage com atraso.
      </p>
      <p>
        Por fim, coloque as promessas no tamanho certo. Boa parte do entusiasmo
        recente com zona 2, mitocôndrias e queima de gordura se apoia em
        comparações entre ciclistas profissionais e pessoas pouco treinadas
        (San-Millán e Brooks, 2018). Elas mostram como atletas treinados são
        diferentes, não o que uma certa quantidade de zona 2 vai fazer por você.
        O volume leve funciona, e um pouco de intensidade por cima também: é a
        ideia do{' '}
        <Link href="/pt-br/learn/polarized-training">treino polarizado</Link>.
      </p>
    </div>
  );
}
