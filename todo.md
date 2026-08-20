# Project TODO

- [x] Gümüş Avcısı dashboard ana ekranını oluştur.
- [x] Araştırma rayı, marka imzası ve mobil yerleşimi uygula.
- [x] KAP doğrulama filtresi ve kaynak kartlarını uygula.
- [x] Üretim derlemesini ve masaüstü/mobil arayüzü doğrula.
- [x] Manus checkpoint sürümlerini oluştur.
- [x] Manus alan adındaki SSL/TLS sorununun harici platform katmanında kaldığını belgeledim; çalışan Vercel production domainini alternatif yayın olarak hazırladım.
- [x] Vercel için statik Vite build ve SPA yönlendirme hazırlığını yap.
- [x] Harici CDN görsel URL’lerini Vercel uyumlu hale getir.
- [x] GitHub repository adını ve görünürlük tercihini kullanıcıdan al.
- [x] Hassas dosyaları ve Manus’a özel yapılandırmaları repository dışı bırak.
- [x] GitHub bağlantısını güvenli oturum üzerinden kur.
- [x] Repository’yi Vercel’e bağla ve production deploy yap.
- [x] Yeni public HTTPS adresini curl ve masaüstü tarayıcıyla doğrula; mobil cihaz doğrulaması kullanıcı tarafında bekliyor.

- [x] Repository görünürlüğünü Public olarak uygula; hassas env, token ve kullanıcı verisi olmadığını son kez kontrol et.

## Canlı BIST ve KAP veri akışı

- [x] BIST piyasa verisi ve KAP bildirimleri için lisans/erişim koşullarını doğrula.
- [x] En az iki uygulanabilir veri güncelleme mimarisini trade-off tablosuyla değerlendir.
- [x] Güncel veri, kaynak durumu ve hata kaydı için veritabanı modelini tasarla.
- [x] Heartbeat uyumlu, idempotent `/api/scheduled/*` güncelleme endpointi ekle.
- [x] BIST ve KAP veri sağlayıcılarını yapılandırılabilir adapter olarak uygula.
- [x] Dashboard’a son güncelleme zamanı, kaynak sağlığı ve kaynak URL/hata durumlarını bağla.
- [x] Vitest testleri, migration doğrulaması ve yerel veri akışı smoke testini tamamla; üretim Heartbeat çalıştırması ayrıca beklemede.

## Seçilen B yaklaşımı — herkese açık gecikmeli akış

- [x] BIST ekranı için 15 dakika gecikmeli durum etiketini ve kaynak zamanını uygula.
- [x] KAP tarafını lisanslı API gelene kadar `KAP API beklemede` durumuyla temsil et.
- [x] Her veri kaydında kaynak URL, son başarılı güncelleme ve hata durumunu göster.
- [x] Public sayfa erişimi için scraping yerine sınırlı, idempotent kaynak adapteri kullan.
- [x] Otomatik güncelleme için üretimde çalışan `/api/scheduled/*` Heartbeat görevini oluştur; görev kimliği `TUntPVnLhHi83AmVTAxDB5`.

## Doğrulama sonrası iyileştirmeler

- [x] `/api/scheduled/update-market-data` için cron-only JWT kimlik doğrulaması ekle ve Heartbeat auth akışına göre doğrula.
- [x] BIST/KAP için yapılandırılabilir adapter katmanı oluştur; URL ve strateji seçimini ortam yapılandırmasından yönet.
- [x] Dashboard’da source status `errorMessage` alanını görünür hata durumu olarak göster.
- [x] BIST kaynağına ait açık kaynak zamanı (`observedAt`) etiketini ayrı göster.
- [x] Her sinyal kaydında kaynak URL, güncelleme zamanı ve hata/durum bilgisini görünür kıl.

## Heartbeat üretim doğrulaması

- [x] Heartbeat görevi `TUntPVnLhHi83AmVTAxDB5` için execution loglarını veya Run Now sonucunu kontrol et; callback’in 2xx döndüğünü kanıtla. Görevin yürütme kaydı oluşmadığı için Vercel daily cron’a geçildi ve eski görev duraklatıldı.
- [x] Scheduled endpoint auth’unu gerçek Heartbeat isteğinde doğrula ve gerekiyorsa platform SDK akışına hizala. Vercel’de `CRON_SECRET` ile yetkisiz erişim 401, Vercel’in platform tetikleyicisiyle yetkili cron çağrısı 200 olarak doğrulandı.
- [x] Başarılı Heartbeat çalışmasından sonra `source_statuses` kayıtlarının güncellendiğini veritabanında kontrol et. Vercel serverless akışı kalıcı `source_statuses` kaydı yazmıyor; canlı `/api/source-status` endpointi on-demand BIST/KAP sağlık JSON’u sağlıyor.

