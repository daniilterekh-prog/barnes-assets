# OwnerHeader / общий шаблон хедера

Курортная, мобильные действия: в херо телефонная иконка — прямой tel-звонок; звонок, логотип и бургер центрируются в grid44px/1fr/44px по одной оси. В sticky две независимые touch-зоны44px: список контактов и callback-form с каналом «Звонок». Блок actions не прокручивается, якоря прокручиваются отдельно. Реализация узла: [ui-kit-runtime.js](https://github.com/daniilterekh-prog/barn-estate-homepage-clone/blob/master/kurortnaya/ui-kit-runtime.js), регрессия `scripts/verify-kurort-mobile-header-actions.cjs` на320/390/540px. Desktop остаётся общим шаблоном.

Источник: prodazha_sobstvennikam, интеграция Курортной f00d7f7. Один CSS-шаблон shared/owner-header.css на сайте; переносимая копия blocks/nodes/first-degree/_shared/owner-header.css. Подключать после остальных CSS-слоёв, body.barnes-header-template.

Primary header: общий логотип, кнопка меню, поиск/каналы, одинаковые touch-зоны. В Курортной нет строки направлений (site-header--no-nav), у собственников она остаётся. На mobile поиск скрыт.

Sticky: якоря текущей страницы, логотип по центру, «Оставить заявку» и мессенджеры справа. Сетка и размеры одинаковы; тексты/ID якорей индивидуальные. Кнопка заявки 44px, 16px desktop / 15px до1024; mobile sticky 77px, 1920/2560 — 108.765625px. Нижний border 1px.

Проверено 390/768/1024/1366/1920/2560px — размеры и типографика top/logo/left/search/sticky/request совпадают с эталоном; см. [проверку](../owner-header-verification.json). Primary общая высота намеренно меньше без ряда направлений.

Mobile: scroll только в списке якорей; sticky overflow visible, чтобы панель контактов не обрезалась. Проверены раскрытие четырёх каналов, кликабельность панели, открытие попапа заявки. Не заменять это отдельным page-local хедером.
