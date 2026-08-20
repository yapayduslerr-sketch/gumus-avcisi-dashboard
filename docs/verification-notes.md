# Doğrulama Notları

## 20 Ağustos 2026 — Piyasa bağlamı HMR kontrolü

Kaynak koduna XU100 kaynak kartı eklendikten sonra üretim derlemesi başarılı oldu. Ancak açık yerel önizleme oturumunda piyasa bağlamı bölümünde önceki kart dizisi görünmeye devam etti. Bu nedenle canlı doğrulamadan önce geliştirme sunucusu yeniden başlatılmalı ve aynı bölüm yeni oturumda tekrar kontrol edilmelidir.

Yeniden başlatma ve sorgu parametreli yükleme sonrasında tarayıcı DOM denetimi, `Pay piyasası · XU100 · 15 dk gecikmeli · FİYAT BAĞLI DEĞİL` kartının oluşturulduğunu doğruladı. Ekran görüntülerindeki görünmeme, bağlantıdaki ankora rağmen görünümün üst konuma sıçramasından kaynaklandı; render hatası değildir.

Favori detay paneli için tarayıcı doğrulamasında, otomasyonla yapılan ilk “Seçili kaydı ekle” tıklamasından sonra test oturumunun yerel saklama anahtarı oluşmadı ve konsolda çalışma zamanı hatası görülmedi. Uygulama yardımcı fonksiyonları birim testte kapsanıyor; kullanıcı akışında aynı olayın ayrıca tekrar doğrulanması gerekir.

Tarayıcı içinden yeniden tetiklenen favori ekleme olayı, `gumus-avcisi.watchlist.v1` içinde `INDES` kaydını oluşturdu. React durumu güncellendiğinde teknik model alanında `CİHAZ FAVORİSİ` ve seçili model bağlamı; piyasa alanında ise `İZLEMEDE`, kaynak/gözlem, veri bekleme ve cihaz notu panelleri görünür hale geldi.