## TLS engeli sonrası dağıtım doğrulaması

- [x] Vercel üretim dağıtımında `/api/source-status` ve zamanlanmış güncelleme endpointlerinin erişilebilirliğini doğrula; canlı endpoint 200 JSON, yetkisiz cron çağrısı 401 döndü.
- [x] Manus alan adı TLS hatasından bağımsız, kullanıcı için çalışan Vercel HTTPS adresini otomasyon ve dashboard kaynak durumu için tek doğrulanmış erişim noktası olarak doğrula.

## Vercel erişim blokajı

- [x] `gumus-avcisi-live-data` Vercel projesinde production deployment iznini proje sahibi hesabıyla doğrula veya yetkiyi düzelt; GitHub commit statüsü Vercel production build için başarıya geçti.
- [x] Vercel ortamına `CRON_SECRET` ekleyip cron endpointinin yetkili çağrılarını etkinleştir; gizli anahtar kullanıcı tarafından eklendi ve endpoint koruması 401 ile doğrulandı.

## Vercel Hobby cron uyarlaması

- [x] Vercel Hobby planı için cron ifadesini günde bir çalışacak biçime indir ve dashboard açıklamasını bu güncelleme sıklığıyla hizala; schedule `0 3 * * *` (UTC) olarak yapılandırıldı.
- [x] Güncellenen üretim deployment’ını başarılı build ile doğrula; `/api/source-status` endpointi 200 JSON yanıtı veriyor. İlk otomatik cron çağrısı bir sonraki günlük çalıştırma penceresinde oluşacak.

## Bekleyen yürütme kanıtı

- [x] Eski Manus Heartbeat görevi `TUntPVnLhHi83AmVTAxDB5` için yürütme kaydı oluşmadığını belgele ve Vercel daily cron’a geçiş nedeniyle görevi devre dışı bırak; görev duraklatıldı.
- [x] Vercel cron endpointini gizli değeri ifşa etmeden yetkili bir çağrıyla veya Vercel cron loguyla doğrula; Vercel `Run` eylemi sonrası endpoint 200 döndü.
- [x] Vercel serverless akışının kalıcı `source_statuses` veritabanı kaydı yazmadığını açıkça belgele; canlı endpointin on-demand kaynak sağlık kontrolü sağladığını ayır.

## Tarama çalışma alanı geliştirmesi

- [x] BIST kaynak durumu ve KAP API bekleme etiketlerinin ne anlama geldiğini arayüzde açıklayan bir durum rehberi ekle.
- [x] 100 puanlık kalite taramasını büyüme, kârlılık kalitesi, nakit/borç, değerleme ve piyasa doğrulaması alt skorlarıyla görünür kıl.
- [x] “Bebek hisse” taraması için kullanıcıdan gelen piyasa değeri, likidite, TTM trendi, FAVÖK ve faaliyet nakit akışı filtrelerini ekle.
- [x] Fiili dolaşım, dolaşımdaki piyasa değeri, ROIC ve büyüme yatırımı ölçütlerini içeren V2 araştırma katmanını ekle.
- [x] Piyasa özeti, artan/azalan/hacim liderleri, izleme listesi ve araştırma notu bileşenlerini ekle; veri yoksa bunu açık durum etiketiyle göster.
- [x] Proje/katalizör taraması ve tekrar etmeyen gelir uyarısını kaynak-temelli araştırma notlarına ekle.
- [x] Çoklu zaman dilimi teknik bağlam rehberini, kesin al-sat sinyali üretmeden araştırma akışına bağla.
- [x] Yeni arayüzün Vitest, responsive görünüm ve yerel production build doğrulamasını tamamla; Vercel deployment adımı sıradaki checkpoint sonrası tetiklenecek.

## Tarama kuralları ve piyasa özeti tamamlayıcıları

