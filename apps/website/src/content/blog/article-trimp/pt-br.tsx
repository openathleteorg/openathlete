import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O TRIMP, de <em>training impulse</em> (impulso de treino), é a tentativa
        séria mais antiga de resumir um treino em um único número. Eric Banister
        e seus colegas o propuseram nos anos 1970 como dado de entrada do modelo
        de condicionamento e fadiga deles, e cinquenta anos depois ele continua,
        de uma forma ou de outra, por trás da maioria dos gráficos de carga
        baseados em frequência cardíaca. Dá para calcular à mão, e esse é o
        melhor jeito de entender o que ele mede bem e onde pode te enganar.
      </p>

      <h2>A fórmula</h2>
      <p>
        O TRIMP de Banister multiplica a duração do treino pela fração da sua
        frequência cardíaca de reserva que você usou e pondera essa intensidade
        de forma exponencial, para que os minutos fortes pesem mais que os
        leves:
      </p>
      <p>
        <code>TRIMP = duração (min) × FCr × 0,64 × e^(1,92 × FCr)</code>
      </p>
      <p>
        onde <code>FCr = (FCmédia − FCrepouso) / (FCmáx − FCrepouso)</code>, a
        fração da reserva cardíaca usada no treino. Para mulheres, os
        coeficientes passam a 0,86 e 1,67:{' '}
        <code>TRIMP = duração × FCr × 0,86 × e^(1,67 × FCr)</code>.
      </p>
      <p>
        A parte interessante é a ponderação exponencial. Ela foi ajustada ao
        jeito como o lactato no sangue sobe com a frequência cardíaca: quase
        plano em intensidades leves e bem íngreme perto do limiar (Morton,
        Fitz-Clarke e Banister, 1990). Os coeficientes diferentes para homens e
        mulheres vêm do mesmo trabalho e descrevem médias de grupo, não você.
        Ninguém demonstrou que eles se encaixam bem em um atleta específico,
        então não vale tratar um TRIMP de 112 como mais preciso que um de 105.
      </p>

      <h2>Um exemplo com números</h2>
      <p>
        Pense em um corredor com frequência de repouso de 50 e máxima de 190, ou
        seja, uma reserva de 140 batimentos. Ele faz uma hora de rodagem leve
        com média de 140 bpm.
      </p>
      <ul>
        <li>FCr = (140 − 50) / (190 − 50) = 90 / 140 = 0,643</li>
        <li>Ponderação = 0,64 × e^(1,92 × 0,643) = 0,64 × 3,44 = 2,20</li>
        <li>TRIMP = 60 × 0,643 × 2,20 = 85</li>
      </ul>
      <p>
        Com os coeficientes femininos, a mesma hora dá 97. Mesmo coração, mesmo
        treino, 14% de diferença só pela escolha do coeficiente. Isso mostra o
        quanto o número absoluto depende de hipóteses.
      </p>
      <p>
        Agora um treino de limiar para o mesmo corredor: 20 minutos de
        aquecimento a 135 bpm, tiros de 5 × 4' a 175 bpm com 3' de trote a 140,
        e 8 minutos de desaquecimento a 130. Sessenta minutos de novo. Somando
        bloco a bloco, o TRIMP é 114. Calculado pela frequência média do treino
        inteiro (149 bpm), dá 105.
      </p>
      <p>
        Essa diferença é a exponencial trabalhando: quatro minutos a 175 custam
        muito mais do que a média sugere, então tirar a média de um treino que
        mistura trechos leves e fortes sempre o subestima. O método original de
        Banister usava a média porque era o que os frequencímetros da época
        forneciam. Hoje qualquer relógio grava a frequência a cada segundo, e
        integrar segundo a segundo é a melhor escolha. Quanto mais longo e
        variado o treino, mais isso pesa.
      </p>
      <p>
        Para ter uma referência, um longão de 2 h 30 a 135 bpm dá cerca de 187,
        e 20 minutos a 185 bpm (quase no máximo para esse corredor) cerca de 79.
        A fórmula diz, então, que um esforço curto e muito intenso pode custar
        tanto quanto uma hora leve. Se as suas pernas concordam já é outra
        história.
      </p>

      <h2>O que você precisa configurar direito</h2>
      <p>
        O TRIMP só é tão bom quanto os seus dois valores de referência. Uma
        FCmáx 10 batimentos alta demais faz todo treino parecer mais fácil;
        baixa demais, infla tudo. Use o valor mais alto que você já viu em uma
        prova dura ou em uma subida a todo vapor, não 220 menos a idade, que
        muitas vezes erra por 10 bpm ou mais para cima ou para baixo. A
        frequência de repouso se mede deitado ao acordar, com a média de algumas
        manhãs. Se você não conhece seus valores, a nossa{' '}
        <Link href="/pt-br/tools/heart-rate-zones">
          ferramenta de zonas de frequência cardíaca
        </Link>{' '}
        explica como estimá-los.
      </p>
      <p>
        Depois vem o sensor. Os ópticos de pulso vão bem em rodagens constantes
        e erram com frequência nos primeiros minutos, no frio e em tiros curtos.
        Uma cinta peitoral elimina boa parte desse ruído. Um pulso que trava na
        cadência e marca 170 bpm num trote leve vai te dar um TRIMP que não tem
        nada a ver com o treino.
      </p>

      <h2>Onde o TRIMP erra</h2>
      <p>
        A frequência cardíaca mede o que o seu sistema cardiovascular está
        fazendo, não o que os seus músculos estão pagando. As consequências são
        previsíveis.
      </p>
      <p>
        O caso clássico é a descida. Um trail com 1.500 m de descida acumulada
        pode deixar seus quadríceps destruídos por quatro dias enquanto o
        coração fica moderado nas descidas, então o TRIMP subestima. Treino de
        força, pliometria e tiros em subida têm o mesmo problema.
      </p>
      <p>
        Tiros curtos são outro caso. O coração leva um ou dois minutos para
        alcançar o esforço, então num 30/30 ele nunca chega ao nível que o
        trabalho merece, e o TRIMP sai baixo.
      </p>
      <p>
        O calor age ao contrário. Num dia quente, a deriva cardíaca pode subir a
        frequência em dez batimentos ou mais no mesmo pace ao longo de uma hora.
        O TRIMP conta como um treino mais duro. Fisiologicamente foi, então não
        está totalmente errado, mas faz uma semana de verão parecer mais pesada
        que a mesma semana no inverno.
      </p>
      <p>
        Por fim, a frequência cardíaca não se compara entre esportes. A maioria
        das pessoas chega a frequências mais baixas no pedal do que correndo, e
        mais baixas ainda na água, então um TRIMP de ciclismo e um de corrida
        com o mesmo valor não representam o mesmo estresse. Por isso alguns
        treinadores usam uma FCmáx por esporte.
      </p>

      <h2>Outras versões, e o RPE da sessão</h2>
      <p>
        Várias variantes tentam corrigir parte disso. O TRIMP de Edwards (1993)
        multiplica os minutos em cada uma de cinco zonas de frequência cardíaca
        por um fator de 1 a 5. O de Lucía (Lucía et al., 2003) usa três zonas
        definidas pelos limiares ventilatórios, com pesos 1, 2 e 3. O TRIMP
        individualizado de Manzi (Manzi et al., 2009) troca a curva média de
        Banister pelo perfil de lactato do próprio atleta: mais preciso, mas
        exige teste em laboratório.
      </p>
      <p>
        A alternativa mais simples dispensa a frequência cardíaca. O RPE da
        sessão de Foster (Foster et al., 2001) multiplica a duração em minutos
        pelo quanto o treino pareceu difícil numa escala de 0 a 10: 50 minutos a
        RPE 6 dão 300. Ele enxerga dano muscular, calor, uma noite mal dormida e
        um dia pesado no trabalho, porque você enxerga. Os estudos que
        compararam os dois métodos encontraram boa correlação, mas longe de
        serem idênticos (Impellizzeri et al., 2004), e é aí que está a
        utilidade: quando TRIMP e RPE da sessão discordam, alguma coisa está
        acontecendo. Um limiar que pareceu um 8 com TRIMP normal merece uma
        segunda olhada.
      </p>

      <h2>De um treino ao condicionamento e à fadiga</h2>
      <p>
        Um TRIMP isolado diz pouco. Ele serve como dado diário do modelo de
        Banister, que mantém duas médias exponenciais da sua carga: uma lenta
        para o condicionamento, normalmente com constante de 42 dias (a CTL), e
        uma rápida para a fadiga, com 7 dias (a ATL). A forma, ou TSB, é a
        diferença. Durante um bloco ela fica abaixo de zero; no polimento, a
        fadiga cai mais rápido que o condicionamento e a forma volta a subir. O
        modelo é uma descrição, não uma lei, e os 42 e 7 dias são convenções,
        não valores medidos em você, mas a tendência ao longo das semanas é
        útil.
      </p>
      <p>
        Daí saem duas regras práticas. Compare a sua carga com ela mesma, não
        com a de outra pessoa nem entre sistemas: um TRIMP de 100 e um TSS de
        100 no TrainingPeaks são unidades diferentes. E leia a curva por
        semanas; um dia sozinho significa pouco.
      </p>

      <h2>Como o OpenAthlete usa o TRIMP</h2>
      <p>
        O OpenAthlete calcula o TRIMP de Banister de cada atividade com
        frequência cardíaca, segundo a segundo quando o registro está completo,
        com os coeficientes 0,64/1,92 e 0,86/1,67 e a FCmáx e FC de repouso das
        suas métricas. Quando você dá uma nota de esforço a uma atividade, ele
        mostra também o RPE da sessão ao lado, para você ver quando os dois
        discordam. Condicionamento, fadiga e forma são projetados sobre os
        treinos planejados. A{' '}
        <Link href="/pt-br/features/training-load">
          página de carga de treino
        </Link>{' '}
        tem uma pequena calculadora de TRIMP e links para as fórmulas no
        código-fonte.
      </p>

      <h2>Fontes</h2>
      <ul>
        <li>
          Banister EW, Calvert TW, Savage MV, Bach T. A systems model of
          training for athletic performance. Australian Journal of Sports
          Medicine, 1975;7:57–61.
        </li>
        <li>
          Morton RH, Fitz-Clarke JR, Banister EW. Modeling human performance in
          running. Journal of Applied Physiology, 1990;69(3):1171–1177.{' '}
          <a href="https://doi.org/10.1152/jappl.1990.69.3.1171">
            doi:10.1152/jappl.1990.69.3.1171
          </a>
        </li>
        <li>
          Banister EW. Modeling elite athletic performance. Em: MacDougall JD,
          Wenger HA, Green HJ (orgs.), Physiological Testing of the
          High-Performance Athlete. Human Kinetics, 1991.
        </li>
        <li>Edwards S. The Heart Rate Monitor Book. Polar Electro, 1993.</li>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
        <li>
          Lucía A, Hoyos J, Santalla A, Earnest C, Chicharro JL. Tour de France
          versus Vuelta a España: which is harder? Medicine and Science in
          Sports and Exercise, 2003;35(5):872–878.
        </li>
        <li>
          Impellizzeri FM, Rampinini E, Coutts AJ, Sassi A, Marcora SM. Use of
          RPE-based training load in soccer. Medicine and Science in Sports and
          Exercise, 2004;36(6):1042–1047.
        </li>
        <li>
          Manzi V, Iellamo F, Impellizzeri F, D'Ottavio S, Castagna C. Relation
          between individualized training impulses and performance in distance
          runners. Medicine and Science in Sports and Exercise,
          2009;41(11):2090–2096.
        </li>
      </ul>
    </div>
  );
}
