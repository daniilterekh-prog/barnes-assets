# Узлы первой степени — «Курортная»

Референс: [Курортная](https://daniilterekh-prog.github.io/barn-estate-homepage-clone/kurortnaya/). Все HTML/CSS и карточки пересобраны 12.10.2026 по commit `9b83c5d6b3858df52fe27da7b1b8ba18a2210459`. [Сводка дня](../../../docs/2026-10-12-first-degree-sync.md).

[Каталог превью](catalog.html) · [Сборка](index.html) · [UI-контракт](../../../ui-kit/first-degree.md) · [Манифест](manifest.json).

## Состав

15 блоков: header, sticky-nav, hero, start-sales, map, listing, brand-intro, cta-central, directions, news, faq, cta-bottom, footer, floating-expert, request-modal.

Дополнительно: card-start-sales, card-project, card-lot. Прежние пути `blocks/cards/{start-sales,listing-project,listing-lot}` также обновлены: актуальный HTML, общее оформление и ссылки на канонические карточки без копирования изображений.

В каждой папке: fragment.html, mobile.html, styles.css, block.json, README.md, index.html. Общая папка `_shared` обязательна: CSS, runtime, карусель и 47 используемых локальных ассетов. Их происхождение записано в asset-manifest.json. Дополнительные папки `quick-filter-dropdowns`, `filters-modal` и `map/panel` содержат общий UI фильтров и полной карты.

Для общего хедера body должен иметь класс barnes-header-template; подключай owner-header.css после старых page-local CSS. Встроенные превью уже используют этот шаблон. Направления в Курортной намеренно отсутствуют, якоря остаются курортными.

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

Чтобы использовать именно утверждённые dropdown/modal/map, а не собственный `onFilter`, передай `{referenceFilters:true}` в каждый `mountNode`. После монтажа блоков один раз вызови `bootReferenceFilters()` из `_shared/reference-filters.js`. Копируй также `filters-modal`, `quick-filter-dropdowns`, `map/panel`: загрузчик использует их относительные пути. Не подключай повторно `listing-mode.js` к уже собранному `fragment.html`. Превью используют этот режим; поиск и отправка форм всё равно требуют API хоста.

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

`node tools/capture-first-degree.cjs SITE_CHECKOUT http://127.0.0.1:8769/` снимает DOM и замеры текущего локального сайта. Затем `python3 tools/export-first-degree.py SITE_CHECKOUT SOURCE_COMMIT` пересобирает все фрагменты, CSS, карточки по обоим путям и манифесты. Ручные runtime/library.css сохраняются. `node tools/verify-first-degree.cjs http://127.0.0.1:8770/` проверяет сборку и отдельные блоки, сохраняя [отчёт](../../../ui-kit/first-degree-verification-2026-10-12.json). Команды запускаются из корня barnes-assets с HTTP-серверами сайта и библиотеки.
