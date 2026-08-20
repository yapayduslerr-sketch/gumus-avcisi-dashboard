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
- [ ] Otomatik güncelleme için üretimde çalışan `/api/scheduled/*` Heartbeat endpointini ekle.

## Doğrulama sonrası iyileştirmeler

- [ ] `/api/scheduled/update-market-data` için cron-only kimlik doğrulaması ekle ve Heartbeat auth akışına göre doğrula.
- [ ] BIST/KAP için gerçekten yapılandırılabilir adapter katmanı oluştur; URL ve strateji seçimini yapılandırmadan yönet.
- [ ] Dashboard’da source status `errorMessage` alanını görünür hata durumu olarak göster.
- [ ] BIST kaynağına ait açık kaynak zamanı (`observedAt` veya `lastSuccessAt`) etiketini ayrı göster.
- [ ] Her sinyal kaydında kaynak URL, güncelleme zamanı ve hata/durum bilgisini görünür kıl.
