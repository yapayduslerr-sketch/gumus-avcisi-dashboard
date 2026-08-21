# Twelve Data BIST OHLCV Probe

## 21 Ağustos 2026

Sunucu tarafındaki mevcut `TWELVE_DATA_API_KEY` ile `THYAO`, `mic_code=XIST`, `interval=15min` ve `outputsize=10` isteği test edildi. Yanıt `status: ok` döndü; 10 adet `datetime`, `open`, `high`, `low`, `close` ve `volume` alanı bulundu. Yanıt meta verisinde sembol `THYAO`, borsa `BIST`, MIC kodu `XIST`, zaman dilimi `Europe/Istanbul` ve aralık `15min` yer aldı. En yeni doğrulanan bar zamanı `2026-08-20 17:45:00` idi.

Twelve Data kendi destek belgesinde `15min` aralığının desteklendiğini ve fiyat serilerinin `/time_series` uç noktasından alındığını belirtir. [1] Bununla birlikte, Borsa İstanbul borsa sayfasında gecikme alanı `EOD` olarak gösterilmektedir. [2] Bu nedenle uygulama yalnızca **15 dakikalık bar aralığı** ifadesini kullanır; sağlayıcının ayrı gecikme beyanı olmadan “15 dk gecikmeli” canlı fiyat iddiası yapmaz.

Üretimde geniş BIST evreni, KAP ile birleşim veya halka açık webde yeniden gösterim kapsamı etkinleştirilmeden önce sağlayıcı kullanım koşulları ayrıca doğrulanmalıdır.

## References

[1]: https://support.twelvedata.com/en/articles/5656039-how-to-get-historical-prices "How to get historical prices — Twelve Data"

[2]: https://twelvedata.com/exchanges/xist "Borsa İstanbul — Twelve Data"
