# BARNES UI kit

**Курортная1.1.0 ·01.11.2026:** [сегодняшний кит главной с явными исключениями H1 hero и FAQ](first-degree.md), [изменения](../docs/2026-11-01-resort-kit.md), [проверки](resort-2026-11-01/). Это уточнение узла, не замена всех исторических вариантов.

Общая визуальная система и утверждённые варианты блоков. Источник сохранённого состояния — этот GitHub-репозиторий; локальные файлы только checkout.

- [Узлы первой степени / «Курортная»](first-degree.md): [замеры](first-degree-measurements.json), [15 блоков + 3 карточки](../blocks/nodes/first-degree/catalog.html).
- [Единый хэдер собственников](components/owner-header.md) — общий шаблон, в Курортной без направлений.

- [Базовый reference-ui](reference-ui.md) — снимок общего кита сайта, с привязкой к источнику в начале файла.
- [Амбассадоры: дополнение и варианты](partners.md) — новые правила и точные исключения.
- [CSS-токены](partners-tokens.css) — именованные значения для новых интеграций, не глобальная замена CSS действующего сайта.
- [JSON-токены](partners-tokens.json) — машинное чтение размеров, цветов и поведения.
- [Каталог блоков](../blocks/partners/index.html) — визуальные превью.
- [Собственники: спецификация](owners.md) и [токены](tokens.css).
- [Компонентные токены каталога и карточек](component-tokens.css).
- Контракты: [ContactAction](components/contact-action.md), [LaunchCard](components/launch-card.md), [ListingCard](components/listing-card.md), [CardActionCompact](components/card-action-compact.md), [InlineFilterRow](components/inline-filter-row.md), [FloatingExpert](components/floating-expert.md).
- Самостоятельные карточки: [старты продаж](../blocks/cards/start-sales/), [ЖК](../blocks/cards/listing-project/), [лоты](../blocks/cards/listing-lot/).
- [Визуальное превью кита собственников](https://daniilterekh-prog.github.io/barnes-assets/ui-kit/) · [библиотека собственников](../blocks/README.md).

При расхождении базового кита и более позднего варианта применяйте уточнение только к указанному компоненту. Compact ContactSelector **не меняет** высоту обычных ActionButton. Контент амбассадорской программы не становится общим правилом бренда.

Текущий агентский логотип: [BARN Estate](../brand/barn-estate/README.md), источник — barn-estate.ru, 20.10.2026. Новые страницы используют его вместо BARNES Moscow / International Realty.

- [Фильтры Курортной1.3.0 по общему каталогу](resort-2026-11-02/catalog-filters.md),02.11.2026; заменяют прежнюю линейную панель и dark-modal только в этом узле.

- [Курортная03.11: крошки в hero, без строки направлений под линией](resort-2026-11-03/README.md): обновлены header/hero1.3.1 и проверки адаптива/переноса.

- [Курортная: актуальные фильтры общей выдачи без аренды,1.4.0](resort-2026-11-03/current-catalog-filters.md).
