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
   "title": "Encoders: ranking starts at the tiles",
   "who": "manav",
   "secs": 70,
   "say": [
    "My part is the tile encoder. Every frame becomes forty-five tiles, and those features feed every temporal head and the alarm.",
    "If the encoder cannot rank smoke above clear sky, later stages cannot invent that signal.",
    "We only have image-level labels, so training uses multiple-instance learning. That makes ranking metrics essential.",
    "Important caveat: the encoder comparison is a one-seed proxy. The formal three-encoder, three-seed E1 sweep was cut, and fine-tuned DINOv2 was not run."
   ],
   "left": [
    "Exact MobileNet versus DINOv2 numbers.",
    "Why F1 misled us on MobileNet.",
    "Whether fine-tuning DINOv2 would help."
   ],
   "qa": [
    { "q": "Why not just look at F1?", "a": "Validation is about half positive, so always saying smoke already scores F1 about 0.67. A collapsed encoder can match that F1 while ranking near chance." },
    { "q": "Is this a full E1 matrix?", "a": "No. It is seed zero only: MobileNet mnv3l-v2 versus frozen DINOv2 dinov2s-frozen-v1. We do not claim mean, standard deviation, or seed generalization." },
    { "q": "Did you evaluate fine-tuned DINOv2?", "a": "Not in a formal E1 artifact. That job was cut with the rest of the nine-run matrix." }
   ]
  },
  {
   "title": "MobileNet collapse: F1 hid chance ranking",
   "who": "manav",
   "secs": 85,
   "say": [
    "MobileNet looked fine if you only read tuned F1 on validation: about 0.670, basically the always-smoke baseline.",
    "Average precision was 0.543 and ROC-AUC 0.557. That is near chance on a balanced split.",
    "At a fixed threshold of 0.5, F1 was zero because almost no scores crossed 0.5.",
    "When we inspected tile labels, train, val and test had zero positive tiles. Positives are marked SOURCE_NONE with tile targets of minus one, so tile loss never sees smoke.",
    "That is strong evidence that weak image-level MIL without positive tile supervision can collapse ranking, while F1 stays near the class prior. We do not claim it is the only possible cause."
   ],
   "left": [
    "The exact run id.",
    "Whether architecture capacity also mattered.",
    "How DINOv2 compares on the same protocol."
   ],
   "qa": [
    { "q": "Which run is that?", "a": "encoder-mnv3l-s0-20261116, cache mnv3l-v2. Numbers are from its metrics_val.json, not from the stale tables_val.csv MobileNet rows." },
    { "q": "Are you saying MIL is proven broken?", "a": "No. We say the label contract gave the model no positive tile targets, and the ranking collapse is consistent with that weakness. Other factors can still matter." },
    { "q": "Why ignore tables_val.csv?", "a": "Its MobileNet aggregate mixes v1 and v2. We copy only from metrics_*.json." }
   ]
  },
  {
   "title": "DINOv2 frozen: same labels, real ranking",
   "who": "manav",
   "secs": 75,
   "say": [
    "Frozen DINOv2, trained under the same weak labels, is a different story.",
    "On validation it reaches average precision 0.876 and ROC-AUC 0.839. On held-out test, average precision is 0.762.",
    "MobileNet on the same protocol stays near chance on both splits.",
    "Thresholds were tuned on validation only. This is still n equals one, so we do not invent error bars for the encoder comparison."
   ],
   "left": [
    "Test ROC-AUC.",
    "Temporal gains on top of DINOv2.",
    "Why we still call it a proxy."
   ],
   "qa": [
    { "q": "What is the test ROC-AUC?", "a": "0.724 for DINOv2 frozen and 0.493 for MobileNet, both from metrics_test.json with the validation operating point." },
    { "q": "Is the model production ready?", "a": "No. We say frozen DINOv2 is the stronger encoder candidate under the available one-seed evidence. Multi-seed E1 was cut." },
    { "q": "Run id?", "a": "encoder-dinov2s-frozen-s0-20261117, cache dinov2s-frozen-v1." }
   ]
  },
  {
   "title": "Reload fix: real hub DINOv2 on the checkpoint",
   "who": "manav",
   "secs": 70,
   "say": [
    "Production DINOv2 checkpoints cannot load onto the offline stub used in smoke tests.",
    "Pull request 26 fixed the reload path so we build the real facebookresearch hub backbone, then load weights, and fail clearly if hub access is missing.",
    "I validated that on the real November 17 checkpoint on CPU: a DinoVisionTransformer, dimension 384, 256 patch tokens.",
    "One-fire feature extraction produced shape 81 by 45 by 384 in float16 with valid cache metadata, in an isolated folder so we did not overwrite the shared cache.",
    "That checks loader correctness. It is not a GPU benchmark and not a new quality claim."
   ],
   "left": [
    "Which fire was extracted.",
    "Whether Grad-CAM needed a separate loader.",
    "Hub SSL issues on a fresh machine."
   ],
   "qa": [
    { "q": "Which fire?", "a": "Check fire 20160604_FIRE_rm-n-mobo-c, eighty-one frames." },
    { "q": "Did this need a GPU?", "a": "No. The validation ran on CPU with cached hub weights." },
    { "q": "Is the model better after the reload fix?", "a": "The fix restores the architecture the checkpoint expects. Quality numbers still come from the existing metrics JSON for that run." }
   ]
  },
  {
   "title": "Reproducibility: clone, tests, bit-identical rescoring",
   "who": "manav",
   "secs": 65,
   "say": [
    "On a fresh clone we installed the project, generated fake data, ran two hundred fifty-five tests, and passed the full smoke test.",
    "Separately, rescoring Ayush’s MobileNet predictions reproduced validation F1 0.6704684317718942 and test F1 0.6717329757115184 bit for bit.",
    "Checkpoints and Drive artifacts stayed outside Git."
   ],
   "left": [
    "How long the smoke test took.",
    "Whether DINOv2 was rescored the same way.",
    "Where artifacts live."
   ],
   "qa": [
    { "q": "Why MobileNet for the bit-identical check?", "a": "It was the available real C5 artifact for M-7. The point is that evaluation code plus shared predictions reproduce Ayush’s metrics JSON." },
    { "q": "Are runs committed?", "a": "No. They stay under local SMOKESENTRY_DATA or the team Drive." }
   ]
  },
  {
   "title": "Latency: DINOv2 fits the camera budget",
   "who": "manav",
   "secs": 70,
   "say": [
    "Quality and cost are separate. On Ayush’s workstation GPU, MobileNet encoding is about 9.6 milliseconds per frame, DINOv2 about 50.6, and the full pipeline about 51.4.",
    "On that machine’s CPU the full pipeline is about 0.88 seconds. Cameras send a frame a minute, so both stay inside the budget.",
    "These are Ayush’s forward-only JSON benchmarks, not my laptop. Local production CPU timing for M-5 is still pending.",
    "As temporal context only, GRU T8 on DINOv2 features reaches test average precision 0.795 plus or minus 0.009 with about two false alarms per camera-hour across three seeds."
   ],
   "left": [
    "Exact JSON file names.",
    "Decode and tiling time.",
    "Edge hardware."
   ],
   "qa": [
    { "q": "Did you measure this on your laptop?", "a": "No. I am citing Ayush’s latency JSON. My local M-5 production CPU run is still outstanding." },
    { "q": "Does GRU T8 change the encoder conclusion?", "a": "It is a temporal result on the DINOv2 cache. It does not replace the missing multi-seed encoder matrix." }
   ]
  },
  {
   "title": "Encoder takeaway",
   "who": "manav",
   "secs": 55,
   "say": [
    "Under the available one-seed evidence, use frozen DINOv2 as the encoder.",
    "Treat MobileNet as a collapsed ranking baseline, and do not trust F1 alone.",
    "The reload path and reproducibility checks make that encoder usable for the rest of the pipeline.",
    "We are not calling the system production ready, and we are not claiming a finished E1 sweep."
   ],
   "left": [
    "What Naman covers next.",
    "What Mansi covers for boxes and heatmaps."
   ],
   "qa": [
    { "q": "Bottom line?", "a": "Frozen DINOv2 is the stronger encoder candidate on the verified seed-zero proxy. Formal multi-seed E1 was cut." }
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