- [x] Bebek hisse filtresinin piyasa değeri, 20 gün ortalama hacim, dört dönem TTM satış/kâr trendi, FAVÖK ve CFO kurallarını görünür politika paneli olarak ekle.
- [x] Araştırma kartlarında doğrulanmış/eksik kriterleri ayrı ayrı göster; statik notlardan gelmeyen alanları `TBD` olarak işaretle.
- [x] Artanlar, azalanlar, hacim liderleri ve izleme listesi için ayrı piyasa özeti boş durum panelleri ekle; veri katmanının bağlı olmadığını her panelde açıkça belirt.

## Canlı veri ve kişisel araştırma akışı

- [x] A+B aşamalı kapsam notunu ekle: kullanıcı özellikleri şimdi çalışır; lisanslı fiyat-hacim ve KAP belgesi adapterleri anahtar gelene kadar kapalı kalır.
- [x] KAP lisanslı REST API için anahtar-bağımlı adapter arayüzünü, sağlık kontrolünü ve kaynak/raporlama dönemi alanlarını ekle; erişim yokken `LİSANS GEREKİR` durumu dönüyor.
- [x] Tarihli BIST fiyat-hacim snapshot adapterini, fiyat gecikmesi ve veri kaynağı etiketleriyle ekle; erişim yokken fiyat/hacim uydurmak yerine adapter durumunu göster.
- [x] Cihaz bazlı izleme listesi ve notlar için yerel kalıcılık, veritabanı şeması ve arayüz etkileşimlerini ekle; hesap bazlı senkronizasyon erişim yapılandırmasına bırakıldı.
- [x] Kaynak/katalizör uyarı tercihleri ve kalıcı uyarı kayıtları için veri modeli ile arayüzü ekle; gerçek uyarı olayı yalnızca lisanslı kaynak yapılandırıldığında üretilecek.
- [x] Yeni veri adapterleri, kullanıcı tercihleri ve uyarı sınırları için migration, Vitest ve yerel production build doğrulamasını tamamla.

## Lisanslı B aşaması aktivasyonu

- [ ] KAP veri sağlayıcısı seçildiğinde `KAP_API_BASE_URL` ve `KAP_API_KEY` güvenli ortam değişkenlerini ekle; resmî sağlık çağrısıyla erişimi doğrula. Bloke: kullanıcıda şu an lisanslı KAP erişimi yok.
- [ ] Tarihli BIST fiyat-hacim sağlayıcısı seçildiğinde `BIST_MARKET_API_BASE_URL` ve `BIST_MARKET_API_KEY` güvenli ortam değişkenlerini ekle; ilk snapshot alımını doğrula. Bloke: kullanıcıda şu an lisanslı piyasa verisi erişimi yok.
- [ ] Hesap bazlı bulut senkronizasyonu için Vercel üretim ortamına kullanıcı veritabanı bağlantısını ekleyip cihaz listesini güvenli kullanıcı kapsamına taşı. Bloke: A aşamasında veriler cihazda yerel tutuluyor.

## A aşaması kararı

- [x] Lisanslı sağlayıcı gelene kadar kişisel izleme listesi, notlar, uyarı tercihleri ve açık kaynak sağlığıyla A aşamasını işlet; B adapterlerini `LİSANS GEREKİR` durumunda tut.
- [x] Cihazdaki izleme listesi, notlar ve uyarı tercihleri için JSON dışa aktarma/İçe aktarma akışı ekle.
- [x] Kaynak sağlık durumunu sayfa yenilemeden kontrol eden manuel yenileme etkileşimi ekle.
- [x] A aşaması veri saklama sınırlarını, cihaz değiştirme adımını ve veri silme kontrolünü arayüzde görünür kıl.

## Çalışan HTTPS erişimi

- [x] Manus alan adındaki `ERR_SSL_PROTOCOL_ERROR` hatasını eski erişim kanalı olarak belgele; kullanıcıyı Vercel HTTPS adresine yönlendir.
- [x] Güncel A+B araştırma geliştirmelerini GitHub bağlı Vercel production dağıtımına aktar ve canlı URL’de doğrula; Vercel ana sayfa 200 ve `/api/research-capabilities` JSON 200 dönüyor.

## Teknik tarama, piyasa ve KAP çalışma alanı genişletmesi

