# Aracı Kurum ve Platform Veri Erişimi Değerlendirmesi

**Güncelleme tarihi:** 20 Ağustos 2026  
**Amaç:** Gümüş Avcısı için BIST teknik tarama, tarihli OHLCV ve KAP kaynaklarını izinli, izlenebilir ve webde yeniden gösterime uygun bir veri katmanına bağlamak.

## Sonuç özeti

Kullanıcının kişisel yatırım hesabı, uygulama içi canlı fiyat izleme hakkı sağlayabilir; ancak bu hak tek başına fiyat-hacim verisini ayrı bir web uygulamasına aktarma veya yeniden yayımlama hakkı vermez. Bu nedenle kullanıcı oturumundan veri çekme, mobil/web istemcisini taklit etme, sayfa kazıma veya tersine mühendislik kapsam dışıdır.

| Kanal | Doğrulanmış durum | Gümüş Avcısı için karar |
|---|---|---|
| Finans Invest / QNB Invest | Resmî, dış geliştirici veri API’si bulunduğuna dair yayınlanmış doküman bu incelemede saptanmadı. Kuruma doğrudan sorulmalı. | Birinci iletişim adayı; yazılı API ve webde yeniden gösterim izni alınmadan adapter kurulmaz. |
| İş Bankası | İşCep/Borsa İşlem Platformu için BIST veri lisansı paketleri yayımlıyor; resmî sayfada verinin Forinvest tarafından sağlandığı yazıyor. API portalı üçüncü taraflar için mevcut ancak BIST OHLCV endpointi bu incelemede doğrulanmadı. | API Portal ve yatırım veri biriminden tarihli OHLCV + yeniden yayın izni istenmeli; kişisel veri paketi otomatik olarak yeterli kabul edilmez. |
| Midas | Resmî site BIST ürün ve gelişmiş analiz araçlarını doğruluyor; dış geliştirici için piyasa verisi API dokümanı saptanmadı. | Destek/kurumsal kanal üzerinden API ve veri lisansı sorulmalı; uygulama trafiği kullanılmaz. |
| Investing.com | Resmî destek merkezi kamuya açık API vermediğini bildiriyor; widget koşulları ayrıca okunmalı. | Tarama motoru veya OHLCV kaynağı olarak kullanılmaz; izin verilirse yalnızca gömülü widget değerlendirilir. |
| TradingView | Resmî destek sayfası veri/indikatör değerleri için kamuya açık API olmadığını bildiriyor. Charting Library kendi veya üçüncü taraf veri kaynağı bekler. | Kaynak olarak kullanılmaz. İleride lisanslanan veriyi görselleştirmek için ayrı Charting Library sözleşmesi değerlendirilebilir. |

## Doğrulanmış kaynak notları

İş Bankası’nın BIST veri lisansı sayfası; Düzey 1, Düzey 1+, Düzey 2 ve PİTE paketlerinin uygulama kanallarında kullanıldığını, eşanlı verinin aynı lisansla iki kanalda aynı anda görüntülenemediğini ve verinin Forinvest tarafından sağlandığını belirtir. Sayfa, API ile ham/tarihsel OHLCV teslimi veya üçüncü taraf web sitesinde yeniden gösterim izni taahhüt etmez.

Yapı Kredi’nin herkese açık BIST Indices API örneği, BIST endeks verisinin 15 dakika gecikmeli olabileceğini ve API yoluyla yayınlanabildiğini gösterir. Ancak bu endpoint endeks kapsamındadır; Gümüş Avcısı için gereken tüm pay evreninin tarihli mum-hacim verisi değildir.

Investing.com, sağlayıcı sözleşmeleri nedeniyle kamuya açık API vermediğini; yalnızca koşulları incelenmek üzere web geliştirici araçları/widget seçenekleri sunduğunu açıklar. TradingView ise veri veya indikatör değerlerine erişim sağlayan API sunmadığını; kendi Charting Library ürününün piyasa verisi içermediğini ve kullanıcı tarafından sağlanan veri kaynağı gerektirdiğini belirtir.

## En güvenli entegrasyon sırası

1. Kullanıcının **Finans Invest/QNB Invest** müşteri temsilcisine aşağıdaki dört soruyu yazılı olarak yöneltmesi gerekir: API var mı, OHLCV tarihçesi hangi zaman dilimlerinde var, BIST verisini kendi web uygulamasında göstermek serbest mi, KAP bildirim API’si veya yönlendirme kaynağı veriliyor mu?
2. Cevap olumsuzsa, BIST lisanslı veri dağıtıcısı olarak dxFeed veya Forinvest’e; **BIST Pay verisi, en az 15 dakika gecikme, günlük ve 15dk OHLCV, 250+ bar tarihçe, web dashboardunda yeniden gösterim** koşullarıyla teklif sorulur.
3. KAP akışı için resmî KAP REST API erişimi ayrıca talep edilir. BIST fiyat lisansı bu erişimi otomatik sağlamaz.
4. Sağlayıcı sözleşmesi açıkça izin verirse, API anahtarı Vercel ortam değişkenine eklenir; adapter yalnızca sunucu tarafında çalışır, tüm sonuçlarda kaynak URL’si, bar kapanışı, gözlem zamanı ve gecikme görünür olur.

## Kaynaklar

1. [İş Bankası — Borsa İstanbul Veri Lisansı Paketleri](https://www.isbank.com.tr/borsa-istanbul-veri-lisansi-paketleri)
2. [İş Bankası — API Portal](https://www.isbank.com.tr/api-portal)
3. [Yapı Kredi API Portal — BIST Indices](https://apiportal.yapikredi.com.tr/documentation/marketInformation/bistIndices)
4. [Midas — Resmî ürün sayfası](https://www.getmidas.com/)
5. [Investing.com — Public API erişimi](https://www.investing-support.com/hc/en-us/articles/115005473825-Do-You-Offer-API-Access-at-Investing-com)
6. [TradingView — Data/indicator API erişimi](https://www.tradingview.com/support/solutions/43000474413-i-need-access-to-your-api-in-order-to-get-data-or-indicator-values/)
7. [TradingView — Datafeed API](https://www.tradingview.com/charting-library-docs/latest/connecting_data/datafeed-api/)
8. [TradingView — Kullanım koşulları](https://www.tradingview.com/policies/)
