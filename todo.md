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

- [ ] KAP veri sağlayıcısı seçildiğinde `KAP_API_BASE_URL` ve `KAP_API_KEY` güvenli ortam değişkenlerini ekle; resmî sağlık çağrısıyla erişimi doğrula.
- [ ] Tarihli BIST fiyat-hacim sağlayıcısı seçildiğinde `BIST_MARKET_API_BASE_URL` ve `BIST_MARKET_API_KEY` güvenli ortam değişkenlerini ekle; ilk snapshot alımını doğrula.
- [ ] Hesap bazlı bulut senkronizasyonu için Vercel üretim ortamına kullanıcı veritabanı bağlantısını ekleyip cihaz listesini güvenli kullanıcı kapsamına taşı.
