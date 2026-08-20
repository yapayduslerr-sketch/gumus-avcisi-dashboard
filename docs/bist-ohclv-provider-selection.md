# BIST OHLCV Sağlayıcı Seçimi

**Tarih:** 20 Ağustos 2026  
**Hedef:** Gümüş Avcısı’nın BIST teknik tarama ve grafik ekranlarına en az 15 dakika gecikmeli, kaynaklanabilir ve webde gösterim hakkı açık OHLCV verisi sağlamak.

## Doğrulanmış karşılaştırma

| Ölçüt | Forinvest | dxFeed | Değerlendirme |
|---|---|---|---|
| BIST veri dağıtım yetkisi | Borsa İstanbul’un veri dağıtıcı kuruluş listesindedir. | Borsa İstanbul payları için Level 1/1+, Level 2, gerçek zamanlı/gecikmeli/tarihsel hizmet yayımlar. | İki sağlayıcı da teklif aşamasında değerlendirilebilir. |
| BIST pay kapsamı | Kamu sitesi canlı BIST ve tarihsel veri çözümlerini anlatır; kesin pay evreni sözleşmede teyit edilmelidir. | Kamu ürün sayfası 400+ BIST payı, mumlar ve gerçek zamanlı/gecikmeli/tarihsel servisleri belirtir. | dxFeed’in kamu teknik kapsamı daha açıktır. |
| OHLCV / mum verisi | Tarihsel veriyi yüksek hızla ilettiğini bildirir; bar çözünürlüğü ve REST sözleşmesi teklif aşamasında teyit edilmelidir. | Mum verisi; tarihsel aggregated data ile REST, Java, C, C#, JavaScript ve Python erişimini açıklar. | Teknik prototip ve Python destekli hesaplama için dxFeed daha öngörülebilir görünür. |
| Gecikmeli gösterim | Ürün/abonelik koşuluna bağlıdır; yazılı gecikme bilgisi alınmalıdır. | BIST örnek ekranında verinin en az 15 dakika gecikmeli olduğu, ayrı gerçek zamanlı/gecikmeli servisler bulunduğu yazılıdır. | Kullanıcının hedefiyle uyumludur; sözleşmedeki gecikme teyidi zorunludur. |
| Webde yeniden gösterim | Kamu yasal uyarısı BIST verisinin izinsiz yeniden yayımlanamayacağını söyler. | Veri hizmetleri koşulları ve üçüncü taraf koşulları sözleşme bazlıdır. | **Her iki tarafta da açık, yazılı dashboard/yeniden gösterim hakkı alınmadan yayın yapılmaz.** |

## Öneri

İlk teklif **dxFeed**’den alınmalıdır. Kamu dokümantasyonu, BIST payları için mum, gecikmeli/tarihsel erişim ve API seçeneklerini ayrıntılı olarak yayınlar. Sözleşmede aşağıdaki maddeler kabul edilirse, Gümüş Avcısı için teknik riski en düşük başlangıç seçeneğidir.

Forinvest ikinci teklif adayıdır. Borsa İstanbul’un yetkili dağıtıcı listesinde yer alması ve yerel pazar tecrübesi güçlü avantajdır. Ancak kamu uyarısındaki yeniden yayın kısıtı nedeniyle, Gümüş Avcısı’na özel **API erişimi + web dashboardunda sınırlı gösterim + türetilmiş teknik tarama sonucu üretme** hakkı sözleşmede açıkça yazmalıdır.

## Zorunlu teklif koşulları

1. BIST pay evreni: En az BIST 100, tercihen tüm pay piyasası; sembol değişikliği/delisting metadatası dahil.
2. Barlar: 15 dakikalık ve günlük OHLCV; mümkünse 5 dakika; günlükte minimum 252 işlem günü, tercih edilen tarihçe 5+ yıl.
3. Gecikme: En az 15 dakika gecikmeli ürün; gecikme tanımı, bar kapanış zamanı ve saat dilimi sözleşmede yazılı olmalı.
4. Teslim: HTTPS REST API veya güvenli dosya teslimi; yalnızca sunucu tarafı token; sembol listesi ve rate limit dokümanı.
5. Kullanım hakkı: Gümüş Avcısı web dashboardunda kaynak/adlandırma ile sınırlı gösterim; türetilmiş RSI, MACD, ortalama, hacim ve filtre sonuçları üretme izni.
6. Kaynak izi: Her yanıtın kaynak adı, gözlem zamanı, bar kapanışı ve gecikme bilgisini saklama/gösterme imkânı.
7. Ticari sınır: Tek kullanıcı/ekip, genel web, kullanıcı sayısı, önbellekleme, arşivleme ve CSV dışa aktarma için açık haklar.
8. KAP ayrı kapsamdır: Fiyat verisi sözleşmesinden bağımsız olarak resmî KAP REST erişimi ve kullanım hakkı ayrıca teyit edilir.

## Kaynaklar

1. [Borsa İstanbul — Veri Dağıtıcı Kuruluşlar](https://www.borsaistanbul.com/veriler/veri-yayini/veri-dagitici-kuruluslar)
2. [Forinvest — Kurumsal çözümler ve tarihsel veri](https://www.forinvest.com/)
3. [dxFeed — Borsa İstanbul Payları](https://dxfeed.com/market-data/equities-etfs/borsa-istanbul-equities/)
4. [dxFeed — Türkiye kapsamı](https://dxfeed.com/coverage/turkey/)
5. [dxFeed — Tarihsel veri hizmetleri](https://dxfeed.com/data-services/historical-data-services/)
6. [Borsa İstanbul — VERDA API](https://verda.borsaistanbul.com/index.tr.html)
