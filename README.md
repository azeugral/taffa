# Taffa · site

Site de apresentação do Taffa ([@taffa_s2](https://www.instagram.com/taffa_s2/)), tatuador na Casa Feia, no centro de São Paulo.
Feito pela [L R G Z](https://lrgz.com.br). Publicado em https://azeugral.github.io/taffa/ (com `noindex` até a aprovação).

## Identidade

- **Logo:** a logo "Taffa" enviada pelo cliente (2000 px), vetorizada por `tools/vetorizar.py` (origem `_ref/logo-cliente.webp`).
- **Paleta:** papel `#f2efe8`, nanquim `#0c0c0d` e as três tintas que ele oferece em todo flash: vermelho `#c1121c` e azul `#1d40d2`.
- **Fundo do hero:** `assets/js/tinta.js`, ornamento gravado: corpos de ornamento desenhados só com linhas finas (contorno, espinha e feixe paralelo que converge em ponta preta, como buril), espelhados atrás da foto e mudando devagar (loop de 50 s). No desktop roda ao vivo na resolução da tela; no toque entra o MP4 de `tools/gerar_video.py`. A versão anterior (suminagashi colorido) foi trocada a pedido.
- **Fontes:** Unbounded, IBM Plex Sans e JetBrains Mono.
- **Favicon:** o T da logo, em nanquim sobre o papel (`tools/favicon.py`).

## Conteúdo

- `assets/obras.json`: 52 trabalhos do Instagram (2023 a 2026), gerados por `tools/processar.py`.
- `assets/disponiveis.json`: 46 flashs da pasta [Disponíveis do Pinterest](https://br.pinterest.com/taffa_s2/dispon%C3%ADveis/) (o botão "Disponíveis" do Linktree). Entram só os que o título marca como disponíveis; os "indisp." e "reservado" ficam de fora.
- Para atualizar os disponíveis: baixar a pasta de novo para `_ref/pin` e rodar `python site/tools/processar.py`.

## CONFIRMAR com o cliente

1. **Pronome:** nas legendas de 2025 e 2026 ele se apresenta como "o Taffa" e "o tatuador de vcs". O site está em primeira pessoa e usa "tatuador". Confirmar.
2. **Ano em SP e tempo de tattoo:** "em São Paulo desde 2016" saiu de uma legenda de 2024 ("esse ano faço 8 anos em sp"); "uns cinco anos de agulha" saiu de "4 anos depois" (2025). Confirmar.
3. **Sinal e valores:** o site não mostra preço (as promoções do IG são antigas). Confirmar se quer tabela por tamanho.
4. **Datas de guest:** Indaiatuba, Florianópolis, Rio e BH estão como lista de espera, conforme o Linktree. Quando abrir data, trocar no bloco `.agenda` do `index.html`.
5. **Espelhos no Fim do Mundo:** confirmar se há loja/site próprio para as peças (as legendas citam "venda pelo site"); por enquanto os botões vão para @espelhosnofimdomund0 e para o WhatsApp.
6. **Fotos de clientes:** as cicatrizadas vêm do destaque, algumas com @ do cliente na imagem.
7. **Domínio:** ainda sem domínio próprio.
