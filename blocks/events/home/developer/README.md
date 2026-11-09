# Мероприятия — пакет для разработчика

Версия оформления 1.1.1, упаковка 09.11.2026. Обычные HTML, CSS и JavaScript; сборка, npm и фреймворк для подключения не нужны.

| Файлы | Назначение |
| --- | --- |
| [html/events.html](html/events.html) | Только разметка секции для вставки на главную |
| [css/events.css](css/events.css) | Стили секции и адаптив |
| [js/events.js](js/events.js) | Только логика слайдера, без копии HTML |
| [images/](images/) | Шесть фотографий мероприятий |
| [fonts/](fonts/) и [css/fonts.css](css/fonts.css) | Локальные Tilda Sans Light и Regular |
| [index.html](index.html) | Готовый пример подключения |
| [css/preview.css](css/preview.css) | Только сброс отступа страницы примера |

## Подключение

1. Вставить содержимое `html/events.html` на главную перед новостями, один экземпляр секции.
2. Скопировать `css/`, `js/`, `images/` и `fonts/` в выбранный каталог сайта.
3. Подключить файлы, заменив пример пути `/components/home-events/` своим:

```html
<link rel="stylesheet" href="/components/home-events/css/fonts.css">
<link rel="stylesheet" href="/components/home-events/css/events.css">
<script src="/components/home-events/js/events.js" defer></script>
```

Если Tilda Sans Light 300 и Regular 400 уже подключены, `fonts.css` не нужен. Пути в CSS к шрифтам относительны самому CSS. Пути `images/…` в HTML относительны **странице, в которую вставляется секция**, а не папке `html/`: при переносе заменить их на `/components/home-events/images/…`. `index.html` показывает готовый вариант, работающий из корня пакета. `preview.css` на основной сайт не подключать.

В Vue/Nuxt/React вставить секцию средствами проекта и вызвать `window.BarnEstateEvents.initAll()` после монтирования. Старый адаптер главной и генерацию разметки из JS переносить не требуется. Инициализация повторно не добавляет обработчики к существующей секции.

Шесть событий: две карточки на компьютере, одна до 768 px. Стрелки слева, «Все мероприятия» справа; свайп, клавиши ←/→ и Home/End, reduced-motion и доступность сохранены. Подчёркивание ссылок постоянно видно. Без JS доступна горизонтальная прокрутка, кнопки скрыты.

Архив ведёт на `/media/meropriyatiya/`, отчёты — на barn-estate.ru. Проверить маршруты при установке. Для добавления события менять HTML: ссылку, изображение/alt/размеры, дату datetime и подпись, заголовок/aria-label. Число карточек JS определяет автоматически.

Локальный просмотр: `python3 -m http.server 8080` из корня пакета → `http://localhost:8080/`.

[Скачать весь пакет ZIP](https://github.com/daniilterekh-prog/barnes-assets/raw/refs/heads/main/blocks/events/home/home-events-developer.zip).

Источник: [блок встреч амбассадоров](https://daniilterekh-prog.github.io/barn-estate-homepage-clone/for-partners/#partner-community), текущие новости главной и UI-кит 1.0.6. Контент и фото — официальный каталог мероприятий BARN Estate. Карусель использует нативный scroll-snap; сторонних библиотек нет. [Метаданные и происхождение фото](https://github.com/daniilterekh-prog/barnes-assets/blob/main/blocks/events/home/content.json).
