$(document).ready(function(){   
        const etapas = [
          { nome: 'Negociação', cor: '#ffc107' },
          { nome: 'Revisão', cor: '#4caf50' },
          { nome: 'Cadastramento', cor: '#2196f3' },
          { nome: 'Assinatura', cor: '#9c27b0' }
        ];

        let etapaAtual = 0;

        function atualizarEtapas(index) {
          etapaAtual = index;
          const etapa = etapas[index];
          const centro = document.getElementById('etapaAtual');
          centro.innerText = etapa.nome;
          centro.style.backgroundColor = etapa.cor + '33';

          const segmentos = document.querySelectorAll('.segment');
          segmentos.forEach((seg, i) => {
            seg.classList.remove('current');
            if (i === index) seg.classList.add('current');
          });
        }

        document.getElementById('etapaAtual').addEventListener('click', () => {
          const proxima = (etapaAtual + 1) % etapas.length;
          atualizarEtapas(proxima);
        });

        // Inicializa
        atualizarEtapas(0);

})
