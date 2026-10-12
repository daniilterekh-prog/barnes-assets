# Новый одобренный десктопный фон — 12.10.2026

`hero-alpine-natural-desktop.webp`,1664×936 (16:9), WebP quality92 без апскейла. Источник — новый вариант террасы с простой архитектурой, одобренный пользователем после отдельного превью. Создан встроенным imagegen, не CLI/API. Это сгенерированное изображение в фотографической стилистике, не документальная фотография реального объекта.

В десктопе≥541px заменяет прежнюю альпийскую сцену. Mobile≤540px использует прежний `hero-alpine-mobile.webp`, файл не изменяется. Затемнение примерно20% задано непосредственно при коррекции десктопного файла, дополнительного CSS-слоя нет. Сохраняется общий исходный градиент для белого текста. Высота/типографика/фильтры не меняются.

Исходный промпт: новая премиальная горная терраса16:9; фотографическая оптика35mm, естественный свет и атмосферная перспектива, правдоподобная геология, нерегулярный лес, простые прямые стеклянные панели и корректная строительная геометрия. Узкая часть шале справа; без мебели, фонарей, кашпо, людей, надписей, CGI/HDR и чрезмерной резкости.

Финальный промпт коррекции: “Edit the supplied APPROVED photograph only by applying a very mild global 20% darkening, as if baking a black layer at alpha 0.20 into the image (displayed sRGB channels multiplied by 0.8). Preserve exactly the same scene, framing, camera angle, aspect ratio 16:9, mountain ridge, sky, trees, chalet wall and roof, straight glass balustrade and tile joints. Do NOT reimagine or redraw architecture, do NOT add details, furniture, planters or people, do NOT introduce artifacts. No new scene. No vignette, gradient, dramatic grading, crush of shadows or oversharpening. Keep the subtle photographic texture and coherent construction geometry of this exact approved image; only modestly reduce brightness for white website hero text. No text, logos or watermark.”

Проверка: `scripts/verify-kurort-hero-images.cjs`,320/390/540/541/768/1440/1920/2560px; currentSrc,16:9, неизменный портрет mobile, отсутствие лишнего слоя/overflow/JS-ошибок.
