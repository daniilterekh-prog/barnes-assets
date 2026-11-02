# Быстрые фильтры Курортной ·1.3.0,02.11.2026

Оформление и компоновка — по общему каталогу `katalog-nedvizhimosti/?direction=international`; значения курортные. Desktop: департамент/рынок/поиск и локация/стоимость/все фильтры. До768px четыре поля2×2 и поиск с иконкой. Полный контракт — [UI-kit](../../../../ui-kit/first-degree.md).

`quick-filters.js` — общий белый popover для локации/типа/цены/спален, департамента и сортировки, также select-полей карты. Tilda Sans18/400, target44px, выбранное#f9f3f3/#8b1d25. Один dialog/listbox, Arrow/Home/End/Enter/Space, Escape/внешний клик и возврат фокуса. Native select — адаптер состояния; обработчики пересоздаются после монтажа фрагмента, захваченные атрибуты не подменяют слушателей.

Общий state: BarnesFilters.patch/getState/reset; события barnes:filters-apply/open. `directions`/`propertyTypes`/`priceRanges` — массивы; спальни — строка1/2/3/4+ либо пустая. «Сочи/Анапа/Алтай/Архыз» и apartment/flat/new_build/penthouse сохранены. Выбор другого департамента открывает общий каталог через отменяемое barnes:department.

`brand-filters.js` подключается после BarnesFilters, создаёт независимые checkbox selection/exclusive для BARN Estate, синхронизирует листинг и карту. Desktop — над итоговой строкой, mobile — под картой/сортировкой. Сброс снимает условия, сохраняет обязательный market. Два рынка никогда не смешиваются.

Подключай `_shared/catalog-filters.js/css`, `_shared/runtime.js` и `_shared/reference-filters.js` через referenceFilters:true, как в [инструкции](../README.md). Не запускай listing-mode.js поверх готового fragment.html. Метаданные snapshot неполные: API каталога отдельно; неизвестные типы/спальни/подборки не выдумываются. Новых библиотек нет.
