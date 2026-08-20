# Gümüş Avcısı — BIST Araştırma Masası

Gümüş Avcısı, BIST araştırma sonuçlarını kaynak şeffaflığı, KAP doğrulaması ve analist masası estetiğiyle sunan statik React/Vite dashboardudur.

## Yayın

Bu repository Vercel üzerinde Vite framework’ü ile çalışacak şekilde yapılandırılmıştır. Production build `pnpm exec vite build` komutuyla alınır ve çıktı `dist/public` klasöründe oluşur. SPA yönlendirmesi `vercel.json` içindeki fallback kuralıyla sağlanır.

| Kaynak | Adres |
|---|---|
| Public GitHub repository | https://github.com/yapayduslerr-sketch/gumus-avcisi-dashboard |
| Vercel production | https://gumus-avcisi-vercel.vercel.app/ |

## Yerel geliştirme

Önce bağımlılıkları yükleyin, ardından geliştirme sunucusunu başlatın:

```bash
pnpm install
pnpm dev
```

Production build kontrolü için:

```bash
pnpm exec vite build
```

## Veri ve kapsam notu

Arayüzdeki adaylar ve araştırma açıklamaları, proje kaynak notlarında belirtilen tarama sonuçlarını temsil eder. Bu site yatırım tavsiyesi, getiri garantisi veya kişiselleştirilmiş finansal danışmanlık sunmaz. Güncel kararlar için Borsa İstanbul, KAP ve ilgili şirketlerin birincil açıklamaları ayrıca kontrol edilmelidir.
