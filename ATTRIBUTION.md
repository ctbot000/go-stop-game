# Attribution

## Card artwork

The 48 card faces in [`assets/cards/`](assets/cards) are **not** original to this
project. They are the Korean hwatu (화투) set drawn by **Louie Mantia** and
published on Wikimedia Commons:

- Source: <https://commons.wikimedia.org/wiki/Category:SVG_Hwatu>
- Author: Louie Mantia
- License: **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**

The files are used **unmodified** except for two mechanical changes that do not
touch the artwork:

1. renamed to this project's card ids (for example
   `Hwatu January Hikari.svg` → `m01-gwang.svg`), and
2. whitespace between XML tags collapsed.

The month number and the 고 / 열 / 쌍 / 단 marks you see on a card in the game
are **not** part of these files. They are drawn over the image by
[`js/art.js`](js/art.js) and [`css/style.css`](css/style.css) as play aids.

Anyone redistributing the images, with or without changes, must keep this
attribution and license them under CC BY-SA 4.0 or a compatible license.

## Everything else

All source code, the card back, the page design and the rules engine are
original to this project and are licensed under the MIT License — see
[LICENSE](LICENSE).
