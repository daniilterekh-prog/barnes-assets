# Выпадающие быстрые фильтры Курортной

Источник белого dropdown: https://front.barnes.vsavr.ru/kurortnaya/, 12.10.2026. В исходнике type/price/area; в утверждённом узле сохраняем наши поля location/price/bedrooms. Локация: Сочи/Анапа/Алтай/Архыз. Цена: до50 / 50–100 / 100–200 / от200 млн ₽. Спальни: 1/2/3/более3. Есть снятие выбора.

Подключай `../_shared/source.css`, существующий listing-mode CSS/markup, затем scripts общей папки `../filters-modal/` и этот `quick-filters.js`. Последний сам загрузит соседний CSS. Требуются три `.catalog-mode-filters .catalog-quick-filters__button` с `.catalog-quick-filters__caption` и `window.BarnesFilters.patch/getState`. Повторный вызов не создаёт второй popup.

Выбор закрывает меню, обновляет текущую подпись и `aria-label`, общий state и событие `barnes:filters-apply`. `directions`/`priceRanges` — массивы; `bedrooms` — отдельная строка 1/2/3/4+ или пустая. Спальни не заменяют число комнат из исходного общего modal. Снятие/повторный выбор корректны; общий reset+apply очищает все поля. API выдачи не реализован, серверные filter-URL исходника не имитируются.

Markup/белая рамка/padding13/header13/700/options12px+minheight34 соответствуют исходному compact dropdown из source.css. Popup ≥220px, не шире viewport−32px; располагается около кнопки с переносом вверх при нехватке места. Button typography/SVG не меняются. Тень выключена, hover/selected только бордо #8B1D25. Один немодальный dialog с listbox/options и крестиком. Arrow/Home/End и Enter/Space, Escape/внешний клик, focus возврат. На scroll следует за кнопкой, вне viewport/resize закрывается.

Проверка: `scripts/verify-kurort-quick-filters.cjs` в репозитории страницы, 390/1440/2560; также регрессия общего modal и map. Новых зависимостей нет.