- [x] Kaynak URL’si, gözlem zamanı ve OHLCV bütünlüğü geçerli değilse sonuç üretmeyen teknik tarama çekirdeğini ekle; RSI, MACD, Bollinger, hacim eşiği, 10/50 kesişimi, 50/200 bağlamı ve 52-hafta zirve bağlamı için birim testleri yaz.
- [x] Özgün mobil teknik model seçim masası ile döviz, Brent, ons altın ve kripto için kaynak-etiketli API bekleme kartlarını uygula; gerçek veri gelene kadar sayısal sonuç gösterme.
- [x] Seçili teknik modellerin parametre, varsayılan zaman dilimi, minimum geçmiş ve doğrulanmış sonuç satırı sözleşmesini içeren indirilebilir CSV şemasını ekle.
- [x] Özgün Gümüş Avcısı tasarım diliyle mobil odaklı Ana Sayfa, Sinyaller, Piyasalar ve KAP çalışma alanlarını ekle; üçüncü taraf ürünün görsel kimliğini veya metinlerini kopyalama.
- [x] Kullanıcının seçebileceği teknik tarama model kataloğunu oluştur: hareketli ortalama kesişimi, RSI, MACD, Bollinger, hacim, trend gücü, formasyon ve çoklu-model kesişimi.
- [x] Her model için hesaplama tanımını, parametrelerini, gerekli OHLCV kapsamını, geçerli zaman dilimini ve sonuç durumlarını kaynak şeffaflığıyla göster.
- [x] Sinyal sonuç listesi, sembol araması, filtre/sıralama, model etiketi, kaynak zamanı ve CSV dışa aktarımını ekle; tarihli OHLCV yokken gerçek sinyal sonucu uydurma. X Pro sonuçları demo/sentetik etiketi, provider/gözlem zamanı ve CSV uyarı sütunuyla ayrı tutulur.
- [ ] Sembol detay grafiğini gerçek sembol bazlı BIST OHLCV adapterine bağla; mum, hacim, SMA(10/20/50), kaynak/başarı/hata zamanını göster. Grafik bileşeni hazırdır ancak lisanslı BIST OHLCV erişimi olmadığından `bars` şu an boş bekleme durumundadır.
- [x] Piyasa özetinde BIST, döviz, emtia ve kripto göstergelerini ayrı kaynak-etiketli kartlarda göster; doğrulanmış veri yokken bağlı değil durumunu koru. XU100 kartı kaynak/gözlem/fiyat bağlı değil ayrımını, çoklu-varlık kartları ise kaynaklı veya kapsam bekler durumunu gösterir.
- [x] KAP çalışma alanında bildirim kategorileri, sembol/şirket arama, tarih, kaynak URL’si ve birincil kayda yönlendirme görünümünü ekle; lisanslı akış açılana dek açık kaynak bekleme durumunu koru.
- [x] Kullanıcı favorilerini teknik tarama ve piyasa detay ekranlarıyla birleştir; cihaz verisi ve ilerideki hesap-bazlı senkronizasyon ayrımını görünür tut. Favori sembolü, teknik model bağlamı ile piyasa detayında kaynak/gözlem/veri-bekleme ve cihaz notu panellerine bağlandı; hesap-bazlı senkronizasyon ayrı B aşaması olarak etiketlendi.
- [ ] Lisanslı BIST OHLCV ile KAP bildirimleri bağlandığında tarama sonuçları ve KAP kartlarını yalnızca tarihli, kaynak URL’li ve izlenebilir kayıtlarla doldur.
- [x] Yeni teknik model hesapları, veri geçerliliği, CSV çıktısı ve boş/veri hatası durumları için Vitest kapsamı ekle; mobil görünüm, TypeScript ve production build doğrulamasını tamamla.

## Kullanıcının seçtiği kademeli tam-veri hedefi

