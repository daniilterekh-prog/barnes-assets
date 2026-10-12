# InlineFilterRow

Строка фильтров каталога с нижними линиями.

Дополнительные подборки: два независимых нативных checkbox «Выбор BARNES» / «Эксклюзив BARNES» в подписанном fieldset, 17px (wide19px) / weight300, ink #4F4D49. Box20px, radius1px, border #767470, checked/focus/hover только #8B1D25, focus offset3px; label minheight44px, gap10px. Строка переносится на mobile, без растягивания. Общий state `brandFlags=['selection','exclusive']`; одновременный выбор — OR. Переносимый компонент: `blocks/nodes/first-degree/quick-filter-dropdowns/brand-filters.js/css`. Отсутствие брендовых данных отмечается явно, не подменяется выдуманными признаками.

Chevron полей и сортировки на всех ширинах: 10×10px, две границы 1px #4F4D49, rotate(45deg). Старый SVG-background select отключён; используется один CSS-chevron без дублирования.

- Текст `17px` desktop/mobile, `19px` wide от 1441px, weight `300`, цвет `#4F4D49`.
- Приглушённый текст `#656462`, линия `#E4E4E4`, активный бордовый `#8B1D25`.
- Локация, стоимость и спальни равной длины; стрелка не перекрывает текст.
- Focus/hover только бордовые, без золотого контура.
- На mobile локация сверху, стоимость/спальни рядом, затем фильтры слева и сортировка справа; горизонтальной прокрутки нет. Размер/цвет/толщина chevron у сортировки такие же, как у полей.
- Актуальное превью: `blocks/nodes/first-degree/listing/`, полный контракт: [FirstDegreeNode](../first-degree.md).
