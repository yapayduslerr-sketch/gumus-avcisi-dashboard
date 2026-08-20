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

- [ ] Heartbeat görevi `TUntPVnLhHi83AmVTAxDB5` için execution loglarını veya Run Now sonucunu kontrol et; callback’in 2xx döndüğünü kanıtla.
- [ ] Scheduled endpoint auth’unu gerçek Heartbeat isteğinde doğrula ve gerekiyorsa platform SDK akışına hizala.
- [ ] Başarılı Heartbeat çalışmasından sonra `source_statuses` kayıtlarının güncellendiğini veritabanında kontrol et.

## TLS engeli sonrası dağıtım doğrulaması

- [ ] Vercel üretim dağıtımında `/api/source-status` ve zamanlanmış güncelleme endpointlerinin erişilebilirliğini doğrula.
- [ ] Manus alan adı TLS hatasından bağımsız, kullanıcı için çalışan Vercel HTTPS adresini otomasyon ve dashboard kaynak durumu için tek doğrulanmış erişim noktası olarak doğrula.

## Vercel erişim blokajı

- [ ] `gumus-avcisi-live-data` Vercel projesinde production deployment iznini proje sahibi hesabıyla doğrula veya yetkiyi düzelt.
- [ ] Vercel ortamına `CRON_SECRET` ekleyip cron endpointinin yetkili çağrılarını etkinleştir.

## Vercel Hobby cron uyarlaması

- [ ] Vercel Hobby planı için cron ifadesini günde bir çalışacak biçime indir ve dashboard açıklamasını bu güncelleme sıklığıyla hizala.
- [ ] Güncellenen üretim deployment’ını başarılı build ile doğrula; `/api/source-status` endpointinin JSON yanıtını kontrol et.
