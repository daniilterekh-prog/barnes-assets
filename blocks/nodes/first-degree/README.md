# Узлы первой степени — «Курортная»

Референс 1.0.0: [Курортная](https://daniilterekh-prog.github.io/barn-estate-homepage-clone/kurortnaya/), commit `dacc3ab943a1dd8167188300592c683b35d16b06`.

[Каталог превью](catalog.html) · [Сборка](index.html) · [UI-контракт](../../../ui-kit/first-degree.md) · [Манифест](manifest.json).

## Состав

15 блоков: header, sticky-nav, hero, start-sales, map, listing, brand-intro, cta-central, directions, news, faq, cta-bottom, footer, floating-expert, request-modal.

Дополнительно: card-start-sales, card-project, card-lot. Старые `blocks/cards/*` сохранены отдельно.

В каждой папке: fragment.html, mobile.html, styles.css, block.json, README.md, index.html. Общая папка `_shared` обязательна: CSS, runtime, карусель и 34 локальных изображения/шрифта. Их происхождение записано в asset-manifest.json.

## Подключение

Копируй нужные папки вместе с `_shared`, сохраняя структуру. Открывай через HTTP: ES modules/fetch не поддерживают file://.

```html
<link rel="stylesheet" href="/barnes/first-degree/listing/styles.css">
<div id="catalog-slot"></div>
<script type="module">
import { mountNode } from '/barnes/first-degree/_shared/runtime.js';
const cleanup = await mountNode(
  document.querySelector('#catalog-slot'), '/barnes/first-degree/listing/', {
    onFilter: ({key, trigger, root}) => openYourFilter({key, trigger, root}),
    onSort: ({value, root}) => sortYourCatalog(value, root),
    onRequest: ({trigger}) => openYourRequestForm(trigger),
  }
);
// При удалении блока вызови cleanup().
</script>
```

Для start-sales подключи `_shared/start-sales.js` один раз после mount. В превью это автоматизировано. Это vanilla JS-карусель исходной страницы, установка Splide/Vue не требуется.

До 540 px mount выбирает mobile.html, выше — fragment.html. При переходе через 540 px приложение должно вызвать cleanup и mount заново. Для статической вставки перебазируй src самостоятельно; mount делает это за тебя. CSS подключается отдельно.

Сохраняй классы и data-v-* — scoped CSS от них зависит. Это проверенный экспорт, не новая изолированная дизайн-система. Для стороннего сайта используй iframe/отдельный документ; на BARNES-страницах подключай общий CSS один раз. Не переносить старый JS страницы целиком.

## Интеграционные точки

- onSubmit({data,form,root}) — настоящий API. Без него данные **не отправляются**, превью явно сообщает об этом.
- onRequest({trigger,root}) — существующий попап; без callback открывается экспортированный request-modal с focus trap и возвратом фокуса.
- onFilter/onSort/onSearch — параметры, поиск и данные каталога. Демонстрационный dialog не заменяет бизнес-фильтрацию.
- onMap({element,root}) — карта и объекты. Тайлы, runtime Yandex, ключи API и счётчики намеренно не экспортированы: сохранены контейнер, контролы и подписанная заглушка.
- onMenu — глобальное меню. Хэдер сохранён визуально, навигация подключается сайтом.
- Всплывающие события barnes:favorite/mode/filter/sort/search/submit — дополнительный интерфейс интеграции.

Листинг содержит один ЖК и один лот как образцы. Заменяй тексты, ссылки карточек/новостей/мессенджеров, телефоны, изображения, данные эксперта и якоря под новый узел. Исторические ссылки не являются роутером нового сайта.

## Проверка

Сборка проверяется на 390/768/1366/1920/2560 px; замеры с селекторами — [first-degree-measurements.json](../../../ui-kit/first-degree-measurements.json). Визуальное превью не подтверждает работу API/карты.

tools/export-first-degree.py пересобирает файлы из reviewed desktop/mobile DOM-снимков и карточек в .playwright-mcp исходного checkout. Это не краулер: для обновления нужны новые снимки. Handwritten runtime/library.css сохраняются.
