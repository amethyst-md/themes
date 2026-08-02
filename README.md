# Temas do Amethyst

Catálogo de temas da comunidade. O aplicativo lê o `index.json` deste
repositório e baixa os arquivos direto daqui — nada passa por servidor nosso.

## Instalar um tema

Pelo aplicativo: **Configurações → Appearance → Temas da comunidade →
Catálogo**. Ou, na mão, copiando a pasta de `themes/` para
`.amethyst/themes/` dentro do seu cofre.

## Publicar o seu

1. Faça um fork deste repositório.
2. Crie `themes/<id>/` com `theme.css` e `manifest.json`.
   O `<id>` é minúsculo, sem espaço: `meu-tema`.
3. Some uma entrada em `index.json`.
4. Abra um pull request.

Uma GitHub Action verifica tudo sozinha. Se ela passar, a revisão é só ler as
cores.

### O `theme.css`

**Só variáveis, e só dentro de `:root`.** Sem seletores próprios, sem
`@import`, sem `url()`.

```css
:root {
  --bg-editor: #2e3440;
  --bg-sidebar: #2e3440;
  --accent: #88c0d0;
  --text-primary: #eceff4;
}
```

Não é burocracia: um tema que escreve `.note-card > div:nth-child(2)` quebra na
primeira vez que aquele componente mudar, e aí ou o aplicativo congela o HTML
para sempre ou quebra todos os temas de uma vez. Variável sobrevive a
redesenho.

O jeito mais rápido de começar é **Exportar tema atual** no próprio aplicativo:
ele gera um `theme.css` com todas as variáveis já preenchidas com os valores do
tema que você está usando. Aí é só mudar as cores.

### O `manifest.json`

```json
{
  "name": "Nord",
  "version": "1.0.0",
  "author": "seu-usuario",
  "base": "midnight",
  "appearance": "dark",
  "description": "Uma frase sobre o tema."
}
```

O **`base`** é o tema embutido que preenche o que o seu não declarar. Por causa
dele um tema pode ter seis linhas em vez de setenta.

### A entrada no `index.json`

```json
{
  "id": "nord",
  "name": "Nord",
  "author": "seu-usuario",
  "version": "1.0.0",
  "appearance": "dark",
  "base": "midnight",
  "description": "Uma frase sobre o tema.",
  "colors": {
    "bg": "#373f4f",
    "sidebar": "#2e3440",
    "accent": "#88c0d0",
    "text": "#eceff4"
  }
}
```

O `colors` é a miniatura mostrada no catálogo. Fica no índice de propósito: sem
ele, desenhar a lista exigiria baixar o CSS de todos os temas.

## Atualizar um tema já publicado

Suba o `version` no `manifest.json` **e** no `index.json`. O aplicativo compara
os dois e oferece "Atualizar" para quem já tem instalado.

## Licença

Cada tema é de quem o escreveu. Ao enviar, você concorda em distribuí-lo sob a
licença deste repositório.
