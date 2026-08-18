# Gümüş Avcısı — Tasarım Fikirleri

## Üç Yönlü Keşif

### 1. Analist Masası
**Çok Kısa Giriş:** Koyu grafit zemin, pirinç tonu ve finans araştırma terminali disiplinini birleştiren yoğun ama sakin bir çalışma yüzeyi. Amaç, karmaşık BIST verisini karar için okunur hâle getirmektir.

**Olasılık:** 0.06

### 2. Gümüş Folyo Editoryal
**Çok Kısa Giriş:** Fildişi arka plan, tipografik ritim ve metalik vurgularla hazırlanmış ekonomik araştırma dergisi hissi. Veri, bağımsız bir editoryal anlatının parçası olarak sunulur.

**Olasılık:** 0.03

### 3. Pazar Atlası
**Çok Kısa Giriş:** Açık taş tonları, harita benzeri çizgiler ve katmanlı veri kartlarıyla araştırma sürecini keşif yolculuğuna dönüştüren bir arayüz. Kullanıcı, ekran üzerinde şirket adaylarını takip eder.

**Olasılık:** 0.08

## Seçilen Yön: Analist Masası

### Tasarım Hareketi
Modern finans yayıncılığı ile 1970’lerin sofistike analist terminallerini buluşturan **editorial data terminal** yaklaşımı.

### Temel İlkeler
1. Veriyi saklamak yerine katmanlamak: ilk bakışta karar, ayrıntıda kanıt.
2. Renk yalnızca anlam taşır: gümüş veri, yeşil olumlu sinyal, mercan risk için kullanılır.
3. Asimetri, görsel hiyerarşi için kullanılır; içerik alanları eşit kutulara bölünmez.
4. Kaynak ve tarih bilgisi her zaman görünür kalarak analitik güven tesis eder.

### Renk Felsefesi
Siyah-kömür zemin, gece piyasası ve ekran disiplini hissi verir. Soğuk gümüş yüzeyler veri katmanlarını belirtir; **Gümüş Avcısı Yeşili** ise yalnızca güçlü aday ve pozitif teyit için ayrılmış, bu markaya özgü belirgin bir sinyal rengidir. Kırık beyaz metin uzun analizlerin göz yormadan okunmasını sağlar.

### Yerleşim Paradigması
Sol tarafta sabit ama dar bir araştırma rayı; sağda ise bir ana “radar masası” vardır. Ana alan klasik kart ızgarası yerine yatay piyasa bandı, kademeli skor alanı ve geniş araştırma panellerinden oluşur. Telefonda ray, açılır bir kontrol çekmecesine dönüşür.

### İmza Öğeleri
1. Altıgen radar/mercek markası ve ekran boyunca yinelenen ince koordinat çizgileri.
2. Gümüş metal şeritler üzerinde mikro tipografiyle tarih, veri kapsamı ve kaynak rozetleri.
3. Aday sıralarında küçük “sinyal çubuğu” ve puana göre dolan yatay konum göstergesi.

### Etkileşim Felsefesi
Kullanıcı filtreledikçe adaylar anında yeniden sıralanır; ayrıntılar yumuşak bir yan panelde açılır. Her etkileşim, analistin not kartları arasında geziniyormuş hissi verir; yüksek frekanslı işlemlerde animasyon minimumda tutulur.

### Animasyon
İlk yüklemede başlık, radar çizgileri ve aday satırları 40–70 ms gecikmelerle görünür. Filtre ve sıralama değişiklikleri 180 ms’lik ease-out ile yalnızca opaklık/transform üzerinden geçer. `prefers-reduced-motion` tercihinde tüm dekoratif hareket devre dışıdır.

### Tipografi Sistemi
Başlıklarda **DM Serif Display** ile araştırma yayını karakteri; veri, etiket ve sayılarda **IBM Plex Mono** ile terminal doğruluğu; paragraflarda **Manrope** ile modern okunabilirlik kullanılır. Skorlar monospaced ve büyük, açıklamalar sakin ve daha geniş satır aralıklıdır.

### Marka Özü
**Gümüş Avcısı, BIST’te erken güçlenen şirketleri kaynak şeffaflığıyla izlemek isteyen araştırma odaklı yatırımcılar için sinyal ve kanıt katmanıdır.**

Kişilik: **titiz, rafine, temkinli**.

### Marka Sesi
Başlıklar kısa, kanıta dayalı ve iddiasız; çağrılar ise kullanıcıyı işlem yapmaya değil, bulguyu incelemeye davet eder. Genel/geçiştirici ifadeler kullanılmaz.

Örnekler: “Puan tek başına tez değildir. Kaynağa inin.”

Örnekler: “Bugünün yüksek sinyalli adayları, yarının kesin kazananları değildir.”

### Kelime Markası ve Logo
İsim; keskin serif karakterli, geniş harf aralıklı bir kelime markasıyla düşünülür. Sembol, bir avcı merceğini ve piyasa radarını çağrıştıran, iç içe iki gümüş halkadan oluşan metinsiz bir işarettir.

### İmza Marka Rengi
**Avcı Yeşili — `#8EE19B`**. Koyu grafit üzerinde yalnızca teyit, ilerleme ve seçili veri için kullanılır.

## Style Decisions

- Kelime markası ve radar/mercek sembolü ilk ekranın kimlik bölgesinde görünür olur; marka, yalnızca sabit menü veya alt bilgiye bırakılmaz.
- Her büyük bölüm, dar bir araştırma/meta veri rayı ile geniş bir kanıt çalışma alanını birlikte kullanır.
- Radar ve koordinat dili; kaynak etiketi, durum göstergesi, sinyal şeridi ve bölüm ayırıcılarında yinelenen, yapısal bir marka mekanizmasıdır.
- Araştırma kuyruğunda ilk tarama sırası: kod → kanıt kaynağı/tarih → doğrulama durumu → risk notu → açıklayıcı metindir.