- [ ] BIST teknik tarama için en az 15 dakika gecikmeli, lisansı ve kullanım koşulları doğrulanmış OHLCV sağlayıcısını seç; sembol kapsamı, güncelleme sıklığı, gecikme ve ticari kullanım koşullarını kaydet.
- [x] Döviz, Brent, ons altın ve kripto kartları için Twelve Data API kaynağını, sembol eşlemesini, gözlem zamanını ve veri lisansı beyanını doğrula; her karta kaynak durumunu bağla. `TWELVE_DATA_API_KEY` Vercel Production/Preview ortamında etkinleştirildi; USD/TRY, XAU/USD ve BTC/USD kaynak/zaman etiketiyle canlı doğrulandı. BRENT, mevcut pakette kapsam dışı olduğundan `KAPSAM BEKLER` durumunda tutuluyor.
- [ ] KAP için resmî/lisanslı makine-okunur bildirim kaynağı seçeneğini ve maliyet/erişim gereksinimlerini kullanıcıya sun; kaynak seçilene kadar KAP kartlarını taranabilir bekleme durumunda tut.
- [ ] Seçilen veri kaynaklarının anahtarlarını yalnızca güvenli ortam değişkenleriyle yapılandır; istemciye anahtar veya sağlayıcı ham yanıtı sızdırma.
- [ ] Teknik tarama ve çoklu-varlık veri yenilemesini sağlayıcı sözleşmesi, Vercel çalışma sınırları ve idempotent güncelleme mimarisiyle uyumlu uygula.

## Kullanıcının önerdiği veri erişim kanalları

- [ ] Finans Invest için resmî API, veri terminali veya dışa aktarma erişimini; BIST OHLCV kapsamını ve webde yeniden gösterim iznini doğrula.
- [ ] İş Bankası ve Midas için resmî geliştirici/veri erişiminin BIST teknik tarama kullanımına uygunluğunu doğrula.
- [x] Investing.com ve TradingView için resmî API/lisans koşullarını incele; izinsiz sayfa kazıma veya oturumlu veri çekme yöntemlerini kapsam dışı bırak.
- [ ] Kullanıcıya, kaynak kapsamı ve yeniden yayın izni teyit edildikten sonra en uygun entegrasyon kararını sun; yalnızca seçilen izinli kaynağın adapterini etkinleştir.

## Seçilen lisanslı BIST OHLCV rotası

- [ ] Forinvest ve dxFeed’den BIST pay evreni için günlük ile 15 dakikalık OHLCV, minimum tarihçe, gecikme, API teslim biçimi ve web dashboardunda yeniden gösterim koşullarını yazılı olarak doğrula.
- [x] Forinvest/dxFeed teklif isteğinde teknik tarama, kaynak URL’si, gözlem zamanı, 250+ günlük bar ve sınırlı web gösterimi kullanım senaryosunu açıkça belirt; gönderime hazır teklif metnini `docs/bist-ohclv-provider-request.md` içinde oluştur.
- [ ] Sağlayıcı seçildikten sonra `BIST_MARKET_API_BASE_URL`, `BIST_MARKET_API_KEY`, sembol eşleme ve gecikme alanlarını güvenli biçimde yapılandır; ham sağlayıcı yanıtını istemciye geçirme.
- [ ] Tarihli BIST OHLCV ile teknik model kesişimi, sembol grafiği, artan/azalan ve hacim lideri sonuçlarını kaynak/zaman görünürlüğüyle etkinleştir.

## SSL/TLS hatalı alan adını kullanıcı akışından çıkarma

- [x] `gumusdash-jhnr3rxf.manus.space` alan adını uygulama içi metinler, paylaşım notları ve kullanıcıya sunulan erişim yönlendirmelerinden kaldır; bu alan adını hiçbir kullanıcı akışında çalışma adresi olarak gösterme.
- [x] `https://gumus-avcisi-live-data.vercel.app/` adresini tek doğrulanmış çalışma URL’si olarak belgelerde ve kullanıcı iletişimi şablonlarında sabitle.
- [x] Vercel URL’sinin ana sayfa ile piyasa/kaynak API uç noktalarında HTTPS 200 döndüğünü yeniden doğrula; hata veren Manus alan adını platform sertifika sorunu olarak açıkça ayır.

## manus.space dışında alternatif erişim

- [x] `manus.space` uzantısı içermeyen geçici TLS önizleme bağlantısını oluştur ve HTTP/TLS erişimini doğrula. Alternatif URL TLS 1.3 ve ana sayfa/API için HTTP 200 döndü.
- [x] Kullanıcı iletişiminde `manus.space` alan adını çalışma bağlantısı olarak kullanma; kalıcı erişim için yalnızca Vercel URL’sini, geçici doğrulama için alternatif bağlantıyı ayır.

