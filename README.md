# SmokeSentry final talk (DATA 255, Group 6)

HTML slides in the same framework as our earlier `data255-talk` deck. Open via githack:

- Slides: https://raw.githack.com/ayushgawai/smokesentry-talk/main/deck.html
- Presenter view (script, timers, Q&A): https://raw.githack.com/ayushgawai/smokesentry-talk/main/presenter.html
- Guide: https://raw.githack.com/ayushgawai/smokesentry-talk/main/guide.html

Current content: Ayush's part (data, evaluation, latency, demo) plus Manav's encoder section
(collapse, DINOv2 proxy comparison, reload validation, reproducibility, cost, takeaway).
To add your part: add `<section class="slide" data-who="<you>">` blocks to `deck.html` and matching
entries (title, who, secs, say, left, qa) to `talk.js` in the same order. Every number must come from a
`runs/*/metrics_*.json`, `runs/latency_*.json` or `index/stats.json` file on the team Drive.
Encoder comparison slides are labeled one-seed proxy (not a formal 3×3 E1).
