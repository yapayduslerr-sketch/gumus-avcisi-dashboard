# Vercel TLS Recheck

## 21 Ağustos 2026

Tek çalışma adresi olan `https://gumus-avcisi-live-data.vercel.app/` için DNS, TLS ve HTTP kontrolleri tekrar yapıldı.

| Kontrol | Sonuç |
| --- | --- |
| DNS | `gumus-avcisi-live-data.vercel.app` çözümlemesi başarılı |
| TLS | `*.vercel.app` sertifikası, Google Trust Services `WR1` zinciri tarafından doğrulandı |
| HTTP | Ana sayfa `HTTP/2 200` döndü |
| Uygulama içi alan adı taraması | `manus.space` ve eski alternatif alan adı referansı bulunmadı |

Bu nedenle kullanıcı erişimi için yalnızca Vercel HTTPS adresi paylaşılır. Kontrol/önizleme sürüm bağlantıları son kullanıcı erişim adresi değildir.
