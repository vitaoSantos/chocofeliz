# ChocoFeliz

Site-mostruário dos pirulitos de chocolate personalizados da ChocoFeliz: uma página única com uma abertura em 3D onde o pirulito é **construído e desembrulhado** conforme a pessoa rola a página, mais mural de festas, configurador ("Monte o seu") e contato. Tem também um **painel** (`/admin`) para publicar fotos no mural e ligar/desligar opções do site, sem mexer no código.

Mesma base do portfólio: **Vite + React + TypeScript + Tailwind v4 + Three.js (React Three Fiber) + Motion + Lenis**, publicado no **Netlify** com **Netlify Forms**, **Functions** e **Blobs** (sem banco de dados para manter).

## O conceito da landing page

A abertura conta a história do pirulito em 3D, tudo feito em código (sem modelos prontos):

| Momento | O que acontece |
| --- | --- |
| **Tela de carregamento** | O chocolate "derrete" e enche a tela (0–100%). Quando a cena 3D está pronta, a cortina de chocolate sobe com gotas escorrendo. |
| **Construção** (automática) | Uma gota de chocolate cai, achata e vira o disco com borda; o palito entra por baixo; o rótulo gira como moeda e assenta; o celofane se materializa com brilho dourado; o laço de fitilho cacheado chega voando e amarra. |
| **01 · O laço** (scroll) | O fitilho se desfaz e voa. |
| **02 · O celofane** (scroll) | O celofane se abre como uma flor e se dissolve em faíscas douradas. |
| **03 · Por dentro** (scroll) | Vista explodida: rótulo, chocolate e palito se separam, com anotações escritas à mão. |
| **04 · Do seu jeito** (scroll) | O pirulito gira e a cada volta aparece um tema diferente (futebol, unicórnio, fundo do mar…). |

Rolar para cima faz tudo ao contrário: o pirulito se embrulha de novo.

Depois da abertura:

- **Mostruário**: mural de festas com as fotos enviadas pelo painel (mais recentes primeiro) e as que vêm junto com o site, em estilo polaroide, com zoom (lightbox). Embaixo, uma faixa com os temas: tocar num tema leva direto ao configurador.
- **Monte o seu**: pirulito 3D que muda na hora com tema (26 opções, incluindo **“Sua arte”**, em que a pessoa escolhe a imagem do personagem e vê no rótulo), nome, idade, chocolate, embalagem e fitilho de uma ou duas cores (17 cores prontas + qualquer outra no seletor). O botão gera a mensagem pronta para o WhatsApp.
- **Como funciona**: os 4 passos, com uma "calda" que escorre conforme a página rola.
- **Contato**: formulário (Netlify Forms) que já leva junto o pirulito montado no configurador.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173 (o painel fica em /admin)
npm run build      # gera dist/
npm run typecheck
```

No `npm run dev` as Netlify Functions e o Netlify Blobs são simulados pelo `@netlify/vite-plugin` (os dados de teste ficam na pasta `.netlify/`, fora do git). Para entrar no painel localmente, crie um arquivo `.env` com `ADMIN_PASSWORD=uma-senha-de-teste`.

## Publicando no Netlify

O `netlify.toml` já está pronto (build `npm run build`, pasta `dist`, Node 22, funções em `netlify/functions`). É só conectar o repositório no Netlify.

**Senha do painel (obrigatório para usar o `/admin`):** em **Site configuration → Environment variables → Add a variable**, crie `ADMIN_PASSWORD` com uma senha forte e depois faça um novo deploy (**Deploys → Trigger deploy**). Sem ela o painel avisa que não está configurado; o resto do site funciona normalmente.

Os pedidos do formulário aparecem em **Netlify → Forms → pedido**. Para receber por e-mail: **Forms → Form notifications → Add notification**.

## Painel (`/admin`)

Endereço: `seusite.netlify.app/admin` (não aparece no menu e não é indexado pelo Google). Entra com a senha do `ADMIN_PASSWORD`.

- **Mural de fotos**: escolha uma ou várias fotos (dá para mandar direto do celular). O painel reduz cada foto (1800 px + miniatura de 800 px), corrige a rotação, remove localização e outros dados da câmera e já sugere o mês do evento pela data da foto. Título, tema e data são opcionais e podem ser editados depois; dá para apagar também. Cabem até 400 fotos.
- **Opções do site**: liga e desliga os chocolates (meio amargo, branco…) e os temas que aparecem no “Monte o seu”. Pelo menos um chocolate e um tema ficam sempre ligados.

As mudanças aparecem no site em poucos segundos. Tudo fica guardado no **Netlify Blobs** do próprio site (Netlify → Blobs → `chocofeliz`), sem banco de dados.

Segurança: a senha é conferida na função `netlify/functions/admin.mts`; depois de 8 senhas erradas seguidas o acesso daquele endereço de internet trava por 15 minutos.

## Onde editar

| O quê | Onde |
| --- | --- |
| Fotos do mural | **Painel** (`/admin` → Mural de fotos). Fotos fixas, que vêm com o site: `src/assets/mostruario/` + `src/data/gallery.ts` |
| Ligar/desligar chocolates e temas | **Painel** (`/admin` → Opções do site) |
| WhatsApp (35 98864-8782), Instagram, e-mail, cidade | `src/data/brand.ts` |
| Temas dos rótulos (nome, exemplo, cores) | `src/data/themes.ts` (o desenho de cada tema fica em `src/lib/labelArt.ts`) |
| Chocolates (e qual começa ligado), cores de fitilho, ocasiões | `src/data/options.ts` |
| Menu | `src/data/nav.ts` |
| Textos da abertura | `src/components/sections/Hero.tsx` |

Os temas são desenhos próprios, sem personagens de marcas (que têm direitos autorais). Para um personagem específico, o cliente usa o tema **“Sua arte”** e manda a imagem junto no pedido.

## Desempenho

O 3D foi ajustado para pesar menos em notebook e celular. Se for mexer nele, vale manter:

- **Sem pós-processamento** (bloom etc.): o brilho vem dos próprios shaders. Uma passada de tela cheia a mais por quadro pesa muito.
- **Tudo é preparado atrás da tela de carregamento** (`Warmup.tsx`): compila os shaders, sobe texturas para a GPU e desenha cada peça uma vez. O configurador também é preparado nessa hora, e não quando a pessoa chega nele.
- **Resolução no máximo 1,5×**, caindo para 1× sozinha se o aparelho não segurar 60 fps.
- **Nada de `backdrop-filter` em cima do canvas**, e animações de scroll só com `transform`/`opacity` (nunca `height`, `top` etc.).
- **Rótulos em canvas** são desenhados nos momentos ociosos e só quando estão perto da tela (`src/lib/idle.ts`).

## Estrutura

```
src/
  admin/        painel (/admin): mural de fotos e opções; é carregado à parte, só quem abre o painel baixa
  components/
    three/      cena 3D: pirulito, celofane (shader), fitilho, granulado, abertura e configurador
    sections/   seções da página (Hero, Mostruário, Monte o seu, Como funciona, Contato)
    layout/     loader, menu, rodapé, cursor, scroll suave
    ui/         peças reutilizáveis
  context/      estado da abertura, do pedido montado e dos dados do painel
  data/         conteúdo editável
  lib/          desenho dos rótulos em canvas, chamadas às funções, redução de imagens
netlify/
  functions/    site (opções + fotos, público), mural-image (entrega as fotos), admin (painel, com senha)
  lib/          acesso ao Netlify Blobs e validação das opções
```
