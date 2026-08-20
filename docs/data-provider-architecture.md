# Gümüş Avcısı Veri Kaynağı Mimarisi

## Hedef ve yayın ilkesi

Gümüş Avcısı, teknik tarama bulgularını yalnızca **tarihli OHLCV verisi**, **kaynak URL’si**, **gözlem zamanı** ve **gecikme bilgisi** birlikte mevcut olduğunda yayımlar. Her eşleşme teknik araştırma bağlamıdır; yatırım tavsiyesi veya getiri vaadi değildir.

| Veri alanı | Seçilen kaynak rotası | Uygulama biçimi | Yayın önkoşulu |
|---|---|---|---|
| BIST hisse OHLCV | **dxFeed**; Türkiye odaklı alternatif olarak **ForInvest** | Sunucu taraflı lisanslı adapter, sembol eşleme ve tarihli mum-hacim saklama | Ticari gösterim ile türetilmiş teknik indikatör kullanımını kapsayan sözleşme, API anahtarı ve sağlayıcı şeması |
| USD/TRY, Brent, ons altın, BTC/USD | **Twelve Data** | Sunucu taraflı çoklu-varlık adapteri; kartlarda fiyat, değişim, kaynak ve gözlem zamanı | Ticari plan/API anahtarı, sözleşme içindeki çağrı ve yeniden dağıtım kapsamının teyidi |
| KAP bildirimleri | **KAP Veri Yayın Servisi REST API** | Sunucu taraflı resmi adapter; kategori, şirket, tarih ve birincil kayda yönlendirme | Borsa İstanbul veri dağıtım sözleşmesi, MKK yetkilendirmesi, API anahtarı ve uygun IP yetkilendirmesi |

## Neden üç ayrı kaynak katmanı var?

Bir BIST OHLCV sağlayıcısının global emtia, döviz ve kripto kapsamını; global bir API’nin ise KAP’ın resmî makine-okunur bildirim rotasını aynı lisans çerçevesinde sunacağı varsayılmaz. Bu nedenle uygulama, her kaydın kaynak ve lisans bağlamını ayrı taşır. Sadece merkezi bir **uygulama veri sözleşmesi** ortaklaşır.

| Katman | Zorunlu alanlar | Geçersiz veya eksik durumda davranış |
|---|---|---|
| Fiyat/hacim barı | `symbol`, `timestamp`, `open`, `high`, `low`, `close`, `volume`, `sourceUrl` | Teknik model `INVALID_SOURCE` veya `INSUFFICIENT_DATA` verir; sonuç listesi boş kalır. |
| Teknik bulgu | Model kimliği, parametreler, bar kapanışı, gözlem zamanı, gecikme, kaynak URL’si | Kullanıcıya “veri bekleniyor” açıklaması gösterilir; al-sat etiketi üretilmez. |
| KAP bildirimi | Şirket, sembol, yayın zamanı, kategori, konu, birincil URL | Yeni kart oluşturulmaz; KAP alanı API bekleme durumunda kalır. |
| Çoklu-varlık kartı | Sembol, değer, değişim, gözlem zamanı, kaynak adı/URL’si, gecikme | Kart “API beklemede” veya “güncelleme hatası” olarak işaretlenir. |

## Çalışma ve güvenlik mimarisi

Ön yüz yalnızca Gümüş Avcısı API yanıtını tüketir. Sağlayıcı anahtarları tarayıcıya, JSON indirmesine veya istemci günlüklerine aktarılmaz. Anahtarlar, üretimde güvenli ortam değişkeni olarak eklenir. Sunucu tarafı adapteri sağlayıcının ham yanıtını uygulama sözleşmesine dönüştürür; hata gövdesindeki hassas ayrıntılar kullanıcı arayüzüne taşınmaz.

Vercel Hobby cron işlemleri günde bir kezle sınırlı olduğundan, kullanıcı talep ettiğinde yapılan güncelleme ile kaynak tarafında izin verilen önbellekli çağrılar ayrı planlanır. KAP REST API’nin IP allowlist koşulu doğrulanırsa Vercel’in değişken dış IP yapısı uygun olmayabilir. Bu durumda KAP adapteri için sabit dış IP’li küçük bir servis/proxy gerekir; bu servis yalnızca KAP çağrısı yapar ve sonuçları ana uygulamanın veri sözleşmesine aktarır.

## İlk canlı doğrulama notu

Twelve Data anahtarı ile USD/TRY, XAU/USD ve BTC/USD için kaynaklı yanıt alındı. Sağlayıcının varsayılan `BRENT` sembolü, mevcut pakette tarihsel seri çağrısında **Pro veya Venture planı** gerektirdiğini döndürdü. Bu nedenle Gümüş Avcısı Brent kartında fiyat uydurmaz; kartı `KAPSAM BEKLER` durumunda tutar. Kullanıcı, Twelve Data paketini Brent kapsamını içerecek biçimde yükseltebilir veya Brent spot için ayrı bir lisanslı kaynak bağlanabilir.

## Sağlayıcı etkinleştirme sırası

1. Kullanıcı BIST OHLCV sağlayıcısıyla kurumsal kullanım ve teknik indikatör üretimini kapsayan paketi seçer.
2. BIST adapterinin endpoint, kimlik doğrulama şeması ve deneme çağrısı belgelenir; yalnızca sunucu anahtarları eklenir.
3. Twelve Data için ticari plan açılır; kart sembolleri sağlayıcı dokümanındaki sembol listesiyle doğrulanır.
4. KAP REST API sözleşmesi ve IP yetkilendirmesi tamamlanır; ayrı adapter sağlık kontrolü etkinleştirilir.
5. Her kaynak için sağlıklı çağrı, gözlem zamanı, hata modu, model hesaplaması ve CSV çıktısı test edilir.

## Birincil kaynaklar

1. [Borsa İstanbul — Market Data](https://www.borsaistanbul.com/en/market-data)
2. [dxFeed — Borsa İstanbul Equities](https://dxfeed.com/market-data/equities-etfs/borsa-istanbul-equities/)
3. [KAP — API hakkında](https://kap.org.tr/tr/api/about/content-file/8a019492945fbe080194b26d8bed4873)
4. [Twelve Data — Commodities API](https://twelvedata.com/commodities)
