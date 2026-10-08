# BARNES: блоки страницы амбассадоров

Каноническая библиотека: `daniilterekh-prog/barnes-assets`. Вариант `partners` хранится рядом с вариантами `rent`/`sale`, не заменяет их. Код и ассеты доступны в GitHub; работающая исходная страница не является зависимостью шаблонов.

[Каталог превью](index.html) · [Машиночитаемый каталог](catalog.json) · [Дополнение UI-кита](../../ui-kit/partners.md)

## Где искать

| Блок | Папка |
|---|---|
| Главный хедер / меню | [header/partners](../header/partners/) |
| Второй хедер / якоря | [sticky-nav/partners](../sticky-nav/partners/) |
| Hero / хлебные крошки | [hero/partners](../hero/partners/) |
| Условия / hover-карточки | [conditions/partners](../conditions/partners/) |
| Скроллинг этапов | [mechanics/partners](../mechanics/partners/) |
| Направления / переключаемые показатели | [directions/partners](../directions/partners/) |
| Преимущества / карусель | [advantages/partners](../advantages/partners/) |
| Контактный CTA с экспертом | [consultation-expert/partners](../consultation-expert/partners/) |
| Аккордеон FAQ | [faq/partners](../faq/partners/) |
| Подписка | [newsletter/partners](../newsletter/partners/) |
| Футер | [footer/partners](../footer/partners/) |
| Плавающий эксперт | [floating-expert/partners](../floating-expert/partners/) |
| Модальная форма | [request-modal/partners](../request-modal/partners/) |

В каждой папке: `fragment.html` — переносимая разметка; `styles.css` — scoped-стили; `index.html` — самостоятельное превью; `block.json` — источник, версия и зависимости; `README.md` — инструкция. `catalog.json` хранит точный SHA исходной страницы и перечень ассетов. Версия `1.0.0` означает извлечённый reference, а не React/Vue/npm-компонент.

## Как забрать один блок

1. Скачайте нужную папку `blocks/<блок>/partners/`, `blocks/_shared/partners/` и используемые файлы из `blocks/_assets/partners/`. Все ресурсы локальные; Nuxt/Splide и исходный `for-partners.js` не нужны. По `catalog.json` можно найти происхождение любого ассета.
2. Сохраните структуру директорий или исправьте относительные `src`, CSS `url()` и импорты. Ассеты общие, дедуплицированы по SHA; не требуется копировать весь репозиторий.
3. Вставьте содержимое `fragment.html` в целевую страницу. Подключите общий `base.css` **один раз** и `styles.css` каждого используемого блока. Сохраните `.barnes-template`, `data-source-id`, классы и `data-v-*`: от них зависят scoped-правила.
4. Инициализируйте каждый корень после вставки в DOM:

```js
import {initBlock} from './blocks/_shared/partners/runtime.js';
const modalRoot = document.querySelector('[data-barnes-block="request-modal"]');
const modal = initBlock(modalRoot, {
  onSubmit: async (formData) => {
    // Здесь ваш проверенный backend; не имитируйте успех без доставки.
    const response = await fetch('/your-api/requests', {method:'POST', body:formData});
    if (!response.ok) throw new Error('Delivery failed');
    return {message:'Заявка отправлена.'};
  }
});
document.querySelectorAll('[data-barnes-block]').forEach(root => {
  if (root === modalRoot) return;
  initBlock(root, {onRequest: detail => modal.open(detail)});
});
```

Пример endpoint — заглушка для интеграции, не существующий сервис BARNES. Если `onSubmit` не передан, данные не отправляются и интерфейс сообщает об этом. `preview:true` запрещает отправку даже при переданном callback. `onRequest` получает intent либо `{directionId,directionName}`. Не передавайте чужие контакты без согласия.

Для SPA используйте возвращаемый `api.destroy()` при размонтировании. Один корень повторно не инициализируется. ID и ARIA-ссылки уникализируются, CSS использует исходные `data-source-id`; два экземпляра одного блока можно вставить на одну страницу. Настройки/селекторы других библиотек должны использовать собственный root, а не глобальный document.

## Что нужно адаптировать

- Тексты, число карточек, фото, эксперт, телефоны, правовые ссылки и названия CTA — не универсальные данные. Особенно комиссии, бюджеты и условия закрепления клиента.
- В направлениях редактируйте JSON `data-block-content`; поля `metrics` и `facts` взаимоисключающие, `image` должен содержать корректный путь к фото. Не меняйте фиксированную сетку произвольно: проверяйте высоты всех категорий.
- Глобальный хедер и футер содержат исходную навигацию BARNES. Ссылки надо проверить для целевого сайта. В hero — один H1; на целевой странице не дублировать его.
- Второй хедер требует реальных секций назначения и `options.hero` в production. Превью показывает его постоянно, чтобы можно было увидеть дизайн.
- `request-modal` и `floating-expert` — overlay-компоненты; ставьте их близко к концу body, вне предков с transform/overflow, способных создать новый containing block.
- Generated-изображения являются иллюстрациями, не фотографиями конкретных объектов или доказательством мероприятия. Портрет Игоря предоставлен пользователем; перед переносом на другие проекты подтвердите право использования.
- Формы: подключить доставку, обработку ошибок, согласие и уведомление; шаблоны не обещают работающую CRM. Подписка также требует отдельной интеграции.

## Проверка перед публикацией

320/390/768/1024/1440/1920px, Tab/Enter/Escape, hover/touch, reduced-motion, загрузка фото/шрифтов, отсутствие обрезки и горизонтальной прокрутки. Для направлений — все семь состояний, для карусели — все десять карточек. После изменения контента повторить проверку, не считать прошлый audit доказательством новой версии.

## Обновление библиотеки

Экспортёр `tools/export-partner-blocks.cjs` читает чистый checkout источника и запущенный localhost, снимает отрендеренную разметку и совпадающие CSS-правила, копирует только нужные бинарные ассеты, текст применяет через `apply_patch`. Исправления адаптеров runtime проверяйте после повторного экспорта.

```sh
SOURCE_ROOT=/path/to/barn-estate-homepage-clone SOURCE_ORIGIN=http://127.0.0.1:4183 \
TMPDIR=/short/writable/temp NODE_PATH=/path/to/node_modules \
node tools/export-partner-blocks.cjs --apply
```

Исходная страница не переписывается. Новая версия библиотеки требует проверки, changelog и push в канонический GitHub.
