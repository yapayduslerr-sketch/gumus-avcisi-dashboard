# Veri Sağlayıcısı Araştırma Notu

**Referans tarihi:** 20 Ağustos 2026, GMT+3. Bu not, Gümüş Avcısı’nda teknik tarama, çoklu-varlık piyasa kartları ve KAP bildirim akışı için kaynak seçimine hizmet eder.

| Kaynak / aday | Doğrulanan kapsam | Uygunluk değerlendirmesi |
|---|---|---|
| Borsa İstanbul kamu veri sayfası | Günlük/tarihsel dosyalar ve sınırlı güncel veri sınıfları sunar. | Tam hisse evreni için gecikmeli OHLCV tarama servisi değildir; kaynak sağlığı ve resmî referans olarak kullanılabilir. |
| Yapı Kredi BIST Indices API | Kimlik doğrulama olmadan BIST 30/50/100 endeks metrikleri sağladığını ve verilerin 15 dakika gecikmeli olduğunu açıklar. | Endeks kartı için potansiyel kaynak; tüm BIST hisseleri, tarihsel mumlar veya KAP akışı için yeterli değildir. |
| ForInvest | Yatırım odaklı yazılım ve tarihsel piyasa veri çözümleri sunduğunu belirtir. | Türkiye odaklı kurumsal alternatif; dağıtım lisansı, API biçimi, sembol evreni ve fiyatlandırma satış görüşmesinde teyit edilmelidir. |
| dxFeed | Borsa İstanbul için 400+ hisse, mumlar, en az 15 dakika gecikmeli demo, gerçek zamanlı/gecikmeli/tarihsel ve API/dosya teslimi kapsamı belirtir. | Tam teknik tarama için güçlü kurumsal aday; kullanım ve yeniden dağıtım lisansı ile ücret teklifi gerekir. |
| iTick | BIST için REST fiyat, tarihsel mum, hacim ve çoklu zaman dilimi uçları ile token tabanlı erişim iddia eder; yeniden dağıtım izinsiz yasak olduğunu da belirtir. | Hızlı teknik prototip adayı olabilir; ticari webde yayın/yeniden dağıtım hakkı, veri gecikmesi ve servis seviyesi sözleşme öncesinde yazılı teyit edilmelidir. |
| KAP Veri Yayın Servisi REST API | Bildirim listesi/detayı, ekler, şirket/fon listeleri ve hak kullanım durumları sağlar. Erişim için Borsa İstanbul ile veri dağıtım sözleşmesi, MKK yetkilendirmesi, IP bazlı izin ve API anahtarı gerekir. | KAP kartlarını otomatik ve izlenebilir doldurmak için resmî hedef kaynaktır. Vercel’in değişken çıkış IP’si nedeniyle sağlayıcıyla sabit IP veya uygun yetkilendirme modeli ayrıca çözülmelidir. |
| Twelve Data | Döviz, kripto, altın spot ve Brent spot dahil emtia için dakikalık REST güncellemeleri ile WebSocket akışı; sayfasında ticari kullanım ve yeniden dağıtım desteği belirtir. | Döviz, Brent, ons altın ve kripto kartları için tercih edilen aday; ticari plan ve çağrı kapasitesi satın alma öncesinde teyit edilmelidir. |

## Mimarî sonucu

Gümüş Avcısı’nın teknik tarama katmanı, yalnızca sağlayıcının ticari webde gösterim ve türetilmiş indikatör/sinyal üretimine izin veren bir sözleşmeyle gerçek veri üretmelidir. KAP için yüksek yoğunluklu site taraması yapılmamalı; resmî REST API aboneliği etkinleşene kadar arayüz, kaynak URL’li açık bekleme durumunu korumalıdır. Önerilen başlangıç kombinasyonu; BIST OHLCV için dxFeed veya Türkiye odaklı alternatif olarak ForInvest, çoklu-varlık kartları için Twelve Data ve bildirim akışı için KAP REST API’dir.

## Birincil kaynaklar

1. [Borsa İstanbul — Market Data](https://www.borsaistanbul.com/en/market-data)
2. [Yapı Kredi API Portal — Bist Indices](https://apiportal.yapikredi.com.tr/documentation/marketInformation/bistIndices)
3. [dxFeed — Borsa Istanbul Equities](https://dxfeed.com/market-data/equities-etfs/borsa-istanbul-equities/)
4. [KAP — Veri Yayın Servisi REST API Entegrasyonu](https://kap.org.tr/tr/api/about/content-file/8a019492945fbe080194b26d8bed4873)
5. [MKK — KAP](https://www.mkk.com.tr/kurumsal-yonetim-hizmetleri/kap-kamuyu-aydinlatma-platformu)
6. [ForInvest](https://www.forinvest.com/)
7. [iTick — Türkiye Borsa API rehberi](https://blog.itick.org/en/stock-api/turkey-stock-api-bist-real-time-depth-historical-data-technical)
8. [Twelve Data — Commodities API](https://twelvedata.com/commodities)
