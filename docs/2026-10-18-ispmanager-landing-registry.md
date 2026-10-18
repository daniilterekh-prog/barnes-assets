# Дополнение реестра лендингов из ISPmanager — 18.10.2026

Реестр: https://docs.google.com/spreadsheets/d/1PNBH1stjCI-V_GrMHIv4dZCcaeOdiNPevoHQoAQuRko/edit

В лист «Лендинги», диапазон A39:G53, добавлены все 15 сайтов, показанных в разделе «Сайты» открытого ISPmanager. Нумерация 38–52; всего в реестре 52 записи: 37 Тильда + 15 ISPmanager. Среди добавленных — 13 проектов и 2 каталога. Дубликатов доменов с существующими записями нет.

Для каждой записи сохранены название, HTTPS URL, платформа, корневой каталог и ссылка на управление. Заголовки B и E обобщены до «Проект / название» и «Раздел / размещение». Существующая нативная таблица BarnesLandings расширена до A1:G53 с сохранением оформления.

Названия 13 страниц проверены в Chrome. Maslak Koru и Taksim 360 присутствуют в ISPmanager, но HTTPS-навигация возвращает ERR_CERT_AUTHORITY_INVALID; защитные предупреждения не обходились. Названия этих двух проектов подтверждены каталогом turkish-property.ru. Состояние отмечено в примечаниях.

| № | Проект | URL | Примечание |
|---|---|---|---|
| 38 | Курортная недвижимость Алтая — каталог BARNES | https://altay-preperty.ru/ | Каталог проектов Алтая. |
| 39 | Алтын-Шор | https://altinshor-brns.ru/ |  |
| 40 | Babacan Meridian | https://babacan-meridian.com/ |  |
| 41 | Белогорье | https://belogorye-brns.ru/ |  |
| 42 | Бирюзовая Катунь | https://biruzovayakatun-brns.ru/ | Отдельный домен ISPmanager; в Тильде также есть biryuzovaya-katun.ru. |
| 43 | Bomonti Residences by Rotana | https://bomonti-brns.com/ |  |
| 44 | DAP Yeni Levent | https://dapyeni-brns.com/ |  |
| 45 | Galleria Park Residence | https://galleriapark-brns.ru/ |  |
| 46 | Карлуу | https://karluu-brns.ru/ |  |
| 47 | Кедры | https://kedry-brns.ru/ |  |
| 48 | La Mer Dragos | https://lamerdragos-brns.ru/ |  |
| 49 | Layan Verde | https://layanverde-brns.com/ |  |
| 50 | Maslak Koru | https://maslakkoru-brns.ru/ | 18.10.2026: Chrome не открывает HTTPS — ERR_CERT_AUTHORITY_INVALID. Название подтверждено в каталоге turkish-property.ru. |
| 51 | Taksim 360 | https://taksim360-brns.com/ | 18.10.2026: Chrome не открывает HTTPS — ERR_CERT_AUTHORITY_INVALID. Название подтверждено в каталоге turkish-property.ru. |
| 52 | Недвижимость в Стамбуле — каталог BARNES | https://turkish-property.ru/ | Каталог проектов Стамбула. |

Проверка: повторное чтение A39:G53 подтвердило точное совпадение всех 15 строк и 7 столбцов; диапазон нативной таблицы A1:G53 подтверждён ответом Google Sheets. Проверено отображение новых строк в браузере.