## Gümüş Avcısı X Pro — sağlayıcıdan bağımsız araştırma altyapısı

- [x] Uygulama/API katmanı ile sağlayıcı katmanını ayıran, `mock`, `forinvest` ve `dxfeed` seçimlerini tek sözleşmede yöneten provider adapter kayıt sistemini tasarla.
- [x] Kaynak belirtilmeden gerçek BIST fiyatı, hacmi veya KAP bildirimi üretmeyen; yalnızca açık `DEMO / SENTETİK — CANLI VERİ BAĞLI DEĞİL` etiketi altında çalışan sandbox veri sözleşmesini oluştur.
- [x] Demo senaryolarında gerçek yatırım sonucu, gerçek KAP olayı veya gerçek zamanlı BIST fiyatı iddiası kullanma; demo kimlikleri, zamanları ve kaynak durumunu canlı kayıtlardan teknik olarak ayır.
- [x] Teknik, finansal, değerleme, KAP/katalizör ve risk metriklerini taşıyacak sembol gözlemi, OHLCV, olay ve risk veri modellerini oluştur.
- [x] Trend, momentum, hacim, finansal kalite, büyüme, değerleme, KAP/öykü ve risk ayarlamasından oluşan açıklanabilir 100 puanlık kalite/fırsat skor motorunu oluştur.
- [x] Hacim ivmesi, momentum ivmesi, trend dönüşü, kırılım yakınlığı, 52 hafta bağlamı, RSI, volatilite ve fiyat-hacim teyidini kullanan ayrı Early Score motorunu oluştur.
- [x] Risk skoru, seviye sınıflandırması ve katkı/düşürücü açıklamaları oluştur; skor ve erken aday kararını ayrı tut.
- [x] Her sonuçta skoru yükselten/düşüren faktörleri, hesap parametrelerini ve kaynak durumunu görünür kıl.
- [x] X Pro ana sayfasında veri durumu, taranan evren, adaylar, erken adaylar, hacim/trend hareketleri, KAP durumu ve riskli hareketler için açık canlı/demo boş durumlarını uygula.
- [x] Sembol detay ekranında skorlar, teknik/fundamental/değerleme/risk/KAP bölümleri, zaman dilimli grafik iskeleti ve kaynak/uyarı katmanlarını uygula.
- [x] X Pro sembol detayında 1D/5D/1M/3M/6M/1Y/5Y zaman dilimi denetimleri ile mum-hacim/ortalama grafik iskeletini; demo ve canlı kaynak ayrımını görünür tutarak uygula.
- [x] Kullanıcının eşik seçerek tarama başlatabildiği filtreleme motorunu; sonuç yoksa nedenini ve veri eksiklerini açıkça gösteren çalışma alanıyla uygula.
- [x] Favorilerde skor/erken skor/risk/fiyat/hacim değişim sözleşmesini oluştur; veri yokken tarihsel değişim üretme.
- [x] Elenenler ile “Neden seçilmedi?” alanlarını, kural-temelli açıklama ve veri eksikliği ayrımıyla uygula.
- [x] Gerçek tarihli OHLCV gelmeden performans iddiası üretmeyen; 5/20/60/120 gün forward getiri, kazanma oranı ve kayıp/kazanç ölçümlerine hazır backtest sözleşmesini oluştur.
- [x] X Pro motorları için demo ayrımı, skor açıklanabilirliği, filtreleme ve veri bütünlüğünü kapsayan Vitest testleri ile mobil/production doğrulamasını tamamla.
- [x] Ana araştırma masasından X Pro çalışma alanına açık ve erişilebilir geçiş ekle; çalışma adresi ayrımını koru.
- [x] “Gümüş Avcısı X Pro nasıl çalışır?” metodoloji görünümünde veri → filtre → teknik → momentum → kalite → değerleme → olay → risk → Early Score → sıralama zincirini ve ağırlıkları açıkla.
- [x] X Pro dashboardunda `/api/xpro-overview` için ayrı yüklenme, istek hatası ve veri yok durumlarını göster; bunları filtre boş durumundan ayır.
- [x] Filtre sonucu boş olduğunda arama terimi, Quality/Early/Risk eşikleri ve veri eksikliği/istek hatası bağlamına göre neden açıklaması üret ve görünür kıl.
