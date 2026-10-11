# ChocoFeliz

Site-mostruário dos pirulitos de chocolate personalizados da ChocoFeliz: uma página única com uma abertura em 3D onde o pirulito é **construído e desembrulhado** conforme a pessoa rola a página, mais mostruário, configurador ("Monte o seu") e contato.

Mesma base do portfólio: **Vite + React + TypeScript + Tailwind v4 + Three.js (React Three Fiber) + Motion + Lenis**, publicado no **Netlify** com **Netlify Forms**.

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

- **Mostruário**: fotos reais com zoom (lightbox) e uma faixa com os temas. Tocar num tema leva direto ao configurador.
- **Monte o seu**: pirulito 3D que muda na hora com tema, nome, idade, chocolate (ao leite, meio amargo, branco, rosa), cor do fitilho e embalagem. O botão gera a mensagem pronta para o WhatsApp.
- **Como funciona**: os 4 passos, com uma "calda" que escorre conforme a página rola.
- **Contato**: formulário (Netlify Forms) que já leva junto o pirulito montado no configurador.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run typecheck
```

## Publicando no Netlify

O `netlify.toml` já está pronto (build `npm run build`, pasta `dist`, Node 22). É só conectar o repositório no Netlify.

Os pedidos do formulário aparecem em **Netlify → Forms → pedido**. Para receber por e-mail: **Forms → Form notifications → Add notification**.

## Onde editar

| O quê | Arquivo |
| --- | --- |
| WhatsApp, Instagram, e-mail, cidade | `src/data/brand.ts` |
| Fotos do mostruário | `src/assets/mostruario/` + `src/data/gallery.ts` |
| Temas dos rótulos (nome, exemplo, cores) | `src/data/themes.ts` (o desenho de cada tema fica em `src/lib/labelArt.ts`) |
| Chocolates, cores de fitilho, ocasiões | `src/data/options.ts` |
| Menu | `src/data/nav.ts` |
| Textos da abertura | `src/components/sections/Hero.tsx` |

Enquanto o número de WhatsApp estiver vazio em `brand.ts`, os botões abrem o WhatsApp para a pessoa escolher o contato. **Preencha antes de publicar.**

## Estrutura

```
src/
  components/
    three/      cena 3D: pirulito, celofane (shader), fitilho, granulado, abertura e configurador
    sections/   seções da página (Hero, Mostruário, Monte o seu, Como funciona, Contato)
    layout/     loader, menu, rodapé, cursor, scroll suave
    ui/         peças reutilizáveis
  context/      estado da abertura e do pedido montado
  data/         conteúdo editável
  lib/          desenho dos rótulos em canvas
```
