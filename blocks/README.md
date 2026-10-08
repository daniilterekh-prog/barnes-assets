# BARNES — библиотека блоков собственников

[Открыть визуальный каталог](https://daniilterekh-prog.github.io/barnes-assets/blocks/) · [UI Kit](../ui-kit/owners.md)

Каноническая библиотека — этот репозиторий. Источники аренды и продажи остаются в отдельных папках barn-estate-homepage-clone. Здесь 16 типов блоков, 30 вариантов, каждый с самостоятельным index.html, fragment.html, styles.css, block.json и README.md.

Также доступны [13 блоков амбассадоров / partners](partners/README.md). Их адаптеры находятся в `_shared/partners/`: используйте инструкции выбранной коллекции, не смешивайте API runtime собственников и амбассадоров.

## Каталог

| Блок | Аренда | Продажа |
| --- | --- | --- |
| BARNES / Москва | [rent](brand/rent/README.md) | [sale](brand/sale/README.md) |
| Центральная форма с экспертом | [rent](consultation-central/rent/README.md) | [sale](consultation-central/sale/README.md) |
| Нижний CTA с круглым портретом | — | [sale](consultation-expert/sale/README.md) |
| Плавающий эксперт | [rent](floating-expert/rent/README.md) | [sale](floating-expert/sale/README.md) |
| Футер | [rent](footer/rent/README.md) | [sale](footer/sale/README.md) |
| Главный хедер | [rent](header/rent/README.md) | [sale](header/sale/README.md) |
| Первый экран | [rent](hero/rent/README.md) | [sale](hero/sale/README.md) |
| Эксклюзив / этапы продажи | [rent](mechanics/rent/README.md) | [sale](mechanics/sale/README.md) |
| Подписка на материалы | [rent](newsletter/rent/README.md) | [sale](newsletter/sale/README.md) |
| Стратегия презентации | [rent](presentation/rent/README.md) | [sale](presentation/sale/README.md) |
| Перелинковка с изображениями | [rent](property-links/rent/README.md) | [sale](property-links/sale/README.md) |
| Всплывающая форма с Русланом | [rent](request-modal/rent/README.md) | [sale](request-modal/sale/README.md) |
| Якорная навигация | [rent](sticky-nav/rent/README.md) | [sale](sticky-nav/sale/README.md) |
| Индивидуальная стратегия продажи | — | [sale](strategy/sale/README.md) |
| Единая команда BARNES | [rent](team/rent/README.md) | [sale](team/sale/README.md) |
| Почему собственники выбирают BARNES | [rent](why-barnes/rent/README.md) | [sale](why-barnes/sale/README.md) |

## Подключение

```html
<link rel="stylesheet" href="/library/blocks/_shared/base.css">
<link rel="stylesheet" href="/library/blocks/team/sale/styles.css">
<!-- Вставьте fragment.html нужного варианта, исправив asset URL. -->
<script type="module">
import { initBlock } from "/library/blocks/_shared/runtime.js";
initBlock(document.querySelector("[data-barnes-block=team]"), {
  onRequest: ({variant}) => window.openCurrentRequestForm({variant}),
  onSubmit: async ({data}) => {
    // Подключите существующий API и возвращайте реальный результат.
    throw new Error("API не подключён");
  }
});
</script>
```

Пути `_assets` в оригинальных фрагментах относительны папке варианта. При вставке на другую страницу их обязательно перебазировать. initBlock запускается после гидратации SPA, возвращает cleanup-функцию. Старые формы и страницу целиком подключать не нужно.

`_shared/runtime.js` — изолированные vanilla JS-адаптеры; `onRequest` и отменяемое событие `barnes:request` связывают текущую форму сайта. Отправка без `onSubmit` отключена и явно помечена. Не переносите тестовый/фиктивный success.

### Что менять на новой странице

Тексты, изображения, ссылки, эксперт, CTA, якоря и число карточек — данные. Типографика, контейнеры, radius, gap и состояния — компонентный контракт. Карточки аренды и продажи не смешивать. Header/footer требуют адаптации навигации, sticky — секций назначения. Данные форм и legal URLs проходят отдельную проверку.

### Версионность

Источник и commit сохранены в каждом block.json; ассеты названы по хэшу, поэтому одинаковые файлы не дублируются. Генератор tools/export-owner-blocks.cjs воспроизводит извлечение rendered DOM/CSS; последующие portable-правки документированы в git. Экспорт не является двусторонней синхронизацией: страницы не начнут меняться от изменений библиотеки. Проверка — verification.json.
