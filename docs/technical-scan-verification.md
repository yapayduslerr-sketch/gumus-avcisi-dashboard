# Teknik Tarama Doğrulaması

## 21 Ağustos 2026

Yerel tarayıcı doğrulamasında teknik çalışma alanına `THYAO` girilip **Taramayı çalıştır** eylemi tetiklendi. Uygulama, sunucu tarafındaki `/api/bist-ohlcv?symbol=THYAO` endpointinden kaynaklı 15 dakikalık barları aldı ve teknik model hesaplarını yalnızca bu yanıt geldikten sonra gösterdi.

| Kontrol | Sonuç |
| --- | --- |
| Endpoint durumu | `READY` |
| Sembol | `THYAO` |
| Bar sayısı | 300 adet 15 dakikalık OHLCV barı |
| Model sonucu | RSI Momentum ve MACD Kesişimi değerlendirildi; bu gözlemde ikisi de eşleşmedi |
| Görsel çıktı | Mum/hacim grafiği ile SMA(10/20/50) katmanları çizildi |
| Şeffaflık | Her bulguda sağlayıcı etiketi, kaynak URL’si ve gözlem zamanı gösterildi |
| Anahtar koruması | Endpoint yanıtında API anahtarı veya ham sağlayıcı gövdesi bulunmadı |

Sağlayıcının yanıtı 15 dakikalık **bar aralığını** doğruladı; gecikme dakika değeri ayrıca döndürülmediği için uygulama bu sonucu 15 dakika gecikmeli canlı fiyat olarak etiketlemez.
