# Общие подробные фильтры Курортной

Дополнение: `BarnesFilters.patch(fields)` обновляет применённый state при закрытом modal и отправляет `barnes:filters-apply`. Используется [быстрыми dropdown](../quick-filter-dropdowns/README.md). Неизвестные расширения state сохраняются при обычном apply (например `bedrooms`), но общий reset+apply очищает их. `barnes:filters-open` закрывает открытый быстрый popover. Черновик checkbox-полей при apply полностью заменяет предыдущий выбор, включая пустые массивы.

Источник: https://front.barnes.vsavr.ru/kurortnaya/, 12.10.2026. Согласованная адаптация — направления Сочи/Анапа/Алтай/Архыз вместо московских районов. Прочие группы и исходная структура сохранены.

Скопируй папку целиком, подключи `../_shared/source.css` и базовый Tilda Sans. Затем обычные scripts последовательно: `filters-template.js`, `filters-modal.js`. Скрипт подключит соседний CSS. Общий `source.css` с `data-v-*` обязателен: не удаляй scoped-атрибуты шаблона.

Точки входа (делегирование кликов, поддерживает поздний mount): `.catalog-hero-filters__filter-icon`, `.catalog-mode-detailed-filters`, `.map-browser__filter-toggle`. Дополнительный программный вход — `window.BarnesFilters.open(button)`. Единственное окно; состояние общее. `getState()` возвращает копию, `document` событие `barnes:filters-apply` передаёт данные для адаптера каталога.

Ключи: `propertyTypes`, `priceRanges`, `directions` и checkbox-флаги `finishing`, `lift`, `trophy` — массивы значений; `priceMin/Max`, `areaMin/Max`, `roomsMin/Max` — нормализованные цифровые строки либо пустая строка. При закрытии черновик отменяется, при сбросе очищается, применение сохраняет до перезагрузки. Проверяются цифры и порядок границ.

**Это UI, не API каталога.** Полные данные лотов/комнат/отделки не выдумываются; сам компонент не меняет выдачу и не имитирует успешный серверный запрос. Для рабочей фильтрации подключи адаптер события. Карта по-прежнему статичная подложка.

Desktop 640 px, max-height min(952 px, viewport−48 px), #292929, header 24 px, группы 18 px, чипы/инпуты 14 px, footer 16 px. Mobile ≤540 — весь экран, фиксированные header/footer, внутренний scroll. Hover только бордо #8B1D25; основные selected-state сохранены по исходнику. Фокус замкнут внутри активного диалога и возвращается к кнопке; Escape не закрывает карту под фильтрами, inert/scroll восстанавливаются.

Проверки в репозитории страницы: `scripts/verify-kurort-filters.cjs` и регрессия `scripts/verify-kurort-map.cjs`, 390/1440/2560. Пакеты не установлены.
