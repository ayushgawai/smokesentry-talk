// Shared talk data, used by presenter.html (read-aloud notes, timers) and guide.html (full script + Q&A).
// say  = exact words to read, in plain language
// left = what we leave out on purpose, so the audience asks about it
// qa   = the questions those gaps invite, with short answers (the slide's speaker answers)
// secs = target time for the slide
// Every number comes from runs/*/metrics_*.json, runs/latency_*.json or index/stats.json (team Drive SmokeSentry/).
window.TALK = {
 "speakers": {
  "ayush": { "name": "Ayush Gawai", "color": "#0d9488", "part": "Data, evaluation and demo" },
  "manav": { "name": "Manav Patel", "color": "#2563eb", "part": "Encoders" },
  "naman": { "name": "Naman Chheda", "color": "#d97706", "part": "Temporal models and results" },
  "mansi": { "name": "Mansi Verma", "color": "#db2777", "part": "Detector and explanations" }
 },
 "slides": [
  {
   "title": "Data: 524 fires, split by fire",
   "who": "ayush",
   "secs": 100,
   "say": [
    "Our data is FIgLib from HPWREN. Each fire is about eighty camera frames, one a minute, from forty minutes before smoke first appears to forty minutes after.",
    "We split by fire, never by frame, so no view of a test fire is ever seen in training. The nine fires with public bounding boxes are kept aside as a check set.",
    "In total we use 524 sequences and 41,447 frames. Every frame is cut into 45 overlapping tiles of 224 pixels.",
    "Two facts drove everything else. Every split is about half smoke frames, so a model that always says smoke already scores F1 0.67. That is why we report ranking metrics next to F1.",
    "And 98 fires have missing frames. We never fill them in. The temporal models get the real time gap as an input."
   ],
   "left": [
    "Why we did not use SmokeyNet's published split.",
    "How the labels are made (no smoke masks).",
    "What test2 is used for.",
    "Why two sequences were dropped."
   ],
   "qa": [
    { "q": "Why not use SmokeyNet's split, so you can compare to its F1?", "a": "Its split list was not reachable, so we made our own: by fire, seeded, 60/20/20, with 2022 and later held out. Because the split differs, we do not claim a direct comparison with SmokeyNet's published F1." },
    { "q": "How do you know which tile has smoke?", "a": "We don't. FIgLib's smoke masks are not public, so labels are per frame: offset zero or later means smoke. The encoder learns tile scores with multiple-instance learning, where the frame score is pooled from the 45 tiles." },
    { "q": "What is test2?", "a": "192 sequences from 2022 onward. We held them out completely as a later-period test. We did not score them in this project." },
    { "q": "Why 524 and not 526?", "a": "One train sequence has no time offsets in its filenames, and one test2 archive downloaded as a 150-byte file. Both are recorded in our data notes." }
   ]
  },
  {
   "title": "Evaluation: tune on val, score test once",
   "who": "ayush",
   "secs": 100,
   "say": [
    "This is how we kept the numbers honest. Everything is chosen on validation: early stopping, the frame threshold, and the alarm rule.",
    "The alarm fires when the smoke probability stays above theta for k frames in a row.",
    "A temporal model is not allowed to win by raising more false alarms, so its alarm rate is capped at the single-frame baseline's rate.",
    "Only after the code freeze did we score the test split, once per model. That is 45 runs, and their settings come from validation predictions only.",
    "We report three kinds of numbers: ranking quality, penalized time to detection, where a missed fire costs its whole horizon, and false alarms per camera-hour, with the raw counts."
   ],
   "left": [
    "The exact theta and k grid.",
    "Why penalized time to detection instead of plain time to detection.",
    "What counts as one false alarm.",
    "How big the val to test drop is."
   ],
   "qa": [
    { "q": "What grid did you search for the alarm?", "a": "Theta from 0.30 to 0.90 in steps of 0.05, plus the tuned frame threshold, and k of 1, 2 or 3 consecutive frames. We take the lowest penalized time to detection that stays under the false-alarm cap." },
    { "q": "Why penalize misses?", "a": "Plain time to detection only averages the fires a model catches, so a model that misses hard fires looks fast. Penalized time charges each missed fire its whole observed post-ignition horizon." },
    { "q": "What is one false alarm?", "a": "One separate alarm run that starts before ignition. We divide by the pre-ignition camera-hours, 42.6 hours on validation, and we always show the event count next to the rate." },
    { "q": "Did results hold up on test?", "a": "They dropped. For example, the single-frame DINOv2 encoder goes from average precision 0.876 on val to 0.762 on test, and GRU T8 from 0.897 to 0.795. That is why we quote test numbers as the headline." }
   ]
  },
  {
   "title": "Latency: real time even on a CPU",
   "who": "ayush",
   "secs": 90,
   "say": [
    "Is this deployable? We timed one frame, which is 45 tiles, with 50 warm-up runs and 200 timed runs, on our workstation's RTX 5080 laptop GPU and its Core Ultra 9 CPU.",
    "The full pipeline, DINOv2 plus the GRU head and the cross-tile transformer, takes 51 milliseconds per frame on the GPU and 0.88 seconds on the CPU.",
    "HPWREN cameras send one frame a minute, so even a CPU keeps up easily.",
    "Almost all of the cost is the encoder. DINOv2 is five to six times slower than MobileNetV3, but it is the only encoder that actually learned to see smoke."
   ],
   "left": [
    "What is not included in the timing.",
    "Whether it would run on an edge device.",
    "Batching several cameras."
   ],
   "qa": [
    { "q": "What does the timing leave out?", "a": "It is the model forward pass only. Image decoding, resizing and tiling are not included, and neither is model loading. Those are one-off or cheap next to the encoder on the CPU." },
    { "q": "Could this run at the camera?", "a": "Not measured. Under one second per frame on a laptop CPU suggests a small edge box could keep up with a one-frame-per-minute camera, but we did not test any edge hardware." },
    { "q": "How many cameras could one GPU handle?", "a": "We did not benchmark batching. At 51 ms per frame and one frame per minute per camera, a single GPU has a lot of headroom, but we only report the number we measured." }
   ]
  },
  {
   "title": "Live demo: replay a real test fire",
   "who": "ayush",
   "secs": 110,
   "say": [
    "Now the live demo. The replay app only reads saved prediction files, so it needs no GPU.",
    "I'll pick a test fire, our GRU T8 model and the detector, and press play.",
    "Watch the timeline: the probability jumps right after the ignition line, and the alarm fires about three minutes after the first visible plume, using exactly the operating point from our tables.",
    "Now I switch to the encoder run. The two tiles that contain the plume light up at 1.0, even though we never had a single smoke mask. And the detector box lands on the same smoke.",
    "We picked these three fires by eye before looking at any model output: a clear plume, a cloudy morning and one with a missing frame."
   ],
   "left": [
    "Why the tile grid comes from the encoder, not the temporal model.",
    "False alarms on this fire.",
    "What happens on the cloudy fire."
   ],
   "qa": [
    { "q": "Why switch runs to show the tiles?", "a": "The temporal head's tile output is only ever trained on pre-ignition negatives, because FIgLib has no tile labels, so it predicts near zero everywhere. The encoder's multiple-instance tile scores are the ones that localize smoke." },
    { "q": "Did it raise false alarms on this fire?", "a": "Yes, two short ones, about nine and seven minutes before ignition. Overall on test, GRU T8 raises about 2.0 false alarms per camera-hour, roughly half of the single-frame encoder's 4.9." },
    { "q": "What if the live demo fails?", "a": "Naman has a 50-second screen recording of the same replay on his laptop." }
   ]
  }
 ]
};
