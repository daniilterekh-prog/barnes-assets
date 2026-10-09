# BARNES UI kit

Общая визуальная система и утверждённые варианты блоков. Источник сохранённого состояния — этот GitHub-репозиторий; локальные файлы только checkout.

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
