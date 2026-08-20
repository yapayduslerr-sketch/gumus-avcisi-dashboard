# Gümüş Avcısı X Pro — Veri Sağlayıcı Adapter Mimarisi

## İlke

İstemci uygulaması hiçbir sağlayıcıya, erişim anahtarına veya sağlayıcıya özgü yanıt biçimine doğrudan bağlanmaz. Akış **arayüz → uygulama/API katmanı → provider adapter → sağlayıcı** biçimindedir. Anahtarlar yalnızca sunucu tarafı ortam değişkenlerinde tutulur.

## Kayıt Sistemi

| Sağlayıcı | Mod | Durum | Gerekli sunucu değişkenleri |
|---|---|---|---|
| `mock` | `DEMO` | Varsayılan ve her zaman erişilebilir | Yok |
| `forinvest` | `LIVE` | Sözleşme ve erişim bekliyor | `FORINVEST_API_BASE_URL`, `FORINVEST_API_KEY`, `FORINVEST_AUTH_HEADER_NAME` |
| `dxfeed` | `LIVE` | Sözleşme ve erişim bekliyor | `DXFEED_API_BASE_URL`, `DXFEED_API_KEY`, `DXFEED_AUTH_HEADER_NAME` |

`XPRO_DATA_PROVIDER` ile istenen sağlayıcı çalışır durumda değilse kayıt sistemi otomatik olarak `mock` sağlayıcısına döner ve bu geçişi istemciye durum alanıyla bildirir. Böylece eksik erişim nedeniyle sayfa çökmez.

## Demo Sınırı

> **DEMO / SENTETİK — CANLI VERİ BAĞLI DEĞİL.** Demo senaryoları, gerçek BIST fiyatı, hacmi, KAP bildirimi, şirket sonucu veya yatırım fırsatı değildir.

Demo kayıtlarında `dataMode: DEMO`, ayrı bir üretim zamanı ve boş/ayrıştırılmış kaynak URL alanı zorunludur. Canlı sağlayıcı bağlandığında `dataMode: LIVE`, kaynak URL’si, gözlem zamanı, gecikme ve veri kalitesi alanları zorunlu olacaktır.

## Canlıya Geçiş

Sağlayıcı erişimi geldiğinde yalnızca seçili adapter tamamlanır. Sağlayıcının OHLCV endpointi, tarihçesi, kurumsal eylem/split düzenlemesi, sembol eşlemesi, gecikme rejimi, sağlık yolu ve webde yeniden gösterim izni yazılı olarak doğrulanmadan canlı moda geçilmez.

